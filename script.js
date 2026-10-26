/*
 * Textify - browser OCR studio.
 *
 * The OCR engine, the image cleanup and every export run in the browser.
 * MongoDB is only used to store accounts, sessions and the personal library.
 */

/* ------------------------------- element refs ------------------------------- */

const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const browseBtn = document.getElementById("browseBtn");
const previewWrap = document.getElementById("previewWrap");
const imagePreview = document.getElementById("imagePreview");
const ocrHighlightCanvas = document.getElementById("ocrHighlightCanvas");
const wordMapToggleBtn = document.getElementById("wordMapToggleBtn");
const ocrWordMap = document.getElementById("ocrWordMap");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const removeBtn = document.getElementById("removeBtn");
const extractBtn = document.getElementById("extractBtn");
const classifyLetterBtn = document.getElementById("classifyLetterBtn");
const letterClassifierResult = document.getElementById("letterClassifierResult");
const pdfBtn = document.getElementById("pdfBtn");
const scannerTools = document.getElementById("scannerTools");
const autoEnhanceCheckbox = document.getElementById("autoEnhanceCheckbox");
const rotateLeftBtn = document.getElementById("rotateLeftBtn");
const rotateRightBtn = document.getElementById("rotateRightBtn");
const cropBtn = document.getElementById("cropBtn");
const grayscaleBtn = document.getElementById("grayscaleBtn");
const enhanceBtn = document.getElementById("enhanceBtn");
const perspectiveBtn = document.getElementById("perspectiveBtn");
const qrBtn = document.getElementById("qrBtn");
const cropEditor = document.getElementById("cropEditor");
const cropCanvas = document.getElementById("cropCanvas");
const applyCropBtn = document.getElementById("applyCropBtn");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const scannerNote = document.getElementById("scannerNote");
const resultStatus = document.getElementById("resultStatus");
const resultPlaceholder = document.getElementById("resultPlaceholder");
const resultOutput = document.getElementById("resultOutput");
const outputText = document.getElementById("outputText");
const summarizeBtn = document.getElementById("summarizeBtn");
const summaryBlock = document.getElementById("summaryBlock");
const summaryText = document.getElementById("summaryText");
const copySummaryBtn = document.getElementById("copySummaryBtn");
const detectTableBtn = document.getElementById("detectTableBtn");
const tableBlock = document.getElementById("tableBlock");
const tableSummary = document.getElementById("tableSummary");
const tablePreview = document.getElementById("tablePreview");
const exportTableBtn = document.getElementById("exportTableBtn");
const wordCount = document.getElementById("wordCount");
const copyBtn = document.getElementById("copyBtn");
const exportBtn = document.getElementById("exportBtn");
const exportMenu = document.getElementById("exportMenu");
const toast = document.getElementById("toast");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const storageBadge = document.getElementById("storageBadge");

const languageButton = document.getElementById("languageButton");
const languageLabel = document.getElementById("languageLabel");
const languageMenu = document.getElementById("languageMenu");
const languageOptions = document.getElementById("languageOptions");
const languageSearch = document.getElementById("languageSearch");
const languageClearBtn = document.getElementById("languageClearBtn");
const saveToLibraryToggle = document.getElementById("saveToLibraryToggle");

const confidenceRow = document.getElementById("confidenceRow");
const confidenceValue = document.getElementById("confidenceValue");
const confidenceFill = document.getElementById("confidenceFill");

const textStats = document.getElementById("textStats");
const statWords = document.getElementById("statWords");
const statChars = document.getElementById("statChars");
const statLines = document.getElementById("statLines");
const statRead = document.getElementById("statRead");

const cleanupBlock = document.getElementById("cleanupBlock");
const cleanupToggleBtn = document.getElementById("cleanupToggleBtn");
const cleanupOptions = document.getElementById("cleanupOptions");
const applyCleanupBtn = document.getElementById("applyCleanupBtn");
const cleanupSummary = document.getElementById("cleanupSummary");
const proofreadBtn = document.getElementById("proofreadBtn");
const proofreadResults = document.getElementById("proofreadResults");
const proofreadSummary = document.getElementById("proofreadSummary");
const proofreadFindings = document.getElementById("proofreadFindings");
const applyAllProofreadBtn = document.getElementById("applyAllProofreadBtn");

const qrBlock = document.getElementById("qrBlock");
const qrResults = document.getElementById("qrResults");
const qrCloseBtn = document.getElementById("qrCloseBtn");

const batchSection = document.getElementById("batch");
const batchList = document.getElementById("batchList");
const batchSummary = document.getElementById("batchSummary");
const batchStartBtn = document.getElementById("batchStartBtn");
const batchClearBtn = document.getElementById("batchClearBtn");
const batchDownloadBtn = document.getElementById("batchDownloadBtn");

const librarySection = document.getElementById("library");
const libraryGrid = document.getElementById("libraryGrid");
const libraryEmpty = document.getElementById("libraryEmpty");
const libraryMeta = document.getElementById("libraryMeta");
const librarySearch = document.getElementById("librarySearch");
const clearLibraryBtn = document.getElementById("clearLibraryBtn");

const localAppUrl = "http://localhost:3010";

/* --------------------------------- languages -------------------------------- */

const LANGUAGES = [
    { code: "eng", name: "English" },
    { code: "ara", name: "Arabic" },
    { code: "ben", name: "Bengali" },
    { code: "bul", name: "Bulgarian" },
    { code: "cat", name: "Catalan" },
    { code: "ces", name: "Czech" },
    { code: "chi_sim", name: "Chinese (Simplified)" },
    { code: "chi_tra", name: "Chinese (Traditional)" },
    { code: "dan", name: "Danish" },
    { code: "deu", name: "German" },
    { code: "ell", name: "Greek" },
    { code: "epo", name: "Esperanto" },
    { code: "est", name: "Estonian" },
    { code: "fas", name: "Persian" },
    { code: "fin", name: "Finnish" },
    { code: "fra", name: "French" },
    { code: "gle", name: "Irish" },
    { code: "heb", name: "Hebrew" },
    { code: "hin", name: "Hindi" },
    { code: "hrv", name: "Croatian" },
    { code: "hun", name: "Hungarian" },
    { code: "ind", name: "Indonesian" },
    { code: "isl", name: "Icelandic" },
    { code: "ita", name: "Italian" },
    { code: "jpn", name: "Japanese" },
    { code: "kor", name: "Korean" },
    { code: "lat", name: "Latin" },
    { code: "lav", name: "Latvian" },
    { code: "lit", name: "Lithuanian" },
    { code: "mal", name: "Malayalam" },
    { code: "mar", name: "Marathi" },
    { code: "mkd", name: "Macedonian" },
    { code: "msa", name: "Malay" },
    { code: "nep", name: "Nepali" },
    { code: "nld", name: "Dutch" },
    { code: "nor", name: "Norwegian" },
    { code: "pol", name: "Polish" },
    { code: "por", name: "Portuguese" },
    { code: "ron", name: "Romanian" },
    { code: "rus", name: "Russian" },
    { code: "sin", name: "Sinhala" },
    { code: "slk", name: "Slovak" },
    { code: "slv", name: "Slovenian" },
    { code: "spa", name: "Spanish" },
    { code: "sqi", name: "Albanian" },
    { code: "srp", name: "Serbian" },
    { code: "swa", name: "Swahili" },
    { code: "swe", name: "Swedish" },
    { code: "tam", name: "Tamil" },
    { code: "tel", name: "Telugu" },
    { code: "tha", name: "Thai" },
    { code: "tur", name: "Turkish" },
    { code: "ukr", name: "Ukrainian" },
    { code: "urd", name: "Urdu" },
    { code: "uzb", name: "Uzbek" },
    { code: "vie", name: "Vietnamese" }
];

const MAX_LANGUAGES = 3;

/* ---------------------------------- state ---------------------------------- */

let selectedFile = null;
let previewUrl = null;
let toastTimeout = null;
let isProcessing = false;
let tesseractLoadPromise = null;
let cropSelection = null;
let cropPointerStart = null;
let cropImageSize = null;
let openCvLoadPromise = null;
let isScanningImage = false;
let zxingLoadPromise = null;
let ocrWorker = null;
let ocrWorkerLanguage = null;
let progressTarget = null;

let selectedLanguages = ["eng"];
let lastConfidence = null;
let lastResultMeta = null;
let lastOcrWords = [];
let lastOcrImageDimensions = null;
let highlightedOcrWord = null;

const queue = [];
let activeQueueId = null;
let queueCounter = 0;

const HINDI_BEST_MODEL_OPTIONS = {
    langPath: "https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_best@main",
    gzip: false,
    cachePath: "tessdata_best"
};

/* --------------------------------- helpers --------------------------------- */

function redirectToAppServerIfNeeded() {
    const isFilePage = window.location.protocol === "file:";
    const isLocalStaticServer = ["localhost", "127.0.0.1"].includes(window.location.hostname)
        && window.location.port !== "3010";

    if (isFilePage || isLocalStaticServer) {
        window.location.replace(localAppUrl);
        return true;
    }

    return false;
}

async function readAuthResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
        await response.text();
        throw new Error(
            `The server returned a non-JSON response (HTTP ${response.status}). `
            + "Run the app with `npm run dev` and open http://localhost:3010."
        );
    }

    let result;
    try {
        result = await response.json();
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(
                `The server returned invalid JSON (HTTP ${response.status}). `
                + "Check the Node.js backend and try again."
            );
        }

        throw error;
    }

    if (!response.ok) {
        throw new Error(result.error || "The request could not be completed.");
    }

    return result;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

/* --------------------------------- account --------------------------------- */

async function loadAccount() {
    try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const result = await readAuthResponse(response);
        userEmail.textContent = result.user.email;
    } catch (error) {
        showToast(error instanceof TypeError
            ? "Could not verify your session. Refresh this page to try again."
            : error.message);
        console.error("Could not verify session:", error);
    }
}

async function loadStorageStatus() {
    try {
        const response = await fetch("/api/health", { credentials: "same-origin" });
        if (!response.ok) {
            throw new Error("Health check failed.");
        }

        const result = await response.json();
        const isMongo = result.storage === "mongodb";
        storageBadge.textContent = isMongo ? "MongoDB" : "Local storage";
        storageBadge.classList.toggle("is-mongo", isMongo);
        storageBadge.classList.toggle("is-local", !isMongo);
        storageBadge.title = isMongo
            ? "Accounts, sessions and library are stored in MongoDB."
            : "MONGODB_URI is not set, so data is stored locally as JSON.";
    } catch (error) {
        storageBadge.textContent = "Offline";
        storageBadge.classList.add("is-local");
        console.error("Could not read the storage status:", error);
    }
}

logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin"
        });
        await readAuthResponse(response);
        window.location.replace("/login");
    } catch (error) {
        showToast(error instanceof TypeError
            ? "Could not reach the server to sign out."
            : error.message);
        console.error("Could not sign out:", error);
    } finally {
        logoutBtn.disabled = false;
    }
});

if (!redirectToAppServerIfNeeded()) {
    loadAccount();
    loadStorageStatus();
    loadLibrary();
}

/* ------------------------------ language picker ----------------------------- */

function languageName(code) {
    return LANGUAGES.find((language) => language.code === code)?.name || code;
}

function updateLanguageUi() {
    const names = selectedLanguages.map(languageName);
    languageLabel.textContent = names.length === 0
        ? "English"
        : (names.length === 1 ? names[0] : names.join(" + "));

    for (const option of languageOptions.querySelectorAll(".language-option")) {
        const isChecked = selectedLanguages.includes(option.dataset.code);
        option.classList.toggle("selected", isChecked);
        option.setAttribute("aria-selected", String(isChecked));
        option.querySelector("input").checked = isChecked;
    }
}

function renderLanguageOptions(filter = "") {
    const needle = filter.trim().toLowerCase();
    languageOptions.innerHTML = "";

    for (const language of LANGUAGES) {
        if (needle && !language.name.toLowerCase().includes(needle)
            && !language.code.includes(needle)) {
            continue;
        }

        const option = document.createElement("div");
        option.className = "language-option";
        option.dataset.code = language.code;
        option.setAttribute("role", "option");
        option.innerHTML = `<input type="checkbox" tabindex="-1" aria-hidden="true">`
            + `<span class="language-name">${escapeHtml(language.name)}</span>`
            + `<span class="language-code">${escapeHtml(language.code)}</span>`;

        option.addEventListener("click", (event) => {
            event.preventDefault();
            const code = language.code;

            if (selectedLanguages.includes(code)) {
                selectedLanguages = selectedLanguages.filter((entry) => entry !== code);
            } else {
                if (selectedLanguages.length >= MAX_LANGUAGES) {
                    showToast(`Pick up to ${MAX_LANGUAGES} languages at a time.`);
                    return;
                }

                selectedLanguages.push(code);
            }

            updateLanguageUi();
        });

        languageOptions.appendChild(option);
    }

    updateLanguageUi();
}

languageButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = !languageMenu.classList.contains("hidden");
    languageMenu.classList.toggle("hidden", isOpen);
    languageButton.setAttribute("aria-expanded", String(!isOpen));

    if (!isOpen) {
        languageSearch.focus();
    }
});

languageSearch.addEventListener("input", () => renderLanguageOptions(languageSearch.value));
languageSearch.addEventListener("click", (event) => event.stopPropagation());

languageClearBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    selectedLanguages = ["eng"];
    updateLanguageUi();
});

languageMenu.addEventListener("click", (event) => event.stopPropagation());

document.addEventListener("click", (event) => {
    if (!languageMenu.contains(event.target) && event.target !== languageButton) {
        languageMenu.classList.add("hidden");
        languageButton.setAttribute("aria-expanded", "false");
    }

    if (!exportMenu.contains(event.target) && event.target !== exportBtn) {
        exportMenu.classList.add("hidden");
        exportBtn.setAttribute("aria-expanded", "false");
    }
});

function ocrLanguage() {
    return selectedLanguages.length > 0 ? selectedLanguages.join("+") : "eng";
}

/* ------------------------------- library calls ------------------------------ */

async function saveDocumentToLibrary(payload) {
    const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error("The scan could not be saved to your library.");
    }

    return response.json();
}

async function loadLibrary() {
    try {
        const query = librarySearch.value.trim();
        const response = await fetch(`/api/documents?limit=60${query ? `&query=${encodeURIComponent(query)}` : ""}`, {
            credentials: "same-origin"
        });

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const result = await readAuthResponse(response);
        renderLibrary(result.items || [], result.total || 0);
    } catch (error) {
        libraryMeta.textContent = "The library is unavailable right now.";
        console.error("Could not load the library:", error);
    }
}

let librarySearchTimer = null;
librarySearch.addEventListener("input", () => {
    window.clearTimeout(librarySearchTimer);
    librarySearchTimer = window.setTimeout(() => loadLibrary(), 250);
});

function renderLibrary(items, total) {
    libraryGrid.innerHTML = "";
    libraryEmpty.classList.toggle("hidden", items.length > 0);
    libraryMeta.textContent = total === 0
        ? "No saved scans yet."
        : `${total} saved scan${total === 1 ? "" : "s"}.`;

    for (const item of items) {
        const card = document.createElement("article");
        card.className = "library-card";

        const confidence = Number.isFinite(Number(item.confidence))
            ? `${Math.round(Number(item.confidence))}%`
            : null;

        card.innerHTML = `
            <div class="library-thumb">
                ${item.thumbnail
                    ? `<img src="${escapeHtml(item.thumbnail)}" alt="Preview of ${escapeHtml(item.title)}">`
                    : `<div class="library-thumb-placeholder">Aa</div>`}
            </div>
            <div class="library-body">
                <h3>${escapeHtml(item.title || item.file_name || "Untitled scan")}</h3>
                <p class="library-meta-line">
                    <span>${escapeHtml(item.language || "eng")}</span>
                    ${confidence ? `<span>${confidence} confidence</span>` : ""}
                    <span>${escapeHtml(new Date(item.created_at).toLocaleDateString())}</span>
                </p>
                <p class="library-preview">${escapeHtml((item.text || "").slice(0, 160))}${(item.text || "").length > 160 ? "…" : ""}</p>
                <div class="library-actions">
                    <button class="text-button" data-action="open" type="button">Open</button>
                    <button class="text-button" data-action="copy" type="button">Copy</button>
                    <button class="text-button" data-action="download" type="button">Download</button>
                    <button class="text-button danger" data-action="delete" type="button">Delete</button>
                </div>
            </div>
        `;

        card.addEventListener("click", async (event) => {
            const button = event.target.closest("[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action;

            if (action === "open") {
                openDocument(item);
                return;
            }

            if (action === "copy") {
                await copyToClipboard(item.text || "");
                showToast("Text copied to clipboard.");
                return;
            }

            if (action === "download") {
                Exporters.exportAs("txt", {
                    text: item.text || "",
                    fileName: item.file_name || item.title,
                    meta: documentMeta(item)
                });
                showToast("Download started.");
                return;
            }

            if (action === "delete") {
                await deleteDocument(item.id);
            }
        });

        libraryGrid.appendChild(card);
    }
}

function documentMeta(item) {
    return {
        title: item.title || item.file_name || "Extracted text",
        language: item.language || "eng",
        confidence: item.confidence,
        fileName: item.file_name || null,
        createdAt: item.created_at
    };
}

function openDocument(item) {
    outputText.value = item.text || "";
    lastOcrWords = [];
    lastOcrImageDimensions = null;
    highlightedOcrWord = null;
    tableBlock.classList.add("hidden");
    tablePreview.replaceChildren();
    wordMapToggleBtn.classList.add("hidden");
    ocrWordMap.classList.add("hidden");
    ocrWordMap.replaceChildren();
    clearOcrHighlight();
    summaryText.textContent = "";
    summaryBlock.classList.add("hidden");
    proofreadFindings.replaceChildren();
    proofreadResults.classList.add("hidden");
    lastConfidence = Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : null;
    lastResultMeta = documentMeta(item);
    resultPlaceholder.classList.add("hidden");
    resultOutput.classList.remove("hidden");
    cleanupBlock.classList.remove("hidden");
    updateConfidence();
    updateWordCount();
    updateTextStats();
    document.getElementById("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Scan opened in the editor.");
}

async function deleteDocument(documentId) {
    try {
        const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
            method: "DELETE",
            credentials: "same-origin"
        });

        if (!response.ok && response.status !== 404) {
            throw new Error("The scan could not be deleted.");
        }

        await loadLibrary();
        showToast("Scan deleted.");
    } catch (error) {
        showToast(error.message || "The scan could not be deleted.");
        console.error("Could not delete the scan:", error);
    }
}

clearLibraryBtn.addEventListener("click", async () => {
    if (!window.confirm("Delete every scan in your library? This cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch("/api/documents", {
            method: "DELETE",
            credentials: "same-origin"
        });

        await readAuthResponse(response);
        await loadLibrary();
        showToast("Library cleared.");
    } catch (error) {
        showToast(error.message || "The library could not be cleared.");
        console.error("Could not clear the library:", error);
    }
});

/* -------------------------------- OCR engine -------------------------------- */

function loadTesseract() {
    if (window.Tesseract) {
        return Promise.resolve(window.Tesseract);
    }

    if (!tesseractLoadPromise) {
        tesseractLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
            script.async = true;
            script.onload = () => {
                if (window.Tesseract) {
                    resolve(window.Tesseract);
                } else {
                    tesseractLoadPromise = null;
                    reject(new Error("The OCR library did not load correctly."));
                }
            };
            script.onerror = () => {
                script.remove();
                tesseractLoadPromise = null;
                reject(new Error("The OCR library could not be downloaded."));
            };
            document.head.appendChild(script);
        });
    }

    return tesseractLoadPromise;
}

function ocrModelOptions(language) {
    return language.split("+").includes("hin") ? HINDI_BEST_MODEL_OPTIONS : {};
}

function ocrResultScore(data) {
    const text = data.text?.trim() || "";
    if (!text) {
        return -1;
    }

    const confidence = Number(data.confidence);
    return (Number.isFinite(confidence) ? confidence : 0) + Math.min(text.length, 1000) / 1000;
}

async function getOcrWorker(language) {
    if (ocrWorker && ocrWorkerLanguage === language) {
        return ocrWorker;
    }

    if (ocrWorker) {
        const previous = ocrWorker;
        ocrWorker = null;
        ocrWorkerLanguage = null;
        await previous.terminate().catch(() => undefined);
    }

    const tesseract = await loadTesseract();
    const worker = await tesseract.createWorker(language, 1, {
        ...ocrModelOptions(language),
        logger(message) {
            if (progressTarget) {
                progressTarget(message);
            }
        }
    });

    // Keep document layout detection enabled, retain intentional spacing, and
    // give small raster images a reliable baseline DPI after OCR upscaling.
    await worker.setParameters({
        tessedit_pageseg_mode: "3",
        preserve_interword_spaces: "1",
        user_defined_dpi: "300"
    });

    ocrWorker = worker;
    ocrWorkerLanguage = language;
    return worker;
}

async function prepareOcrImage(file) {
    const bitmap = await createImageBitmap(file);
    try {
        let preparedFile = file;
        let width = bitmap.width;
        let height = bitmap.height;
        const largestSide = Math.max(bitmap.width, bitmap.height);
        // Tesseract struggles when character height is only a few pixels.
        // Enlarge modest source images while avoiding unnecessary huge canvases.
        const scale = Math.min(2.5, 3200 / largestSide, Math.max(1, 2000 / largestSide));
        if (scale > 1.02) {
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(bitmap.width * scale);
            canvas.height = Math.round(bitmap.height * scale);
            const context = canvas.getContext("2d");
            if (context) {
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = "high";
                context.fillStyle = "#fff";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
                if (blob) {
                    preparedFile = new File([blob], file.name, { type: "image/png", lastModified: file.lastModified });
                    width = canvas.width;
                    height = canvas.height;
                }
            }
        }
        return { image: preparedFile, width, height };
    } finally {
        bitmap.close();
    }
}

async function prepareEnhancedOcrImage(file) {
    const bitmap = await createImageBitmap(file);
    try {
        const largestSide = Math.max(bitmap.width, bitmap.height);
        const scale = Math.min(1.5, 2400 / largestSide, Math.max(1, 2000 / largestSide));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
            throw new Error("Your browser could not prepare this image for OCR.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const { width, height, data } = imageData;
        const pixelCount = width * height;
        const gray = new Uint8Array(pixelCount);
        for (let index = 0; index < pixelCount; index += 1) {
            const pixel = index * 4;
            gray[index] = Math.round(
                data[pixel] * 0.299 + data[pixel + 1] * 0.587 + data[pixel + 2] * 0.114
            );
        }

        const integralWidth = width + 1;
        const integral = new Uint32Array(integralWidth * (height + 1));
        for (let y = 1; y <= height; y += 1) {
            let rowSum = 0;
            for (let x = 1; x <= width; x += 1) {
                rowSum += gray[(y - 1) * width + x - 1];
                integral[y * integralWidth + x] = integral[(y - 1) * integralWidth + x] + rowSum;
            }
        }

        const radius = Math.max(16, Math.min(80, Math.round(Math.max(width, height) / 28)));
        const enhanced = new Uint8Array(pixelCount);
        for (let y = 0; y < height; y += 1) {
            const top = Math.max(0, y - radius);
            const bottom = Math.min(height, y + radius + 1);
            for (let x = 0; x < width; x += 1) {
                const left = Math.max(0, x - radius);
                const right = Math.min(width, x + radius + 1);
                const area = (right - left) * (bottom - top);
                const localMean = (
                    integral[bottom * integralWidth + right]
                    - integral[top * integralWidth + right]
                    - integral[bottom * integralWidth + left]
                    + integral[top * integralWidth + left]
                ) / area;
                const index = y * width + x;
                const normalized = gray[index] * Math.min(2.5, 245 / Math.max(1, localMean));
                enhanced[index] = Math.max(0, Math.min(255, Math.round(normalized)));
            }
        }

        for (let y = 0; y < height; y += 1) {
            const top = Math.max(0, y - radius);
            const bottom = Math.min(height, y + radius + 1);
            for (let x = 0; x < width; x += 1) {
                const left = Math.max(0, x - radius);
                const right = Math.min(width, x + radius + 1);
                const area = (right - left) * (bottom - top);
                const localMean = (
                    integral[bottom * integralWidth + right]
                    - integral[top * integralWidth + right]
                    - integral[bottom * integralWidth + left]
                    + integral[top * integralWidth + left]
                ) / area;
                const index = y * width + x;
                const threshold = Math.max(0, localMean * Math.min(2.5, 245 / Math.max(1, localMean)) - 12);
                const value = enhanced[index] < threshold ? 0 : 255;
                const pixel = index * 4;
                data[pixel] = value;
                data[pixel + 1] = value;
                data[pixel + 2] = value;
                data[pixel + 3] = 255;
            }
        }

        context.putImageData(imageData, 0, 0);
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(new Error("The enhanced image could not be prepared for OCR."));
                }
            }, "image/png");
        });
        return {
            image: new File([blob], file.name.replace(/\.[^.]+$/, "") + "-enhanced.png", {
                type: "image/png",
                lastModified: file.lastModified
            }),
            width: canvas.width,
            height: canvas.height
        };
    } finally {
        bitmap.close();
    }
}

async function runOcr(file, language, onProgress) {
    const tesseract = await loadTesseract();
    let worker = null;

    try {
        worker = await getOcrWorker(language);
    } catch (error) {
        console.warn("Falling back to the one-shot OCR helper:", error);
    }

    progressTarget = onProgress || null;

    try {
        const preparedImage = await prepareOcrImage(file);
        if (worker) {
            const firstResult = await worker.recognize(preparedImage.image);
            const firstData = firstResult.data;
            if (Number(firstData.confidence) >= 80 && firstData.text?.trim()) {
                return { ...firstData, imageWidth: preparedImage.width, imageHeight: preparedImage.height };
            }

            try {
                onProgress?.({ status: "retrying with photo cleanup" });
                const enhancedImage = await prepareEnhancedOcrImage(file);
                const enhancedResult = await worker.recognize(enhancedImage.image);
                return ocrResultScore(enhancedResult.data) > ocrResultScore(firstData)
                    ? { ...enhancedResult.data, imageWidth: enhancedImage.width, imageHeight: enhancedImage.height }
                    : { ...firstData, imageWidth: preparedImage.width, imageHeight: preparedImage.height };
            } catch (error) {
                console.warn("Enhanced OCR retry failed; using the first OCR result:", error);
                return { ...firstData, imageWidth: preparedImage.width, imageHeight: preparedImage.height };
            }
        }

        const result = await tesseract.recognize(preparedImage.image, language, {
            ...ocrModelOptions(language),
            logger: onProgress
        });
        if (Number(result.data.confidence) >= 80 && result.data.text?.trim()) {
            return { ...result.data, imageWidth: preparedImage.width, imageHeight: preparedImage.height };
        }

        try {
            onProgress?.({ status: "retrying with photo cleanup" });
            const enhancedImage = await prepareEnhancedOcrImage(file);
            const enhancedResult = await tesseract.recognize(enhancedImage.image, language, {
                ...ocrModelOptions(language),
                logger: onProgress
            });
            return ocrResultScore(enhancedResult.data) > ocrResultScore(result.data)
                ? { ...enhancedResult.data, imageWidth: enhancedImage.width, imageHeight: enhancedImage.height }
                : { ...result.data, imageWidth: preparedImage.width, imageHeight: preparedImage.height };
        } catch (error) {
            console.warn("Enhanced OCR retry failed; using the first OCR result:", error);
            return { ...result.data, imageWidth: preparedImage.width, imageHeight: preparedImage.height };
        }
    } finally {
        progressTarget = null;
    }
}

async function classifySingleLetter() {
    if (!selectedFile || isProcessing || isScanningImage) return;

    setProcessing(true);
    classifyLetterBtn.disabled = true;
    classifyLetterBtn.textContent = "Classifying…";
    letterClassifierResult.textContent = "Preparing the image and loading the recognition model…";

    let worker;
    try {
        worker = await getOcrWorker("eng");
        await worker.setParameters({
            tessedit_pageseg_mode: "10",
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
            user_defined_dpi: "300"
        });
        const image = await prepareOcrImage(selectedFile);
        const { data } = await worker.recognize(image.image);
        const letter = (data.text || "").replace(/[^A-Za-z]/g, "").slice(0, 1);
        if (!letter) {
            letterClassifierResult.textContent = "No single letter found. Try a clear image with one large letter.";
            return;
        }

        const confidence = Number.isFinite(Number(data.confidence))
            ? ` · ${Math.round(Number(data.confidence))}% confidence`
            : "";
        letterClassifierResult.textContent = `Predicted letter: ${letter}${confidence}`;
    } catch (error) {
        letterClassifierResult.textContent = "Letter recognition failed. Check your connection and try again.";
        console.error("Letter classification failed:", error);
    } finally {
        if (worker) {
            await worker.setParameters({
                tessedit_pageseg_mode: "3",
                tessedit_char_whitelist: "",
                preserve_interword_spaces: "1",
                user_defined_dpi: "300"
            }).catch((error) => console.warn("Could not restore OCR settings:", error));
        }
        setProcessing(false);
        classifyLetterBtn.disabled = !selectedFile || isScanningImage;
        classifyLetterBtn.textContent = "Classify letter";
    }
}

/* ------------------------------ image utilities ----------------------------- */

async function loadSelectedImage() {
    if (!selectedFile) {
        throw new Error("Choose an image before using scanner tools.");
    }

    return createImageBitmap(selectedFile);
}

function createProcessingCanvas(image, maxDimension = 1800) {
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
        throw new Error("Your browser could not prepare this image.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
}

function canvasToImageFile(canvas, originalFile) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("The edited image could not be saved."));
                return;
            }

            const baseName = originalFile.name.replace(/\.[^.]+$/, "").replace(/(?:-scan)+$/i, "") || "scanned-image";
            resolve(new File([blob], `${baseName}-scan.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now()
            }));
        }, "image/jpeg", 0.94);
    });
}

async function createThumbnail(file, maxWidth = 320) {
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxWidth / bitmap.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return canvas.toDataURL("image/jpeg", 0.72);
    } catch (error) {
        return null;
    }
}

/* -------------------------------- scanner tools ------------------------------ */

async function replaceWithProcessedCanvas(canvas, message) {
    const file = await canvasToImageFile(canvas, selectedFile);
    setSelectedFile(file);
    scannerNote.textContent = message;
}

function setScannerBusy(busy, message) {
    isScanningImage = busy;
    scannerNote.textContent = message;
    for (const button of [
        rotateLeftBtn, rotateRightBtn, cropBtn, grayscaleBtn, enhanceBtn, perspectiveBtn,
        applyCropBtn, cancelCropBtn, classifyLetterBtn
    ]) {
        button.disabled = busy || isProcessing || (button === applyCropBtn && !cropSelection);
    }

    extractBtn.disabled = busy || isProcessing || !selectedFile;
    pdfBtn.disabled = busy || isProcessing || !selectedFile;
}

async function rotateSelectedImage(direction) {
    if (!selectedFile || isProcessing || isScanningImage) {
        return;
    }

    setScannerBusy(true, "Rotating image...");
    let image;
    try {
        image = await loadSelectedImage();
        const canvas = document.createElement("canvas");
        canvas.width = image.height;
        canvas.height = image.width;
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Your browser could not rotate this image.");
        }

        if (direction > 0) {
            context.translate(canvas.width, 0);
        } else {
            context.translate(0, canvas.height);
        }
        context.rotate(direction * Math.PI / 2);
        context.drawImage(image, 0, 0);
        await replaceWithProcessedCanvas(canvas, "Image rotated. You can continue editing or extract text.");
        showToast("Image rotated.");
    } catch (error) {
        scannerNote.textContent = error.message;
        showToast(error.message);
        console.error("Image rotation failed:", error);
    } finally {
        image?.close();
        setScannerBusy(false, scannerNote.textContent);
    }
}

function drawCropSelection() {
    if (!selectedFile || !cropImageSize) {
        return;
    }

    const context = cropCanvas.getContext("2d");
    if (!context) {
        return;
    }

    const bitmapScale = Math.min(
        1,
        1800 / Math.max(cropImageSize.width, cropImageSize.height)
    );
    cropCanvas.width = Math.max(1, Math.round(cropImageSize.width * bitmapScale));
    cropCanvas.height = Math.max(1, Math.round(cropImageSize.height * bitmapScale));

    context.drawImage(cropImageSize, 0, 0, cropCanvas.width, cropCanvas.height);
    if (cropSelection) {
        const { x, y, width, height } = cropSelection;
        context.fillStyle = "rgba(7, 10, 20, 0.58)";
        context.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
        context.clearRect(x, y, width, height);
        context.drawImage(cropImageSize, x, y, width, height, x, y, width, height);
        context.strokeStyle = "#9b7bff";
        context.lineWidth = Math.max(2, cropCanvas.width / 500);
        context.strokeRect(x, y, width, height);
    }
}

async function openCropEditor() {
    if (!selectedFile || isProcessing || isScanningImage) {
        return;
    }

    cropImageSize?.close();
    cropSelection = null;
    cropPointerStart = null;
    cropImageSize = await loadSelectedImage();
    cropEditor.classList.remove("hidden");
    drawCropSelection();
    applyCropBtn.disabled = true;
    scannerNote.textContent = "Drag on the image to select the area to keep.";
}

function cancelCropEditor() {
    cropSelection = null;
    cropPointerStart = null;
    cropImageSize?.close();
    cropImageSize = null;
    cropEditor.classList.add("hidden");
    scannerNote.textContent = "Crop cancelled.";
}

async function applyImageCrop() {
    if (!selectedFile || !cropSelection || !cropImageSize || isScanningImage) {
        return;
    }

    const scaleX = cropImageSize.width / cropCanvas.width;
    const scaleY = cropImageSize.height / cropCanvas.height;
    const left = Math.round(cropSelection.x * scaleX);
    const top = Math.round(cropSelection.y * scaleY);
    const width = Math.round(cropSelection.width * scaleX);
    const height = Math.round(cropSelection.height * scaleY);
    if (width < 2 || height < 2) {
        showToast("Select a larger area to crop.");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
        showToast("Your browser could not crop this image.");
        return;
    }

    context.drawImage(cropImageSize, left, top, width, height, 0, 0, width, height);
    cropImageSize.close();
    cropImageSize = null;
    cropEditor.classList.add("hidden");
    cropSelection = null;
    setScannerBusy(true, "Applying crop...");
    try {
        await replaceWithProcessedCanvas(canvas, "Crop applied. You can continue editing or extract text.");
        showToast("Image cropped.");
    } catch (error) {
        scannerNote.textContent = error.message;
        showToast(error.message);
        console.error("Image crop failed:", error);
    } finally {
        setScannerBusy(false, scannerNote.textContent);
    }
}

async function convertImageToGrayscale() {
    if (!selectedFile || isProcessing || isScanningImage) {
        return;
    }

    setScannerBusy(true, "Converting image to grayscale...");
    let image;
    try {
        image = await loadSelectedImage();
        const canvas = createProcessingCanvas(image);
        const context = canvas.getContext("2d", { willReadFrequently: true });
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        for (let index = 0; index < pixels.data.length; index += 4) {
            const gray = Math.round(
                pixels.data[index] * 0.299
                + pixels.data[index + 1] * 0.587
                + pixels.data[index + 2] * 0.114
            );
            pixels.data[index] = gray;
            pixels.data[index + 1] = gray;
            pixels.data[index + 2] = gray;
        }

        context.putImageData(pixels, 0, 0);
        await replaceWithProcessedCanvas(canvas, "Grayscale applied. You can continue editing or extract text.");
        showToast("Image converted to grayscale.");
    } catch (error) {
        scannerNote.textContent = error.message;
        showToast(error.message);
        console.error("Grayscale conversion failed:", error);
    } finally {
        image?.close();
        setScannerBusy(false, scannerNote.textContent);
    }
}

function medianOfFive(a, b, c, d, e) {
    // Optimal 5-element sorting network (9 comparators). Returns the middle
    // value without allocating an array, which keeps large images fast.
    let t;
    if (a > b) { t = a; a = b; b = t; }
    if (d > e) { t = d; d = e; e = t; }
    if (c > e) { t = c; c = e; e = t; }
    if (c > d) { t = c; c = d; d = t; }
    if (b > e) { t = b; b = e; e = t; }
    if (a > d) { t = a; a = d; d = t; }
    if (a > c) { t = a; a = c; c = t; }
    if (b > d) { t = b; b = d; d = t; }
    if (b > c) { t = b; b = c; c = t; }

    return c;
}

async function cleanImage({ forOcr = false } = {}) {
    if (!selectedFile || isProcessing || isScanningImage) {
        return false;
    }

    setScannerBusy(true, forOcr ? "Preparing image for OCR..." : "Reducing shadows and image noise...");
    let image;
    try {
        image = await loadSelectedImage();
        const canvas = createProcessingCanvas(image, 1800);
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
            throw new Error("Your browser could not prepare this image.");
        }

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const { width, height, data } = imageData;
        const gray = new Uint8Array(width * height);
        const normalized = new Uint8Array(width * height);
        const integralWidth = width + 1;
        const integral = new Float64Array(integralWidth * (height + 1));

        for (let y = 0; y < height; y += 1) {
            let rowSum = 0;
            for (let x = 0; x < width; x += 1) {
                const pixel = (y * width + x) * 4;
                const luminance = Math.round(
                    data[pixel] * 0.299 + data[pixel + 1] * 0.587 + data[pixel + 2] * 0.114
                );
                gray[y * width + x] = luminance;
                rowSum += luminance;
                integral[(y + 1) * integralWidth + x + 1]
                    = integral[y * integralWidth + x + 1] + rowSum;
            }
        }

        // Local background estimation: divide the image by a blurred copy of
        // itself so shadows and gradients are lifted while text stays crisp.
        const radius = Math.max(8, Math.round(Math.min(width, height) / 45));
        for (let y = 0; y < height; y += 1) {
            const top = Math.max(0, y - radius);
            const bottom = Math.min(height - 1, y + radius);
            for (let x = 0; x < width; x += 1) {
                const left = Math.max(0, x - radius);
                const right = Math.min(width - 1, x + radius);
                const sum = integral[(bottom + 1) * integralWidth + right + 1]
                    - integral[top * integralWidth + right + 1]
                    - integral[(bottom + 1) * integralWidth + left]
                    + integral[top * integralWidth + left];
                const area = (right - left + 1) * (bottom - top + 1);
                const background = sum / area;
                normalized[y * width + x] = Math.min(255, Math.round(
                    gray[y * width + x] * 225 / Math.max(80, background)
                ));
            }
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const index = y * width + x;
                const left = normalized[y * width + Math.max(0, x - 1)];
                const right = normalized[y * width + Math.min(width - 1, x + 1)];
                const above = normalized[Math.max(0, y - 1) * width + x];
                const below = normalized[Math.min(height - 1, y + 1) * width + x];
                const denoised = medianOfFive(normalized[index], left, right, above, below);
                const output = denoised < 175 ? 0 : 255;
                const pixel = index * 4;
                data[pixel] = output;
                data[pixel + 1] = output;
                data[pixel + 2] = output;
                data[pixel + 3] = 255;
            }
        }

        context.putImageData(imageData, 0, 0);
        await replaceWithProcessedCanvas(
            canvas,
            forOcr
                ? "Shadows reduced and image prepared for OCR."
                : "Shadows reduced and image noise cleaned. You can extract text now."
        );
        showToast(forOcr ? "Image prepared for OCR." : "Image cleaned for scanning.");
        return true;
    } catch (error) {
        scannerNote.textContent = error.message;
        console.error("Image cleanup failed:", error);
        showToast("Image cleanup failed.");
        return false;
    } finally {
        image?.close();
        setScannerBusy(false, scannerNote.textContent);
    }
}

function loadOpenCv() {
    if (window.cv?.Mat) {
        return Promise.resolve(window.cv);
    }

    if (!openCvLoadPromise) {
        openCvLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js";
            script.async = true;
            script.onload = () => {
                const cv = window.cv;
                if (cv?.Mat) {
                    resolve(cv);
                    return;
                }

                if (!cv) {
                    openCvLoadPromise = null;
                    reject(new Error("The perspective correction engine did not initialize."));
                    return;
                }

                const previousCallback = cv.onRuntimeInitialized;
                cv.onRuntimeInitialized = () => {
                    previousCallback?.();
                    resolve(window.cv);
                };
            };
            script.onerror = () => {
                script.remove();
                openCvLoadPromise = null;
                reject(new Error("Could not load perspective correction. Check your internet connection."));
            };
            document.head.appendChild(script);
        });
    }

    return openCvLoadPromise;
}

function orderDocumentCorners(points) {
    const bySum = [...points].sort((a, b) => a.x + a.y - b.x - b.y);
    const topLeft = bySum[0];
    const bottomRight = bySum[3];
    const byDifference = [...points].sort((a, b) => a.y - a.x - (b.y - b.x));
    return [topLeft, byDifference[0], bottomRight, byDifference[3]];
}

async function correctPerspective() {
    if (!selectedFile || isProcessing || isScanningImage) {
        return;
    }

    setScannerBusy(true, "Finding document edges...");
    let image;
    let source;
    let gray;
    let blurred;
    let edges;
    let contours;
    let hierarchy;
    let bestApproximation;
    let sourceCorners;
    let destinationCorners;
    let transform;
    let corrected;
    try {
        const cv = await loadOpenCv();
        image = await loadSelectedImage();
        const sourceCanvas = createProcessingCanvas(image, 1800);
        const sourceContext = sourceCanvas.getContext("2d");
        const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        source = cv.matFromImageData(imageData);
        gray = new cv.Mat();
        blurred = new cv.Mat();
        edges = new cv.Mat();
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();

        cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.Canny(blurred, edges, 50, 150);
        cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

        let largestArea = 0;
        let corners = null;
        for (let index = 0; index < contours.size(); index += 1) {
            const contour = contours.get(index);
            const perimeter = cv.arcLength(contour, true);
            const approximation = new cv.Mat();
            cv.approxPolyDP(contour, approximation, 0.02 * perimeter, true);
            if (approximation.rows === 4 && cv.isContourConvex(approximation)) {
                const area = Math.abs(cv.contourArea(approximation));
                if (area > largestArea) {
                    bestApproximation?.delete();
                    bestApproximation = approximation;
                    largestArea = area;
                    corners = [];
                    for (let point = 0; point < 4; point += 1) {
                        corners.push({
                            x: approximation.data32S[point * 2],
                            y: approximation.data32S[point * 2 + 1]
                        });
                    }
                } else {
                    approximation.delete();
                }
            } else {
                approximation.delete();
            }
            contour.delete();
        }

        if (!corners || largestArea < sourceCanvas.width * sourceCanvas.height * 0.12) {
            throw new Error("Could not find a clear document outline. Crop the page manually and try again.");
        }

        const [topLeft, topRight, bottomRight, bottomLeft] = orderDocumentCorners(corners);
        const outputWidth = Math.round(Math.max(
            Math.hypot(bottomRight.x - bottomLeft.x, bottomRight.y - bottomLeft.y),
            Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y)
        ));
        const outputHeight = Math.round(Math.max(
            Math.hypot(topRight.x - bottomRight.x, topRight.y - bottomRight.y),
            Math.hypot(topLeft.x - bottomLeft.x, topLeft.y - bottomLeft.y)
        ));
        if (outputWidth < 2 || outputHeight < 2) {
            throw new Error("Could not measure the document edges. Try cropping the page manually.");
        }

        sourceCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
            topLeft.x, topLeft.y, topRight.x, topRight.y,
            bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y
        ]);
        destinationCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0, outputWidth - 1, 0, outputWidth - 1, outputHeight - 1, 0, outputHeight - 1
        ]);
        transform = cv.getPerspectiveTransform(sourceCorners, destinationCorners);
        corrected = new cv.Mat();
        cv.warpPerspective(source, corrected, transform, new cv.Size(outputWidth, outputHeight));

        const outputCanvas = document.createElement("canvas");
        cv.imshow(outputCanvas, corrected);
        setScannerBusy(true, "Applying perspective correction...");
        await replaceWithProcessedCanvas(outputCanvas, "Document perspective corrected. You can extract text now.");
        showToast("Document perspective corrected.");
    } catch (error) {
        scannerNote.textContent = error.message;
        showToast(error.message);
        console.error("Perspective correction failed:", error);
    } finally {
        image?.close();
        source?.delete();
        gray?.delete();
        blurred?.delete();
        edges?.delete();
        contours?.delete();
        hierarchy?.delete();
        bestApproximation?.delete();
        sourceCorners?.delete();
        destinationCorners?.delete();
        transform?.delete();
        corrected?.delete();
        setScannerBusy(false, scannerNote.textContent);
    }
}

/* ------------------------------- barcode reader ----------------------------- */

function loadZxing() {
    if (window.ZXing?.MultiFormatReader) {
        return Promise.resolve(window.ZXing);
    }

    if (!zxingLoadPromise) {
        zxingLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.23.0/umd/index.min.js";
            script.async = true;
            script.onload = () => {
                if (window.ZXing?.MultiFormatReader) {
                    resolve(window.ZXing);
                } else {
                    zxingLoadPromise = null;
                    reject(new Error("The barcode engine did not load correctly."));
                }
            };
            script.onerror = () => {
                script.remove();
                zxingLoadPromise = null;
                reject(new Error("The barcode engine could not be downloaded."));
            };
            document.head.appendChild(script);
        });
    }

    return zxingLoadPromise;
}

function barcodeFormatName(zxing, format) {
    const name = zxing.BarcodeFormat?.[format];
    if (name) {
        return String(name).replace(/_/g, " ");
    }

    return `Format ${format}`;
}

async function scanBarcodes() {
    if (!selectedFile || isProcessing || isScanningImage) {
        return;
    }

    setScannerBusy(true, "Looking for QR codes and barcodes...");
    let image;
    try {
        const zxing = await loadZxing();
        image = await loadSelectedImage();
        const canvas = createProcessingCanvas(image, 2200);
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Your browser could not prepare this image.");
        }

        const source = new zxing.HTMLCanvasElementLuminanceSource(canvas);
        const bitmap = new zxing.BinaryBitmap(new zxing.HybridBinarizer(source));
        const hints = new Map();
        hints.set(zxing.DecodeHintType.POSSIBLE_FORMATS, [
            zxing.BarcodeFormat.QR_CODE,
            zxing.BarcodeFormat.DATA_MATRIX,
            zxing.BarcodeFormat.AZTEC,
            zxing.BarcodeFormat.PDF_417,
            zxing.BarcodeFormat.CODE_128,
            zxing.BarcodeFormat.CODE_39,
            zxing.BarcodeFormat.CODE_93,
            zxing.BarcodeFormat.CODABAR,
            zxing.BarcodeFormat.EAN_13,
            zxing.BarcodeFormat.EAN_8,
            zxing.BarcodeFormat.UPC_A,
            zxing.BarcodeFormat.UPC_E,
            zxing.BarcodeFormat.ITF
        ]);

        const reader = new zxing.MultiFormatReader();
        const found = [];

        try {
            const result = reader.decode(bitmap, hints);
            found.push({
                text: result.getText(),
                format: barcodeFormatName(zxing, result.getBarcodeFormat())
            });
        } catch (error) {
            if (error?.name !== "NotFoundException" && error?.constructor?.name !== "NotFoundException") {
                throw error;
            }
        }

        renderCodes(found);
        qrBlock.classList.remove("hidden");
        showToast(found.length > 0
            ? `Found ${found.length} code${found.length === 1 ? "" : "s"}.`
            : "No QR codes or barcodes were found in this image.");
    } catch (error) {
        scannerNote.textContent = error.message;
        showToast(error.message);
        console.error("Barcode scan failed:", error);
    } finally {
        image?.close();
        setScannerBusy(false, scannerNote.textContent);
    }
}

function renderCodes(codes) {
    qrResults.innerHTML = "";

    if (codes.length === 0) {
        qrResults.innerHTML = `<p class="qr-empty">Nothing was decoded. Try a sharper image or crop closer to the code.</p>`;
        return;
    }

    for (const code of codes) {
        const row = document.createElement("div");
        row.className = "qr-row";
        row.innerHTML = `
            <span class="qr-format">${escapeHtml(code.format)}</span>
            <code class="qr-value">${escapeHtml(code.text)}</code>
            <button class="text-button" type="button">Copy</button>
        `;
        row.querySelector("button").addEventListener("click", async () => {
            await copyToClipboard(code.text);
            showToast("Code copied to clipboard.");
        });
        qrResults.appendChild(row);
    }
}

qrBtn.addEventListener("click", scanBarcodes);
qrCloseBtn.addEventListener("click", () => qrBlock.classList.add("hidden"));

/* ------------------------------ result rendering ---------------------------- */

function updateConfidence() {
    if (lastConfidence === null || !Number.isFinite(lastConfidence)) {
        confidenceRow.classList.add("hidden");
        return;
    }

    const value = Math.max(0, Math.min(100, Math.round(lastConfidence)));
    confidenceRow.classList.remove("hidden");
    confidenceValue.textContent = `${value}%`;
    confidenceFill.style.width = `${value}%`;
    confidenceFill.className = `confidence-fill ${value >= 80 ? "is-good" : value >= 55 ? "is-fair" : "is-low"}`;
}

function updateTextStats() {
    const stats = TextTools.describe(outputText.value);
    textStats.classList.toggle("hidden", !outputText.value.trim());
    statWords.textContent = stats.words;
    statChars.textContent = stats.characters;
    statLines.textContent = stats.lines;
    statRead.textContent = `${stats.readingMinutes}m`;
}

function updateWordCount() {
    const text = outputText.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const characters = outputText.value.length;

    wordCount.textContent = `${words} ${words === 1 ? "word" : "words"} / ${characters} ${characters === 1 ? "character" : "characters"}`;
    summarizeBtn.disabled = !text || isProcessing;
    detectTableBtn.disabled = !text || !lastOcrWords.length || isProcessing;
    copyBtn.disabled = !text || isProcessing;
    exportBtn.disabled = !text || isProcessing;
    updateTextStats();
}

const SPELLING_SUGGESTIONS = new Map(Object.entries({
    accomodate: "accommodate",
    becuase: "because",
    definately: "definitely",
    doesnt: "doesn't",
    dont: "don't",
    enviroment: "environment",
    goverment: "government",
    occured: "occurred",
    recieve: "receive",
    seperate: "separate",
    teh: "the",
    thier: "their",
    untill: "until",
    wich: "which"
}));

function preserveCorrectionCase(original, correction) {
    if (original === original.toUpperCase()) {
        return correction.toUpperCase();
    }
    if (original[0] === original[0].toUpperCase()) {
        return correction[0].toUpperCase() + correction.slice(1);
    }
    return correction;
}

function findWritingIssues(text) {
    const issues = [];
    const replaceLastCapture = (match, capture, replacement) => {
        const captureIndex = match[0].lastIndexOf(capture);
        return match[0].slice(0, captureIndex) + replacement
            + match[0].slice(captureIndex + capture.length);
    };
    const addMatches = (pattern, label, getCorrection) => {
        for (const match of text.matchAll(pattern)) {
            const correction = getCorrection(match);
            const original = match[0];
            if (correction && correction !== original) {
                issues.push({
                    start: match.index,
                    end: match.index + original.length,
                    original,
                    correction,
                    label
                });
            }
        }
    };

    const spellingPattern = new RegExp(
        `\\b(${[...SPELLING_SUGGESTIONS.keys()].join("|")})\\b`,
        "gi"
    );
    addMatches(spellingPattern, "Possible spelling mistake", (match) => {
        const suggestion = SPELLING_SUGGESTIONS.get(match[0].toLowerCase());
        return preserveCorrectionCase(match[0], suggestion);
    });

    addMatches(/\b([\p{L}]+)(\s+)\1\b/giu, "Repeated word", (match) => match[1] + match[2]);
    addMatches(/\b(a)\s+([\p{L}][\p{L}'-]*)/giu, "Article may be incorrect", (match) => {
        const nextWord = match[2].toLowerCase();
        const useAn = /^(hour|honest|honor|heir)/.test(nextWord)
            || (/^[aeiou]/.test(nextWord) && !/^(uni([^n]|$)|use|user|usual|euro|one)/.test(nextWord));
        const article = useAn ? "an" : "a";
        return preserveCorrectionCase(match[1], article) + match[0].slice(match[1].length);
    });
    addMatches(/\b(an)\s+([\p{L}][\p{L}'-]*)/giu, "Article may be incorrect", (match) => {
        const nextWord = match[2].toLowerCase();
        const useAn = /^(hour|honest|honor|heir)/.test(nextWord)
            || (/^[aeiou]/.test(nextWord) && !/^(uni([^n]|$)|use|user|usual|euro|one)/.test(nextWord));
        const article = useAn ? "an" : "a";
        return preserveCorrectionCase(match[1], article) + match[0].slice(match[1].length);
    });

    const grammarRules = [
        [/\b(he|she|it)\s+(dont)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "doesn't"))],
        [/\b(he|she|it)\s+(don't)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "doesn't"))],
        [/\b(i|you|we|they)\s+(doesn't)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "don't"))],
        [/\b(he|she|it)\s+(are)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "is"))],
        [/\b(i)\s+(is|are)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "am"))],
        [/\b(you|we|they)\s+(is)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "are"))],
        [/\b(he|she|it)\s+(have)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "has"))],
        [/\b(i|you|we|they)\s+(has)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], "have"))],
        [/\b(this|that)\s+(are|were)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], match[2].toLowerCase() === "were" ? "was" : "is"))],
        [/\b(these|those)\s+(is|was)\b/gi, "Subject–verb agreement", (match) => replaceLastCapture(match, match[2], preserveCorrectionCase(match[2], match[2].toLowerCase() === "was" ? "were" : "are"))],
        [/\b(there)\s+(is|was)\s+([\p{L}]+\w+s)\b/giu, "Subject–verb agreement", (match) => (
            `${match[1]} ${preserveCorrectionCase(match[2], match[2].toLowerCase() === "was" ? "were" : "are")} ${match[3]}`
        )]
    ];
    for (const [pattern, label, getCorrection] of grammarRules) {
        addMatches(pattern, label, getCorrection);
    }

    addMatches(/\s+([,.;!?])/g, "Unexpected space before punctuation", (match) => {
        const followingCharacter = text[match.index + match[0].length];
        return match[1] + (followingCharacter && !/\s/.test(followingCharacter) ? " " : "");
    });
    addMatches(/([,;:!?])(?=\S)/g, "Missing space after punctuation", (match) => `${match[1]} `);
    addMatches(/([.!?]\s+)([a-z])/g, "Sentence may need capitalization", (match) => (
        `${match[1]}${match[2].toUpperCase()}`
    ));

    issues.sort((first, second) => first.start - second.start || second.end - first.end);
    const nonOverlapping = [];
    let coveredUntil = -1;
    for (const issue of issues) {
        if (issue.start >= coveredUntil) {
            nonOverlapping.push(issue);
            coveredUntil = issue.end;
        }
    }
    return nonOverlapping;
}

function renderWritingIssues(issues) {
    proofreadFindings.replaceChildren();
    proofreadResults.classList.remove("hidden");
    proofreadSummary.textContent = issues.length
        ? `${issues.length} possible issue${issues.length === 1 ? "" : "s"} found`
        : "No likely issues found by the English checks.";
    applyAllProofreadBtn.classList.toggle("hidden", issues.length === 0);

    for (const issue of issues) {
        const card = document.createElement("article");
        card.className = "proofread-finding";
        const label = document.createElement("small");
        label.textContent = issue.label;
        const change = document.createElement("p");
        change.className = "proofread-change";
        const original = document.createElement("mark");
        original.textContent = issue.original;
        const arrow = document.createElement("span");
        arrow.textContent = " → ";
        const correction = document.createElement("strong");
        correction.textContent = issue.correction;
        change.append(original, arrow, correction);

        const apply = document.createElement("button");
        apply.type = "button";
        apply.className = "text-button";
        apply.textContent = "Apply";
        apply.addEventListener("click", () => applyWritingCorrections([issue]));
        card.append(label, change, apply);
        proofreadFindings.appendChild(card);
    }
}

function applyWritingCorrections(issues) {
    let text = outputText.value;
    for (const issue of [...issues].sort((first, second) => second.start - first.start)) {
        if (text.slice(issue.start, issue.end) === issue.original) {
            text = text.slice(0, issue.start) + issue.correction + text.slice(issue.end);
        }
    }
    outputText.value = text;
    summaryBlock.classList.add("hidden");
    updateWordCount();
    renderWritingIssues(findWritingIssues(text));
}

function detectTableRows(words) {
    const positionedWords = words
        .filter((word) => {
            const box = word.bbox;
            return word.text?.trim() && box
                && [box.x0, box.x1, box.y0, box.y1].every(Number.isFinite)
                && box.x1 > box.x0 && box.y1 > box.y0;
        })
        .map((word) => ({
            text: word.text.trim(),
            x0: word.bbox.x0,
            x1: word.bbox.x1,
            centerY: (word.bbox.y0 + word.bbox.y1) / 2,
            height: word.bbox.y1 - word.bbox.y0
        }));
    if (positionedWords.length < 4) {
        return [];
    }

    const heights = positionedWords.map((word) => word.height).sort((a, b) => a - b);
    const rowTolerance = Math.max(2, heights[Math.floor(heights.length / 2)] * 0.65);
    const medianHeight = heights[Math.floor(heights.length / 2)];
    const rows = [];
    for (const word of positionedWords.sort((a, b) => a.centerY - b.centerY || a.x0 - b.x0)) {
        let row = rows.find((candidate) => Math.abs(candidate.centerY - word.centerY) <= rowTolerance);
        if (!row) {
            row = { words: [], centerY: word.centerY };
            rows.push(row);
        }
        row.words.push(word);
        row.centerY = row.words.reduce((sum, item) => sum + item.centerY, 0) / row.words.length;
    }

    const cellGap = Math.max(8, medianHeight * 1.2);
    const parsedRows = rows
        .sort((a, b) => a.centerY - b.centerY)
        .map((row) => {
            const cells = [];
            let current = [];
            let previous = null;
            for (const word of row.words.sort((a, b) => a.x0 - b.x0)) {
                if (previous && word.x0 - previous.x1 > cellGap) {
                    cells.push(current.map((item) => item.text).join(" "));
                    current = [];
                }
                current.push(word);
                previous = word;
            }
            if (current.length) {
                cells.push(current.map((item) => item.text).join(" "));
            }
            return cells;
        });
    const tableRows = parsedRows.filter((row) => row.length > 1);
    if (tableRows.length < 2) {
        return [];
    }

    const columnCount = Math.max(...tableRows.map((row) => row.length));
    return tableRows.map((row) => [...row, ...Array(columnCount - row.length).fill("")]);
}

function renderDetectedTable(rows) {
    detectedTable = rows;
    tablePreview.replaceChildren();
    if (rows.length === 0) {
        tableBlock.classList.remove("hidden");
        tableSummary.textContent = "No clear rows and columns found. Try cropping closer to the table and run OCR again.";
        exportTableBtn.disabled = true;
        return;
    }

    const columnCount = Math.max(...rows.map((row) => row.length));
    tableSummary.textContent = `${rows.length} rows × ${columnCount} columns. Click a cell to edit before exporting.`;
    const table = document.createElement("table");
    table.className = "detected-table";
    const body = document.createElement("tbody");
    rows.forEach((row, rowIndex) => {
        const tableRow = document.createElement("tr");
        row.forEach((cell, columnIndex) => {
            const cellElement = document.createElement("td");
            cellElement.textContent = cell;
            cellElement.contentEditable = "true";
            cellElement.setAttribute("aria-label", `Row ${rowIndex + 1}, column ${columnIndex + 1}`);
            tableRow.appendChild(cellElement);
        });
        body.appendChild(tableRow);
    });
    table.appendChild(body);
    tablePreview.appendChild(table);
    exportTableBtn.disabled = false;
    tableBlock.classList.remove("hidden");
}

function readEditedTable() {
    return [...tablePreview.querySelectorAll("tr")].map((row) =>
        [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim())
    );
}

function renderOcrWordMap(words) {
    ocrWordMap.replaceChildren();
    const positionedWords = words.filter((word) => word.text?.trim() && word.bbox
        && [word.bbox.x0, word.bbox.x1, word.bbox.y0, word.bbox.y1].every(Number.isFinite));
    if (!positionedWords.length) {
        wordMapToggleBtn.classList.add("hidden");
        return;
    }

    const heights = positionedWords.map((word) => word.bbox.y1 - word.bbox.y0).sort((a, b) => a - b);
    const tolerance = Math.max(2, heights[Math.floor(heights.length / 2)] * 0.65);
    const lines = [];
    for (const word of [...positionedWords].sort((a, b) =>
        (a.bbox.y0 + a.bbox.y1) - (b.bbox.y0 + b.bbox.y1) || a.bbox.x0 - b.bbox.x0
    )) {
        const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
        let line = lines.find((candidate) => Math.abs(candidate.centerY - centerY) <= tolerance);
        if (!line) {
            line = { centerY, words: [] };
            lines.push(line);
        }
        line.words.push(word);
        line.centerY = line.words.reduce((sum, item) => sum + (item.bbox.y0 + item.bbox.y1) / 2, 0) / line.words.length;
    }

    lines.sort((a, b) => a.centerY - b.centerY).forEach((line, lineIndex) => {
        if (lineIndex > 0) {
            ocrWordMap.appendChild(document.createElement("br"));
        }
        line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0).forEach((word) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "ocr-word";
            button.textContent = word.text;
            button.setAttribute("aria-label", `Locate ${word.text} in image`);
            button.addEventListener("click", () => {
                highlightedOcrWord = word;
                for (const selected of ocrWordMap.querySelectorAll(".ocr-word.is-selected")) {
                    selected.classList.remove("is-selected");
                }
                button.classList.add("is-selected");
                drawOcrHighlight();
                previewWrap.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            ocrWordMap.appendChild(button);
            ocrWordMap.appendChild(document.createTextNode(" "));
        });
    });
    wordMapToggleBtn.classList.remove("hidden");
}

function clearOcrHighlight() {
    const context = ocrHighlightCanvas.getContext("2d");
    if (context) {
        context.clearRect(0, 0, ocrHighlightCanvas.width, ocrHighlightCanvas.height);
    }
}

function drawOcrHighlight() {
    const bounds = ocrHighlightCanvas.getBoundingClientRect();
    const imageWidth = imagePreview.naturalWidth;
    const imageHeight = imagePreview.naturalHeight;
    const dimensions = lastOcrImageDimensions;
    const word = highlightedOcrWord;
    if (!bounds.width || !bounds.height || !imageWidth || !imageHeight || !dimensions || !word) {
        clearOcrHighlight();
        return;
    }

    const ratio = window.devicePixelRatio || 1;
    ocrHighlightCanvas.width = Math.round(bounds.width * ratio);
    ocrHighlightCanvas.height = Math.round(bounds.height * ratio);
    const context = ocrHighlightCanvas.getContext("2d");
    if (!context) {
        return;
    }
    context.scale(ratio, ratio);
    context.clearRect(0, 0, bounds.width, bounds.height);

    const scale = Math.min(bounds.width / imageWidth, bounds.height / imageHeight);
    const renderedWidth = imageWidth * scale;
    const renderedHeight = imageHeight * scale;
    const offsetX = (bounds.width - renderedWidth) / 2;
    const offsetY = (bounds.height - renderedHeight) / 2;
    const x = offsetX + word.bbox.x0 / dimensions.width * renderedWidth;
    const y = offsetY + word.bbox.y0 / dimensions.height * renderedHeight;
    const width = (word.bbox.x1 - word.bbox.x0) / dimensions.width * renderedWidth;
    const height = (word.bbox.y1 - word.bbox.y0) / dimensions.height * renderedHeight;
    context.fillStyle = "rgba(255, 213, 79, 0.42)";
    context.strokeStyle = "#b54708";
    context.lineWidth = 2;
    context.fillRect(x, y, width, height);
    context.strokeRect(x, y, width, height);
}

detectTableBtn.addEventListener("click", () => {
    renderDetectedTable(detectTableRows(lastOcrWords));
});

wordMapToggleBtn.addEventListener("click", () => {
    const isOpening = ocrWordMap.classList.contains("hidden");
    ocrWordMap.classList.toggle("hidden", !isOpening);
    wordMapToggleBtn.setAttribute("aria-expanded", String(isOpening));
    wordMapToggleBtn.textContent = isOpening
        ? "Hide clickable text"
        : "Click words to locate them in the image";
});

imagePreview.addEventListener("load", drawOcrHighlight);
window.addEventListener("resize", drawOcrHighlight);

exportTableBtn.addEventListener("click", () => {
    const rows = readEditedTable();
    if (!rows.length) {
        return;
    }
    const csv = rows.map((row) => row.map((cell) => {
        const safeCell = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
        return `"${safeCell.replace(/"/g, '""')}"`;
    }).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const baseName = (selectedFile?.name || lastResultMeta?.fileName || "ocr-table")
        .replace(/\.[^.]+$/, "")
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
        .trim() || "ocr-table";
    Exporters.downloadBlob(`${baseName}-table.csv`, blob);
    showToast("Table exported as CSV. Open it in Excel.");
});

proofreadBtn.addEventListener("click", () => {
    const resultLanguage = lastResultMeta?.language || ocrLanguage();
    if (resultLanguage !== "eng") {
        proofreadFindings.replaceChildren();
        proofreadResults.classList.remove("hidden");
        proofreadSummary.textContent = "Writing review currently supports English text only. Select English and run OCR again to check this document.";
        applyAllProofreadBtn.classList.add("hidden");
        return;
    }

    renderWritingIssues(findWritingIssues(outputText.value));
});

applyAllProofreadBtn.addEventListener("click", () => {
    applyWritingCorrections(findWritingIssues(outputText.value));
});

const SUMMARY_STOP_WORDS = new Set(
    "a an and are as at be been but by can for from had has have he her his i if in is it its of on or our she that the their them they this to was we were will with you your".split(" ")
);

function summarizeText(text) {
    const sentences = text.match(/[^.!?\r\n]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
    if (sentences.length < 2) {
        return "";
    }

    const wordsBySentence = sentences.map((sentence) =>
        sentence.toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []
    );
    const frequencies = new Map();
    for (const words of wordsBySentence) {
        for (const word of words) {
            if (!SUMMARY_STOP_WORDS.has(word)) {
                frequencies.set(word, (frequencies.get(word) || 0) + 1);
            }
        }
    }

    const ranked = wordsBySentence.map((words, index) => {
        const contentWords = words.filter((word) => !SUMMARY_STOP_WORDS.has(word));
        const score = contentWords.reduce((sum, word) => sum + (frequencies.get(word) || 0), 0)
            / Math.sqrt(Math.max(1, contentWords.length));
        return { index, score };
    });
    const summaryCount = Math.min(5, Math.max(1, Math.ceil(sentences.length * 0.3)));
    const selected = ranked
        .sort((first, second) => second.score - first.score || first.index - second.index)
        .slice(0, summaryCount)
        .map(({ index }) => index)
        .sort((first, second) => first - second);

    return selected.map((index) => sentences[index]).join(" ");
}

summarizeBtn.addEventListener("click", () => {
    const summary = summarizeText(outputText.value);
    if (!summary) {
        showToast("Add at least two sentences to create a summary.");
        return;
    }

    summaryText.textContent = summary;
    summaryBlock.classList.remove("hidden");
});

copySummaryBtn.addEventListener("click", async () => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(summaryText.textContent);
        } else {
            const temporaryInput = document.createElement("textarea");
            temporaryInput.value = summaryText.textContent;
            temporaryInput.style.position = "fixed";
            temporaryInput.style.opacity = "0";
            document.body.appendChild(temporaryInput);
            temporaryInput.select();
            const copied = document.execCommand("copy");
            temporaryInput.remove();
            if (!copied) {
                throw new Error("Clipboard copy was not available.");
            }
        }
        showToast("Summary copied to clipboard.");
    } catch (error) {
        showToast("Could not copy the summary. Select it and copy manually.");
        console.error("Summary copy failed:", error);
    }
});

function clearResult() {
    outputText.value = "";
    lastOcrWords = [];
    lastOcrImageDimensions = null;
    highlightedOcrWord = null;
    tablePreview.replaceChildren();
    tableBlock.classList.add("hidden");
    wordMapToggleBtn.classList.add("hidden");
    wordMapToggleBtn.setAttribute("aria-expanded", "false");
    wordMapToggleBtn.textContent = "Click words to locate them in the image";
    ocrWordMap.classList.add("hidden");
    ocrWordMap.replaceChildren();
    clearOcrHighlight();
    proofreadFindings.replaceChildren();
    proofreadResults.classList.add("hidden");
    summaryText.textContent = "";
    summaryBlock.classList.add("hidden");
    resultOutput.classList.add("hidden");
    resultPlaceholder.classList.remove("hidden");
    resultStatus.textContent = selectedFile ? "Image ready" : "Awaiting image";
    lastConfidence = null;
    lastResultMeta = null;
    updateConfidence();
    updateWordCount();
    updateTextStats();
}

/* ------------------------------ cleanup options ----------------------------- */

const DEFAULT_CLEANUP_PASSES = ["dehyphenate", "misreads", "punctuation", "duplicates", "whitespace"];

function renderCleanupOptions() {
    cleanupOptions.innerHTML = "";

    for (const pass of TextTools.PASSES) {
        const label = document.createElement("label");
        label.className = "cleanup-option";
        const isChecked = DEFAULT_CLEANUP_PASSES.includes(pass.id);
        label.innerHTML = `<input type="checkbox" value="${escapeHtml(pass.id)}" ${isChecked ? "checked" : ""}>`
            + `<span><strong>${escapeHtml(pass.label)}</strong><small>${escapeHtml(pass.hint)}</small></span>`;
        cleanupOptions.appendChild(label);
    }
}

cleanupToggleBtn.addEventListener("click", () => {
    const isOpen = !cleanupOptions.classList.contains("hidden");
    cleanupOptions.classList.toggle("hidden", isOpen);
    cleanupToggleBtn.setAttribute("aria-expanded", String(!isOpen));
    cleanupToggleBtn.textContent = isOpen ? "Options" : "Hide options";
});

applyCleanupBtn.addEventListener("click", () => {
    const enabled = [...cleanupOptions.querySelectorAll("input:checked")].map((input) => input.value);
    const result = TextTools.clean(outputText.value, enabled);

    if (result.applied.length === 0) {
        cleanupSummary.textContent = "Nothing needed changing.";
        showToast("The text was already clean.");
        return;
    }

    outputText.value = result.text;
    proofreadResults.classList.add("hidden");
    summaryBlock.classList.add("hidden");
    updateWordCount();
    cleanupSummary.textContent = `Fixed: ${result.applied.map((pass) => pass.label).join(", ")}.`;
    showToast(`Cleanup applied (${result.applied.length} pass${result.applied.length === 1 ? "" : "es"}).`);
});

/* --------------------------------- export menu ------------------------------ */

function renderExportMenu() {
    exportMenu.innerHTML = "";

    for (const format of Exporters.FORMATS) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "export-item";
        item.textContent = format.label;
        item.addEventListener("click", () => {
            exportMenu.classList.add("hidden");
            exportBtn.setAttribute("aria-expanded", "false");
            Exporters.exportAs(format.id, {
                text: outputText.value,
                fileName: selectedFile?.name || lastResultMeta?.fileName || "extracted-text",
                meta: lastResultMeta || {}
            });
            showToast(`${format.label} downloaded.`);
        });
        exportMenu.appendChild(item);
    }
}

exportBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = !exportMenu.classList.contains("hidden");
    exportMenu.classList.toggle("hidden", isOpen);
    exportBtn.setAttribute("aria-expanded", String(!isOpen));
});

exportMenu.addEventListener("click", (event) => event.stopPropagation());

/* ------------------------------- copy & download ---------------------------- */

async function copyToClipboard(text) {
    if (!text.trim()) {
        return;
    }

    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    outputText.focus();
    outputText.select();
    const copied = document.execCommand("copy");
    outputText.setSelectionRange(outputText.value.length, outputText.value.length);
    if (!copied) {
        throw new Error("Clipboard copy was not available.");
    }
}

async function copyText() {
    const text = outputText.value;
    if (!text.trim()) {
        return;
    }

    try {
        await copyToClipboard(text);
        showToast("Text copied to clipboard.");
    } catch (error) {
        showToast("Could not copy the text. Select it and copy manually.");
        console.error("Clipboard copy failed:", error);
    }
}

/* ------------------------------- image to PDF ------------------------------- */

function createImagePdf(jpegBytes, imageWidth, imageHeight) {
    const encoder = new TextEncoder();
    const pageWidth = imageWidth > imageHeight ? 841.89 : 595.28;
    const pageHeight = imageWidth > imageHeight ? 595.28 : 841.89;
    const margin = 24;
    const scale = Math.min(
        (pageWidth - margin * 2) / imageWidth,
        (pageHeight - margin * 2) / imageHeight
    );
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const drawX = (pageWidth - drawWidth) / 2;
    const drawY = (pageHeight - drawHeight) / 2;
    const content = `q ${drawWidth.toFixed(3)} 0 0 ${drawHeight.toFixed(3)} `
        + `${drawX.toFixed(3)} ${drawY.toFixed(3)} cm /Im0 Do Q`;
    const contentBytes = encoder.encode(content);
    const objects = [
        encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"),
        encoder.encode("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        encoder.encode(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] `
            + "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"
        ),
        concatBytes([
            encoder.encode(
                `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} `
                + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode `
                + `/Length ${jpegBytes.length} >>\nstream\n`
            ),
            jpegBytes,
            encoder.encode("\nendstream")
        ]),
        encoder.encode(`<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`)
    ];
    const header = encoder.encode("%PDF-1.4\n");
    const chunks = [header];
    const offsets = [0];
    let offset = header.length;

    for (let index = 0; index < objects.length; index += 1) {
        const object = concatBytes([
            encoder.encode(`${index + 1} 0 obj\n`),
            objects[index],
            encoder.encode("\nendobj\n")
        ]);
        offsets.push(offset);
        chunks.push(object);
        offset += object.length;
    }

    const xrefOffset = offset;
    const xref = [
        `xref\n0 ${objects.length + 1}\n`,
        "0000000000 65535 f \n",
        ...offsets.slice(1).map((objectOffset) => `${String(objectOffset).padStart(10, "0")} 00000 n \n`),
        `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`,
        `startxref\n${xrefOffset}\n%%EOF`
    ].join("");
    chunks.push(encoder.encode(xref));

    return new Blob(chunks, { type: "application/pdf" });
}

function concatBytes(chunks) {
    const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
    let offset = 0;

    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }

    return result;
}

async function downloadImagePdf() {
    if (!selectedFile || isProcessing || pdfBtn.disabled) {
        return;
    }

    const file = selectedFile;
    const imageUrl = URL.createObjectURL(file);
    pdfBtn.disabled = true;
    pdfBtn.setAttribute("aria-busy", "true");
    pdfBtn.textContent = "Creating PDF...";

    try {
        const image = new Image();
        image.src = imageUrl;
        await image.decode();

        const maxDimension = 4000;
        const resizeScale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * resizeScale));
        const height = Math.max(1, Math.round(image.naturalHeight * resizeScale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Your browser could not prepare the image for PDF.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const jpegData = canvas.toDataURL("image/jpeg", 0.92);
        const jpegBytes = Uint8Array.from(atob(jpegData.split(",")[1]), (character) => character.charCodeAt(0));
        const pdfBlob = createImagePdf(jpegBytes, width, height);
        const downloadUrl = URL.createObjectURL(pdfBlob);
        const baseName = file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
            .trim() || "image";
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${baseName}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        showToast("Image PDF downloaded.");
    } catch (error) {
        showToast("Could not create the PDF. Try another image.");
        console.error("Image PDF creation failed:", error);
    } finally {
        URL.revokeObjectURL(imageUrl);
        pdfBtn.removeAttribute("aria-busy");
        pdfBtn.textContent = "Download image as PDF";
        pdfBtn.disabled = isProcessing || !selectedFile;
    }
}

/* -------------------------------- extraction -------------------------------- */

async function extractText() {
    if (!selectedFile || isProcessing) {
        return;
    }

    if (autoEnhanceCheckbox.checked) {
        try {
            const enhanced = await cleanImage({ forOcr: true });
            if (!enhanced) {
                return;
            }
        } catch (error) {
            resultStatus.textContent = "Scan preparation failed";
            showToast("Could not enhance the image. Turn off auto-clean or try another image.");
            console.error("Automatic image enhancement failed:", error);
            return;
        }
    }

    const file = selectedFile;
    const language = ocrLanguage();
    setProcessing(true);
    resultStatus.textContent = "Loading OCR...";

    try {
        const data = await runOcr(file, language, (message) => {
            if (message.status === "recognizing text") {
                const progress = Math.round((message.progress || 0) * 100);
                resultStatus.textContent = `Reading text / ${progress}%`;
            } else if (message.status) {
                resultStatus.textContent = `${message.status}...`;
            }
        });

        const recognizedText = (data.text || "").trim();

        if (!recognizedText) {
            resultStatus.textContent = "No text found";
            showToast("No readable text was found. Try a clearer image.");
            return;
        }

        outputText.value = recognizedText;
        lastOcrWords = Array.isArray(data.words) ? data.words : [];
        lastOcrImageDimensions = Number.isFinite(data.imageWidth) && Number.isFinite(data.imageHeight)
            ? { width: data.imageWidth, height: data.imageHeight }
            : null;
        highlightedOcrWord = null;
        tableBlock.classList.add("hidden");
        tablePreview.replaceChildren();
        clearOcrHighlight();
        renderOcrWordMap(lastOcrWords);
        lastConfidence = Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : null;
        lastResultMeta = {
            title: file.name.replace(/\.[^.]+$/, "") || "Extracted text",
            language,
            confidence: lastConfidence,
            fileName: file.name
        };
        resultPlaceholder.classList.add("hidden");
        resultOutput.classList.remove("hidden");
        cleanupBlock.classList.remove("hidden");
        resultStatus.textContent = "Complete";
        updateConfidence();
        updateWordCount();
        updateTextStats();
        showToast("Text extracted successfully.");

        const activeItem = queue.find((item) => item.id === activeQueueId);
        if (activeItem) {
            activeItem.text = recognizedText;
            activeItem.confidence = lastConfidence;
            activeItem.language = language;
            activeItem.status = "done";
            renderBatchList();
        }

        if (saveToLibraryToggle.checked) {
            await persistScan({
                title: file.name.replace(/\.[^.]+$/, "") || "Extracted text",
                file_name: file.name,
                text: recognizedText,
                language,
                confidence: lastConfidence,
                char_count: recognizedText.length,
                word_count: recognizedText.split(/\s+/).filter(Boolean).length,
                thumbnail: await createThumbnail(file),
                source: "single"
            });
        }
    } catch (error) {
        resultStatus.textContent = "OCR failed";
        showToast("Text extraction failed. Check your connection and try again.");
        console.error("OCR extraction failed:", error);
    } finally {
        setProcessing(false);
        if (selectedFile) {
            extractBtn.disabled = false;
        }
    }
}

async function persistScan(payload) {
    try {
        await saveDocumentToLibrary(payload);
        await loadLibrary();
        return true;
    } catch (error) {
        showToast(error.message || "The scan could not be saved to your library.");
        console.error("Could not save the scan:", error);
        return false;
    }
}

/* --------------------------------- the queue -------------------------------- */

function setSelectedFile(file) {
    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        showToast("Please choose a valid image file.");
        return;
    }

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }

    selectedFile = file;
    previewUrl = URL.createObjectURL(file);
    imagePreview.src = previewUrl;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    previewWrap.classList.remove("hidden");
    scannerTools.classList.remove("hidden");
    dropZone.classList.add("hidden");
    cropEditor.classList.add("hidden");
    cropSelection = null;
    cropImageSize?.close();
    cropImageSize = null;
    scannerNote.textContent = "Edits are applied before text extraction.";
    extractBtn.disabled = isProcessing;
    classifyLetterBtn.disabled = isProcessing;
    letterClassifierResult.textContent = "Ready to recognize one letter.";
    pdfBtn.disabled = isProcessing;
    resultStatus.textContent = "Image ready";
    clearResult();

    const activeItem = queue.find((item) => item.id === activeQueueId);
    if (activeItem) {
        activeItem.file = file;
        activeItem.name = file.name;
        activeItem.size = file.size;
    }
}

function addFilesToQueue(files) {
    const images = [...files].filter((file) => file.type.startsWith("image/"));

    if (images.length === 0) {
        showToast("Please choose image files.");
        return;
    }

    for (const file of images) {
        queueCounter += 1;
        queue.push({
            id: `q${queueCounter}`,
            file,
            name: file.name,
            size: file.size,
            status: "queued",
            progress: 0,
            text: "",
            confidence: null,
            language: "",
            error: ""
        });
    }

    if (!activeQueueId) {
        activeQueueId = queue[0].id;
    }

    const activeItem = queue.find((item) => item.id === activeQueueId);
    if (activeItem) {
        setSelectedFile(activeItem.file);
    }

    renderBatchList();
    showToast(`${images.length} file${images.length === 1 ? "" : "s"} added to the queue.`);
}

function removeSelectedFile() {
    if (isProcessing) {
        return;
    }

    const index = queue.findIndex((item) => item.id === activeQueueId);

    if (index !== -1) {
        queue.splice(index, 1);
    }

    selectedFile = null;
    imageInput.value = "";

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    imagePreview.removeAttribute("src");
    previewWrap.classList.add("hidden");
    scannerTools.classList.add("hidden");
    dropZone.classList.remove("hidden");
    cropEditor.classList.add("hidden");
    cropSelection = null;
    cropImageSize?.close();
    cropImageSize = null;
    extractBtn.disabled = true;
    classifyLetterBtn.disabled = true;
    letterClassifierResult.textContent = "Choose an image to get started.";
    pdfBtn.disabled = true;
    clearResult();

    const next = queue[index] || queue[0];
    if (next) {
        activeQueueId = next.id;
        setSelectedFile(next.file);
    } else {
        activeQueueId = null;
    }

    renderBatchList();
}

function setProcessing(processing) {
    isProcessing = processing;
    extractBtn.disabled = processing || !selectedFile;
    classifyLetterBtn.disabled = processing || !selectedFile || isScanningImage;
    pdfBtn.disabled = processing || !selectedFile;
    extractBtn.setAttribute("aria-busy", String(processing));
    extractBtn.innerHTML = processing
        ? "<span>Reading image...</span>"
        : "<span>Extract text</span>";
    imageInput.disabled = processing;
    browseBtn.disabled = processing;
    removeBtn.disabled = processing;
    dropZone.setAttribute("aria-disabled", String(processing));
    for (const button of [
        rotateLeftBtn, rotateRightBtn, cropBtn, grayscaleBtn, enhanceBtn, perspectiveBtn,
        applyCropBtn, cancelCropBtn
    ]) {
        button.disabled = processing || (button === applyCropBtn && !cropSelection);
    }

    batchStartBtn.disabled = processing;
    batchClearBtn.disabled = processing;
    updateWordCount();
}

function renderBatchList() {
    const hasItems = queue.length > 0;
    batchSection.classList.toggle("hidden", !hasItems);
    batchList.innerHTML = "";

    if (!hasItems) {
        batchSummary.textContent = "No files queued yet.";
        batchDownloadBtn.disabled = true;
        return;
    }

    let done = 0;
    let failed = 0;

    for (const item of queue) {
        if (item.status === "done") {
            done += 1;
        } else if (item.status === "failed") {
            failed += 1;
        }

        const row = document.createElement("li");
        row.className = `batch-item is-${item.status}${item.id === activeQueueId ? " is-active" : ""}`;
        const statusText = item.status === "working"
            ? `${item.progress}%`
            : item.status;

        row.innerHTML = `
            <button class="batch-select" type="button" title="Show in the workspace"></button>
            <div class="batch-info">
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(formatFileSize(item.size))}${item.error ? ` — ${escapeHtml(item.error)}` : ""}</small>
            </div>
            <span class="batch-status">${escapeHtml(statusText)}</span>
            <div class="batch-progress"><span style="width: ${Math.max(0, Math.min(100, item.progress))}%"></span></div>
        `;

        row.querySelector(".batch-select").addEventListener("click", () => {
            activeQueueId = item.id;
            setSelectedFile(item.file);
            renderBatchList();
        });

        batchList.appendChild(row);
    }

    const pending = queue.length - done - failed;
    batchSummary.textContent = `${queue.length} file${queue.length === 1 ? "" : "s"} — `
        + `${done} done, ${pending} queued, ${failed} failed.`;
    batchDownloadBtn.disabled = done === 0;
}

async function runBatch() {
    if (isProcessing || queue.length === 0) {
        return;
    }

    const language = ocrLanguage();
    setProcessing(true);
    let processed = 0;
    let saved = 0;

    for (const item of queue) {
        if (item.status === "done" && item.text) {
            processed += 1;
            continue;
        }

        item.status = "working";
        item.progress = 0;
        item.error = "";
        renderBatchList();

        try {
            const data = await runOcr(item.file, language, (message) => {
                if (message.status === "recognizing text") {
                    item.progress = Math.round((message.progress || 0) * 100);
                    renderBatchList();
                }
            });

            item.text = (data.text || "").trim();
            item.confidence = Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : null;
            item.language = language;
            item.status = item.text ? "done" : "failed";
            if (!item.text) {
                item.error = "No text found";
            }
        } catch (error) {
            item.status = "failed";
            item.error = error.message || "Extraction failed";
            console.error("Batch extraction failed:", error);
        }

        processed += 1;
        item.progress = 100;
        renderBatchList();
    }

    if (saveToLibraryToggle.checked) {
        for (const item of queue) {
            if (item.status !== "done" || !item.text) {
                continue;
            }

            const stored = await persistScan({
                title: item.name.replace(/\.[^.]+$/, "") || "Extracted text",
                file_name: item.name,
                text: item.text,
                language: item.language || language,
                confidence: item.confidence,
                char_count: item.text.length,
                word_count: item.text.split(/\s+/).filter(Boolean).length,
                thumbnail: await createThumbnail(item.file),
                source: "batch"
            });

            if (stored) {
                saved += 1;
            }
        }
    }

    setProcessing(false);
    renderBatchList();
    showToast(`Batch finished: ${processed} processed, ${saved} saved.`);
}

batchStartBtn.addEventListener("click", runBatch);

batchClearBtn.addEventListener("click", () => {
    if (isProcessing) {
        return;
    }

    queue.length = 0;
    activeQueueId = null;
    removeSelectedFile();
    renderBatchList();
});

batchDownloadBtn.addEventListener("click", () => {
    const completed = queue.filter((item) => item.status === "done" && item.text);

    if (completed.length === 0) {
        return;
    }

    const combined = completed.map((item) => {
        const title = item.name.replace(/\.[^.]+$/, "") || "Extracted text";
        const confidence = Number.isFinite(Number(item.confidence))
            ? ` (confidence ${Math.round(Number(item.confidence))}%)`
            : "";
        return `## ${title}${confidence}\n\n${item.text}`;
    }).join("\n\n---\n\n");

    Exporters.exportAs("md", {
        text: combined,
        fileName: "textify-batch",
        meta: { title: "Textify batch export" }
    });

    showToast("Batch export downloaded.");
});

/* --------------------------------- listeners -------------------------------- */

browseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!isProcessing) {
        imageInput.click();
    }
});

dropZone.addEventListener("click", (event) => {
    if (event.target !== browseBtn && !isProcessing) {
        imageInput.click();
    }
});

dropZone.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !isProcessing) {
        event.preventDefault();
        imageInput.click();
    }
});

imageInput.addEventListener("change", () => {
    addFilesToQueue(imageInput.files);
    imageInput.value = "";
});

rotateLeftBtn.addEventListener("click", () => rotateSelectedImage(-1));
rotateRightBtn.addEventListener("click", () => rotateSelectedImage(1));
cropBtn.addEventListener("click", () => {
    openCropEditor().catch((error) => {
        scannerNote.textContent = error.message;
        showToast(error.message);
        console.error("Could not open image crop editor:", error);
    });
});
grayscaleBtn.addEventListener("click", convertImageToGrayscale);
enhanceBtn.addEventListener("click", cleanImage);
perspectiveBtn.addEventListener("click", correctPerspective);
applyCropBtn.addEventListener("click", applyImageCrop);
cancelCropBtn.addEventListener("click", cancelCropEditor);

cropCanvas.addEventListener("pointerdown", (event) => {
    if (!cropImageSize || isScanningImage || isProcessing) {
        return;
    }

    const bounds = cropCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(cropCanvas.width, (event.clientX - bounds.left) * cropCanvas.width / bounds.width));
    const y = Math.max(0, Math.min(cropCanvas.height, (event.clientY - bounds.top) * cropCanvas.height / bounds.height));
    cropPointerStart = { x, y };
    cropSelection = { x, y, width: 0, height: 0 };
    cropCanvas.setPointerCapture(event.pointerId);
    drawCropSelection();
});

cropCanvas.addEventListener("pointermove", (event) => {
    if (!cropPointerStart) {
        return;
    }

    const bounds = cropCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(cropCanvas.width, (event.clientX - bounds.left) * cropCanvas.width / bounds.width));
    const y = Math.max(0, Math.min(cropCanvas.height, (event.clientY - bounds.top) * cropCanvas.height / bounds.height));
    cropSelection = {
        x: Math.min(cropPointerStart.x, x),
        y: Math.min(cropPointerStart.y, y),
        width: Math.abs(x - cropPointerStart.x),
        height: Math.abs(y - cropPointerStart.y)
    };
    applyCropBtn.disabled = cropSelection.width < 8 || cropSelection.height < 8;
    drawCropSelection();
});

function finishCropSelection(event) {
    if (!cropPointerStart) {
        return;
    }

    cropPointerStart = null;
    if (cropCanvas.hasPointerCapture(event.pointerId)) {
        cropCanvas.releasePointerCapture(event.pointerId);
    }
    applyCropBtn.disabled = !cropSelection || cropSelection.width < 8 || cropSelection.height < 8;
}

cropCanvas.addEventListener("pointerup", finishCropSelection);
cropCanvas.addEventListener("pointercancel", finishCropSelection);

for (const eventName of ["dragenter", "dragover"]) {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (!isProcessing) {
            dropZone.classList.add("dragging");
        }
    });
}

for (const eventName of ["dragleave", "drop"]) {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove("dragging");
    });
}

dropZone.addEventListener("drop", (event) => {
    if (!isProcessing) {
        addFilesToQueue(event.dataTransfer.files);
    }
});

removeBtn.addEventListener("click", removeSelectedFile);
extractBtn.addEventListener("click", extractText);
classifyLetterBtn.addEventListener("click", classifySingleLetter);
pdfBtn.addEventListener("click", downloadImagePdf);
outputText.addEventListener("input", () => {
    summaryBlock.classList.add("hidden");
    proofreadResults.classList.add("hidden");
    updateWordCount();
});
copyBtn.addEventListener("click", copyText);

window.addEventListener("beforeunload", () => {
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
});

/* ---------------------------------- startup --------------------------------- */

renderLanguageOptions();
renderCleanupOptions();
renderExportMenu();
renderBatchList();
