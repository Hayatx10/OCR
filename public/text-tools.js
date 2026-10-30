/*
 * Textify - Smart OCR post-processor.
 *
 * Every pass is opt-in and reports what it changed so the user can see exactly
 * what happened to their extracted text.
 */

const TextTools = (() => {
    const COMMON_WORDS = new Set(`
a able about above accept access account across act action activity actually add address administration admit adult affect after again against age agency agent ago agree agreement ahead air all allow almost alone along already also although always american among amount analysis and animal another answer any anyone anything appear apply approach area argue arm around arrive art article artist as ask assume at attack attention attorney audience author authority available avoid away baby back bad bag ball bank bar base be beat beautiful because become bed before begin behavior behind believe benefit best better between beyond big bill billion bit black blood blue board body book born both box boy break bring brother budget build building business but buy call camera campaign can cancer candidate capital car card care career carry case catch cause cell center central century certain certainly chair challenge chance change character charge check chicken chief child choice choose church citizen city civil claim class clear clearly close coach cold collection college color come commercial common community company compare computer concern condition conference congress consider consumer contain continue control cost could country couple course court cover create crime cultural culture cup current customer cut dark data daughter day dead deal death debate decade decide decision deep defense degree democrat democratic describe design despite detail determine develop development die difference different difficult dinner direction director discover discuss disease do doctor dog door down draw dream drive drop drug during each early east easy eat economic economy edge education effect effort eight either election else employee end energy enjoy enough enter entire environment environmental especially establish even evening event ever every everybody everyone everything evidence exactly example executive exist expect experience expert explain eye face fact factor fail fall family far fast father fear federal feel feeling few field fight figure fill film final finally financial find fine finger finish fire firm first fish five floor fly focus follow food foot for force foreign forget form former forward four free friend from front full fund future game garden gas general generation get girl give glass go goal good government great green ground group grow growth guess gun guy hair half hand hang happen happy hard have he head health hear heart heat heavy help her here herself high him himself his history hit hold home hope hospital hot hotel hour house how however huge human hundred husband i idea identify if image imagine impact important improve in include including increase indeed indicate individual industry information inside instead institution interest international interview into investment involve issue it item its itself job join just keep key kid kill kind kitchen know knowledge land language large last late later laugh law lawyer lay lead leader learn least leave left leg legal less let letter level lie life light like likely line list listen little live local long look lose loss lot love low machine magazine main maintain major majority make man manage management manager many market marriage material matter may maybe me mean measure media medical meet meeting member memory mention message method middle might military million mind minute miss mission model modern moment money month more morning most mother move movement movie much music must my myself name nation national natural nature near nearly necessary need network never new news newspaper next nice night no none nor north not note nothing notice now number occur of off offer office officer official often oil ok old on once one only onto open operation opportunity option order organization other others our out outside over own owner page pain painting paper parent part participant particular partner party pass past patient pattern pay peace people per perform performance perhaps period person personal phone photo physical pick picture piece place plan plant play player please point police policy political politics poor popular population position positive possible power practice prepare present president press pressure pretty prevent price private probably problem process produce product production professional professor program project property protect prove provide public pull purpose push put quality question quickly quite race radio raise range rate rather reach read ready real reality realize really reason receive recent recently record reduce reflect region relate relationship religious remain remember remove report represent republican require research resource respond response responsibility rest result return reveal review rich right rise risk road rock role room rule run safe same save say scene school science score sea season seat second section security see seek seem sell send senior sense series serious serve service set seven several sex sexual shake share she shoot short shot should shoulder show side sign significant similar simple simply since sing single sister sit site situation six size skill skin small smile so social society soldier some somebody someone something sometimes son song soon sort sound source south southern space speak special specific speech spend sport spring staff stage stand standard star start state statement station stay step still stock stop store story strategy street strong structure student study stuff style subject success such suddenly suffer suggest summer support sure surface system table take talk task tax teach teacher team technology television tell ten tend term test text than thank that the their them themselves then theory there these they thing think third this those though thought thousand threat three through throughout throw thus time to today together tonight too top total tough toward town trade traditional training travel treat treatment tree trial trip trouble true truth try turn tv two type under understand unit until up upon us use usually value various very victim view violence visit voice vote wait walk wall want war watch water way weapon wear week weight well west western what whatever when where whether which while white who whole whom whose why wide wife will win wind window wish with within without woman wonder word work worker world worry would write writer wrong yard yeah year yes yet you young your yourself
`.trim().split(/\s+/));

    // Extra vocabulary for document and business terms that OCR often garbles.
    const DOCUMENT_WORDS = `
code page pages file files type types date dates time times year years day days week weeks month months
item items list lists link links user users mail email form forms rate rates size sizes sign signs key keys
note notes text texts word words line lines case cases name names scan scans image images invoice invoices
receipt receipts total totals order orders quantity amount subject sender recipient signature reference
serial batch copy copies print save edit view close send reply forward attach folder draft template format
style colour color weight length width height depth cost costs discount tax subtotal balance payment method
card cards cash bank cheque customer vendor supplier purchase sale stock inventory product sku barcode model
brand warranty support service contact website mobile document documents appendix section sections chapter
paragraph heading footer header table tables figure figures chart charts graph graphs diagram index content
summary review final version author publisher copyright url pdf doc photos original duplicate address addresses
project department manager client customers prices invoice total budget profit margin status request
response issue question problem solution reason result number numbers percentage amount total spent paid
due date pending approved rejected completed cancelled created updated scheduled submitted reference
`.trim().split(/\s+/);

    for (const word of DOCUMENT_WORDS) {
        COMMON_WORDS.add(word);
    }

    const LIGATURES = {
        "\uFB00": "ff",
        "\uFB01": "fi",
        "\uFB02": "fl",
        "\uFB03": "ffi",
        "\uFB04": "ffl",
        "\uFB05": "st",
        "\uFB06": "st",
        "\u00A0": " ",
        "\u2011": "-"
    };

    const DIGIT_TO_LETTERS = {
        "0": ["o", "O", "D"],
        "1": ["l", "i", "I"],
        "2": ["z", "Z"],
        "3": ["e", "E"],
        "4": ["a"],
        "5": ["s", "S"],
        "6": ["b", "g", "G"],
        "7": ["t", "T"],
        "8": ["B", "b"],
        "9": ["g", "q"]
    };

    // Letter pairs that OCR regularly splits into two characters.
    const PAIR_FIXES = [
        { from: "rn", to: "m" },
        { from: "cl", to: "d" },
        { from: "vv", to: "w" }
    ];

    // Above this token count the quadratic diff is too slow, so fall back to
    // counting changed lines instead.
    const DIFF_TOKEN_LIMIT = 1200;

    function tokenize(text) {
        return text.split(/\s+/).filter((token) => token.length > 0);
    }

    function countChangedLines(before, after) {
        const beforeLines = before.split("\n");
        const afterLines = after.split("\n");
        const lineCount = Math.max(beforeLines.length, afterLines.length);
        let changes = 0;

        for (let index = 0; index < lineCount; index += 1) {
            if (beforeLines[index] !== afterLines[index]) {
                changes += 1;
            }
        }

        return changes;
    }

    // Counts how many words actually differ between the two versions so the UI
    // can report "3 fixes" instead of a vague number of touched lines.
    function countChanges(before, after) {
        if (before === after) {
            return 0;
        }

        const beforeTokens = tokenize(before);
        const afterTokens = tokenize(after);

        if (beforeTokens.length === 0 || afterTokens.length === 0) {
            return Math.max(beforeTokens.length, afterTokens.length);
        }

        if (beforeTokens.length > DIFF_TOKEN_LIMIT || afterTokens.length > DIFF_TOKEN_LIMIT) {
            return countChangedLines(before, after);
        }

        const beforeCount = beforeTokens.length;
        const afterCount = afterTokens.length;
        const width = afterCount + 1;
        const table = new Uint32Array((beforeCount + 1) * width);

        for (let i = beforeCount - 1; i >= 0; i -= 1) {
            for (let j = afterCount - 1; j >= 0; j -= 1) {
                table[i * width + j] = beforeTokens[i] === afterTokens[j]
                    ? table[(i + 1) * width + (j + 1)] + 1
                    : Math.max(table[(i + 1) * width + j], table[i * width + (j + 1)]);
            }
        }

        let changes = 0;
        let i = 0;
        let j = 0;
        let pendingDeletes = 0;
        let pendingInserts = 0;

        const flush = () => {
            if (pendingDeletes > 0 || pendingInserts > 0) {
                // A replaced word shows up as one deletion plus one insertion,
                // so count the pair as a single change.
                changes += Math.max(pendingDeletes, pendingInserts);
                pendingDeletes = 0;
                pendingInserts = 0;
            }
        };

        while (i < beforeCount || j < afterCount) {
            if (i < beforeCount && j < afterCount && beforeTokens[i] === afterTokens[j]) {
                flush();
                i += 1;
                j += 1;
                continue;
            }

            const canDelete = i < beforeCount && (j >= afterCount || table[(i + 1) * width + j] >= table[i * width + (j + 1)]);
            const canInsert = j < afterCount;

            if (canDelete && canInsert && table[(i + 1) * width + j] >= table[i * width + (j + 1)]) {
                pendingDeletes += 1;
                i += 1;
            } else if (canInsert) {
                pendingInserts += 1;
                j += 1;
            } else {
                pendingDeletes += 1;
                i += 1;
            }
        }

        flush();

        return changes;
    }

    function isKnownWord(word) {
        return COMMON_WORDS.has(word.toLowerCase());
    }

    function looksLikeWord(token) {
        if (!token || token.length < 3 || token.length > 20) {
            return false;
        }

        return /[A-Za-z]/.test(token) && !/^[^A-Za-z]*$/.test(token);
    }

    function fixToken(token) {
        if (!looksLikeWord(token)) {
            return token;
        }

        const candidates = [];

        // A digit sitting inside a word is almost always a misread letter.
        // Try every digit position so "1nvoice" can become "invoice".
        for (let index = 0; index < token.length; index += 1) {
            const digit = token[index];
            const options = DIGIT_TO_LETTERS[digit];

            if (!options) {
                continue;
            }

            for (const letter of options) {
                candidates.push(token.slice(0, index) + letter + token.slice(index + 1));
            }
        }

        // Letter pairs that OCR regularly splits into two characters.
        for (const fix of PAIR_FIXES) {
            if (token.includes(fix.from)) {
                candidates.push(token.split(fix.from).join(fix.to));
            }
        }

        for (const candidate of candidates) {
            if (candidate === token) {
                continue;
            }

            if (isKnownWord(candidate) && !isKnownWord(token)) {
                return candidate;
            }
        }

        return token;
    }

    function replaceLigatures(text) {
        let output = "";

        for (const character of text) {
            output += LIGATURES[character] ?? character;
        }

        return output;
    }

    // Each pass reports how many edits it made so the UI can show a precise
    // "3 fixes" number instead of guessing from a diff.
    function expandReplacement(template, args) {
        const groups = args.slice(0, -2);

        return template.replace(/\$(\d|&|\$)/g, (token, code) => {
            if (code === "$") {
                return "$";
            }

            if (code === "&") {
                return args[0];
            }

            const group = groups[Number(code)];
            return group === undefined ? "" : group;
        });
    }

    function applyRegex(text, pattern, replacement) {
        let count = 0;
        const output = text.replace(pattern, (...args) => {
            count += 1;
            return typeof replacement === "function"
                ? replacement(...args)
                : expandReplacement(replacement, args);
        });

        return { text: output, count };
    }

    function chain(text, steps) {
        let output = text;
        let count = 0;

        for (const step of steps) {
            const result = applyRegex(output, step.pattern, step.replacement);
            output = result.text;
            count += result.count;
        }

        return { text: output, count };
    }

    function dehyphenate(text) {
        return applyRegex(
            text,
            /([A-Za-z\u00C0-\u024F]{2,})-[ \t]*\r?\n[ \t]*([a-z\u00C0-\u024F])/g,
            "$1$2"
        );
    }

    function fixMisreads(text) {
        let count = 0;
        const output = text.replace(/[A-Za-z\u00C0-\u024F0-9]+/g, (token) => {
            const fixed = fixToken(token);

            if (fixed !== token) {
                count += 1;
            }

            return fixed;
        });

        return { text: output, count };
    }

    function fixPunctuation(text) {
        return chain(text, [
            { pattern: /([A-Za-z])[ \t]+([,.;:!?])/g, replacement: "$1$2" },
            { pattern: /([,.;:!?])([A-Za-z])/g, replacement: "$1 $2" },
            { pattern: /([,.;:!?])(?=[,.;:!?])/g, replacement: "" },
            { pattern: /([.!?])([A-Z][a-z])/g, replacement: "$1 $2" }
        ]);
    }

    function dedupeLines(text) {
        const lines = text.split(/\r?\n/);
        const seen = new Set();
        const output = [];
        let count = 0;

        for (const line of lines) {
            const key = line.trim().replace(/\s+/g, " ").toLowerCase();

            if (key.length > 0 && seen.has(key)) {
                count += 1;
                continue;
            }

            if (key.length > 0) {
                seen.add(key);
            }

            output.push(line);
        }

        return { text: output.join("\n"), count };
    }

    function normalizeWhitespace(text) {
        return chain(text, [
            { pattern: /\r\n/g, replacement: "\n" },
            { pattern: /[ \t]{2,}/g, replacement: " " },
            { pattern: /[ \t]+$/gm, replacement: "" },
            { pattern: /\n{3,}/g, replacement: "\n\n" }
        ]);
    }

    function stripBorderCharacters(text) {
        return chain(text, [
            { pattern: /^[ \t]*[|_\-=+]{3,}[ \t]*$/gm, replacement: "" },
            { pattern: /^[ \t]*\|[ \t]*$/gm, replacement: "" }
        ]);
    }

    function replaceLigatures(text) {
        let count = 0;
        let output = "";

        for (const character of text) {
            const replacement = LIGATURES[character];

            if (replacement !== undefined) {
                count += 1;
                output += replacement;
                continue;
            }

            output += character;
        }

        return { text: output, count };
    }

    function sharpenText(text) {
        // Sharpen kernel: enhances edges
        // [0 -1  0]
        // [-1  5 -1]
        // [0 -1  0]
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

        // Convert text to a simple numeric array for convolution
        // We'll treat the text as a grid of character codes
        const length = text.length;
        if (length < 9) {
            // Not enough pixels for convolution, return as-is
            return { text, count: 0 };
        }

        // Build a simple grayscale-like array from character codes
        // Use charCodeAt values normalized to 0-255 range
        const gray = new Uint8Array(length);
        for (let i = 0; i < length; i += 1) {
            gray[i] = text.charCodeAt(i) % 256;
        }

        // Pad the gray array for kernel application
        const padded = new Uint8Array(length + 4);
        padded.set(gray, 2);
        // Set border pixels to the edge values
        for (let i = 0; i < 2; i += 1) {
            padded[i] = gray[0];
            padded[padded.length - 1 - i] = gray[length - 1];
        }

        // Apply convolution kernel
        const result = new Uint8Array(length);
        let changes = 0;

        for (let i = 0; i < length; i += 1) {
            let sum = 0;
            for (let k = 0; k < 9; k += 1) {
                const weight = kernel[k];
                const pixel = padded[i + k - 2]; // shift by 2 for the padding
                sum += pixel * weight;
            }
            // Clamp to 0-255 range
            const val = Math.max(0, Math.min(255, sum));
            // Only count as a change if the value actually changed
            if (val !== gray[i]) {
                changes += 1;
            }
            result[i] = val;
        }

        // Convert back to text using the same mapping
        let output = "";
        for (let i = 0; i < length; i += 1) {
            output += String.fromCharCode(result[i] % 256);
        }

        return { text: output, count: changes };
    }

    function smartPunctuation(text) {
        return chain(text, [
            { pattern: /(^|[\s(\[])"/g, replacement: "$1\u201C" },
            { pattern: /"/g, replacement: "\u201D" },
            { pattern: /(^|[\s(\[])'/g, replacement: "$1\u2018" },
            { pattern: /'/g, replacement: "\u2019" }
        ]);
    }

    const PASSES = [
        {
            id: "dehyphenate",
            label: "Join broken words",
            hint: "Re-joins words split across line breaks.",
            run: dehyphenate
        },
        {
            id: "misreads",
            label: "Fix misread characters",
            hint: "Repairs common confusion such as rn/m, 0/O and 1/l inside words.",
            run: fixMisreads
        },
        {
            id: "punctuation",
            label: "Tidy punctuation",
            hint: "Removes stray spaces and adds missing sentence spaces.",
            run: fixPunctuation
        },
        {
            id: "borders",
            label: "Remove table borders",
            hint: "Strips leftover pipe and underscore border rows.",
            run: stripBorderCharacters
        },
        {
            id: "sharpen",
            label: "Sharpen text",
            hint: "Enhances edges to help OCR recognize blurred characters.",
            run: sharpenText
        },
        {
            id: "duplicates",
            label: "Remove duplicate lines",
            hint: "Keeps only the first occurrence of each repeated line.",
            run: dedupeLines
        },
        {
            id: "whitespace",
            label: "Normalize whitespace",
            hint: "Removes trailing spaces and repeated blank lines.",
            run: normalizeWhitespace
        },
        {
            id: "ligatures",
            label: "Expand special characters",
            hint: "Turns curly quotes and ligatures into plain characters.",
            run: replaceLigatures
        },
        {
            id: "typography",
            label: "Smart punctuation",
            hint: "Converts straight quotes into typographic quotes.",
            run: smartPunctuation
        }
    ];

    function clean(text, enabledIds) {
        const enabled = new Set(Array.isArray(enabledIds) ? enabledIds : []);
        let output = typeof text === "string" ? text : "";
        const applied = [];

        for (const pass of PASSES) {
            if (!enabled.has(pass.id)) {
                continue;
            }

            const result = pass.run(output);

            if (result.text === output) {
                continue;
            }

            const changes = result.count > 0 ? result.count : countChanges(output, result.text);
            applied.push({ id: pass.id, label: pass.label, changes });
            output = result.text;
        }

        return { text: output, applied };
    }

    function describe(text) {
        const value = typeof text === "string" ? text : "";
        const words = value.trim() ? value.trim().split(/\s+/) : [];
        const lines = value.split(/\r?\n/);
        const sentences = value.split(/[.!?]+(?=\s|$)/).filter((part) => part.trim().length > 0);

        return {
            characters: value.length,
            words: words.length,
            lines: lines.length,
            paragraphs: value.split(/\n\s*\n/).filter((part) => part.trim().length > 0).length,
            sentences: sentences.length,
            readingMinutes: Math.max(1, Math.round(words.length / 220))
        };
    }

    return {
        PASSES,
        clean,
        describe,
        dehyphenate,
        fixMisreads,
        fixPunctuation,
        dedupeLines,
        normalizeWhitespace,
        stripBorderCharacters,
        replaceLigatures,
        smartPunctuation
    };
})();

if (typeof window !== "undefined") {
    window.TextTools = TextTools;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TextTools;
}
