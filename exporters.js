/*
 * Textify - Export formats.
 *
 * Produces .txt, .docx, .md, .csv, .html, .json and a real (selectable, searchable)
 * .pdf straight from the browser. Nothing leaves the machine.
 */

const Exporters = (() => {
    const MIME = {
        txt: "text/plain;charset=utf-8",
        md: "text/markdown;charset=utf-8",
        csv: "text/csv;charset=utf-8",
        html: "text/html;charset=utf-8",
        json: "application/json;charset=utf-8"
    };

    function safeFileName(name) {
        const base = String(name || "extracted-text")
            .replace(/\.[^.]+$/, "")
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
            .trim();

        return base || "extracted-text";
    }

    function downloadBlob(fileName, blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function downloadString(fileName, contents, mimeType) {
        downloadBlob(fileName, new Blob([contents], { type: mimeType }));
    }

    /* ------------------------------- plain text ------------------------------- */

    function buildText(text) {
        return String(text ?? "");
    }

    /* -------------------------------- markdown -------------------------------- */

    function buildMarkdown(text, meta = {}) {
        const title = meta.title || "Extracted text";
        const lines = [`# ${title}`, ""];

        if (meta.language) {
            lines.push(`- **Language:** ${meta.language}`);
        }

        if (Number.isFinite(Number(meta.confidence))) {
            lines.push(`- **OCR confidence:** ${Math.round(Number(meta.confidence))}%`);
        }

        if (meta.fileName) {
            lines.push(`- **Source:** ${meta.fileName}`);
        }

        if (meta.createdAt) {
            lines.push(`- **Extracted:** ${new Date(meta.createdAt).toLocaleString()}`);
        }

        lines.push("", "---", "");
        lines.push(buildText(text).trim());

        return `${lines.join("\n")}\n`;
    }

    /* ----------------------------------- csv ---------------------------------- */

    function splitCsvValue(value) {
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
    }

    function detectTableRows(lines) {
        const candidates = lines.filter((line) => line.trim().length > 0);

        if (candidates.length === 0) {
            return null;
        }

        const tabLines = candidates.filter((line) => line.includes("\t"));
        if (tabLines.length >= Math.max(2, candidates.length * 0.3)) {
            return {
                rows: candidates.map((line) => line.split("\t").map((cell) => cell.trim())),
                mode: "tab"
            };
        }

        const spaceLines = candidates.filter((line) => / {2,}/.test(line.trim()));
        if (spaceLines.length >= Math.max(2, candidates.length * 0.3)) {
            return {
                rows: candidates.map((line) => line.trim().split(/ {2,}/).map((cell) => cell.trim())),
                mode: "space"
            };
        }

        return null;
    }

    function buildCsv(text) {
        const value = buildText(text);
        const lines = value.split(/\r?\n/);
        const table = detectTableRows(lines);

        if (table) {
            const width = table.rows.reduce((max, row) => Math.max(max, row.length), 0);
            const header = table.rows[0] || [];
            const body = table.rows.slice(1);

            const rows = [
                header.map(splitCsvValue),
                ...body.map((row) => {
                    const cells = [...row];
                    while (cells.length < width) {
                        cells.push("");
                    }

                    return cells.map(splitCsvValue);
                })
            ];

            return `${rows.map((row) => row.join(",")).join("\r\n")}\r\n`;
        }

        const single = lines.map((line) => splitCsvValue(line)).join("\r\n");
        return `${single}\r\n`;
    }

    /* ---------------------------------- html ---------------------------------- */

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function buildHtml(text, meta = {}) {
        const title = meta.title || "Extracted text";
        const details = [];

        if (meta.language) {
            details.push(`<span><strong>Language</strong> ${escapeHtml(meta.language)}</span>`);
        }

        if (Number.isFinite(Number(meta.confidence))) {
            details.push(`<span><strong>Confidence</strong> ${Math.round(Number(meta.confidence))}%</span>`);
        }

        if (meta.fileName) {
            details.push(`<span><strong>Source</strong> ${escapeHtml(meta.fileName)}</span>`);
        }

        if (meta.createdAt) {
            details.push(`<span><strong>Extracted</strong> ${escapeHtml(new Date(meta.createdAt).toLocaleString())}</span>`);
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
    body { margin: 0; padding: 40px 24px; background: #f3f4f6; color: #111827;
        font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
    .sheet { max-width: 860px; margin: 0 auto; padding: 40px; background: #fff;
        border: 1px solid #e4e7ec; border-radius: 10px; }
    h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: -0.01em; }
    .meta { display: flex; flex-wrap: wrap; gap: 18px; margin: 14px 0 26px;
        padding-bottom: 18px; border-bottom: 1px solid #e4e7ec; color: #667085; font-size: 13px; }
    pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: ui-monospace,
        SFMono-Regular, Menlo, Consolas, monospace; font-size: 14px; line-height: 1.7; }
</style>
</head>
<body>
    <main class="sheet">
        <h1>${escapeHtml(title)}</h1>
        ${details.length ? `<div class="meta">${details.join("")}</div>` : ""}
        <pre>${escapeHtml(buildText(text).trim())}</pre>
    </main>
</body>
</html>
`;
    }

    /* ---------------------------------- json ---------------------------------- */

    function buildJson(text, meta = {}) {
        const value = buildText(text);
        const words = value.trim() ? value.trim().split(/\s+/) : [];

        return `${JSON.stringify({
            title: meta.title || "Extracted text",
            source: meta.fileName || null,
            language: meta.language || null,
            confidence: Number.isFinite(Number(meta.confidence)) ? Number(meta.confidence) : null,
            extractedAt: meta.createdAt || new Date().toISOString(),
            stats: {
                characters: value.length,
                words: words.length,
                lines: value.split(/\r?\n/).length
            },
            text: value.trim()
        }, null, 2)}\n`;
    }

    /* ------------------------------ word document ----------------------------- */

    function crc32(bytes) {
        let crc = 0xffffffff;

        for (const byte of bytes) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit += 1) {
                crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
            }
        }

        return (crc ^ 0xffffffff) >>> 0;
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

    function createStoredZip(files) {
        const encoder = new TextEncoder();
        const localChunks = [];
        const centralChunks = [];
        let localOffset = 0;
        let centralSize = 0;

        for (const file of files) {
            const nameBytes = encoder.encode(file.name);
            const dataBytes = encoder.encode(file.content);
            const checksum = crc32(dataBytes);
            const localHeader = new Uint8Array(30 + nameBytes.length);
            const localView = new DataView(localHeader.buffer);
            localView.setUint32(0, 0x04034b50, true);
            localView.setUint16(4, 20, true);
            localView.setUint16(6, 0x0800, true);
            localView.setUint16(8, 0, true);
            localView.setUint16(10, 0, true);
            localView.setUint16(12, 0x0021, true);
            localView.setUint32(14, checksum, true);
            localView.setUint32(18, dataBytes.length, true);
            localView.setUint32(22, dataBytes.length, true);
            localView.setUint16(26, nameBytes.length, true);
            localHeader.set(nameBytes, 30);
            localChunks.push(localHeader, dataBytes);

            const centralHeader = new Uint8Array(46 + nameBytes.length);
            const centralView = new DataView(centralHeader.buffer);
            centralView.setUint32(0, 0x02014b50, true);
            centralView.setUint16(4, 20, true);
            centralView.setUint16(6, 20, true);
            centralView.setUint16(8, 0x0800, true);
            centralView.setUint16(10, 0, true);
            centralView.setUint16(12, 0, true);
            centralView.setUint16(14, 0x0021, true);
            centralView.setUint32(16, checksum, true);
            centralView.setUint32(20, dataBytes.length, true);
            centralView.setUint32(24, dataBytes.length, true);
            centralView.setUint16(28, nameBytes.length, true);
            centralView.setUint32(42, localOffset, true);
            centralHeader.set(nameBytes, 46);
            centralChunks.push(centralHeader);

            localOffset += localHeader.length + dataBytes.length;
            centralSize += centralHeader.length;
        }

        const endRecord = new Uint8Array(22);
        const endView = new DataView(endRecord.buffer);
        endView.setUint32(0, 0x06054b50, true);
        endView.setUint16(8, files.length, true);
        endView.setUint16(10, files.length, true);
        endView.setUint32(12, centralSize, true);
        endView.setUint32(16, localOffset, true);

        return new Blob([...localChunks, ...centralChunks, endRecord], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
    }

    function escapeXmlText(text) {
        return String(text ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;"
        })[character]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
    }

    function createWordDocument(text, meta = {}) {
        const title = meta.title ? [escapeXmlText(meta.title), ""] : [];
        const body = title.concat(
            buildText(text)
                .split(/\r\n?|\n/)
                .map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXmlText(line)}</w:t></w:r></w:p>`)
        ).join("");

        const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
            + `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">`
            + `<w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>`
            + `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>`
            + `</w:sectPr></w:body></w:document>`;
        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
            + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
            + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
            + `<Default Extension="xml" ContentType="application/xml"/>`
            + `<Override PartName="/word/document.xml" `
            + `ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>`
            + `</Types>`;
        const relationshipsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
            + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
            + `<Relationship Id="rId1" `
            + `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" `
            + `Target="word/document.xml"/></Relationships>`;

        return createStoredZip([
            { name: "[Content_Types].xml", content: contentTypesXml },
            { name: "_rels/.rels", content: relationshipsXml },
            { name: "word/document.xml", content: documentXml }
        ]);
    }

    /* ------------------------------- text pdf --------------------------------- */

    function pdfEscape(value) {
        return String(value)
            .replace(/[\\()]/g, (character) => `\\${character}`)
            .replace(/[\u0000-\u001f]/g, " ")
            .replace(/[^\u0020-\u00ff]/g, "?");
    }

    function wrapPdfLine(line, maxCharacters) {
        if (line.length <= maxCharacters) {
            return [line];
        }

        const words = line.split(/\s+/);
        const output = [];
        let current = "";

        for (const word of words) {
            if (current.length === 0) {
                current = word;
            } else if (current.length + 1 + word.length <= maxCharacters) {
                current = `${current} ${word}`;
            } else {
                output.push(current);
                current = word;
            }
        }

        if (current.length > 0) {
            output.push(current);
        }

        return output;
    }

    function createTextPdf(text, meta = {}) {
        const encoder = new TextEncoder();
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 56;
        const fontSize = 11;
        const leading = 15;
        const maxCharacters = Math.floor(((pageWidth - margin * 2) / fontSize) * 1.95);
        const linesPerPage = Math.floor((pageHeight - margin * 2) / leading);

        const header = [];
        if (meta.title) {
            header.push(meta.title);
        }

        const metaLine = [];
        if (meta.language) {
            metaLine.push(`Language: ${meta.language}`);
        }

        if (Number.isFinite(Number(meta.confidence))) {
            metaLine.push(`Confidence: ${Math.round(Number(meta.confidence))}%`);
        }

        if (meta.fileName) {
            metaLine.push(`Source: ${meta.fileName}`);
        }

        if (metaLine.length > 0) {
            header.push(metaLine.join("   |   "));
        }

        const contentLines = [];
        if (header.length > 0) {
            contentLines.push("", ...header, "");
        }

        for (const rawLine of buildText(text).split(/\r?\n/)) {
            contentLines.push(...wrapPdfLine(rawLine, maxCharacters));
        }

        const pages = [];
        for (let index = 0; index < Math.max(contentLines.length, 1); index += linesPerPage) {
            pages.push(contentLines.slice(index, index + linesPerPage));
        }

        const objects = [];
        const pageObjectIds = [];

        for (const pageLines of pages) {
            pageObjectIds.push(4 + pageObjectIds.length * 2);
        }

        const contentStreams = pages.map((pageLines) => {
            const commands = ["BT", `/F1 ${fontSize} Tf`, `${leading} TL`, `${margin} ${pageHeight - margin} Td`];

            for (const line of pageLines) {
                commands.push(`(${pdfEscape(line)}) Tj`);
                commands.push("T*");
            }

            commands.push("ET");
            return `${commands.join("\n")}\n`;
        });

        objects.push(encoder.encode("<< /Type /Catalog /Pages 2 0 R >>"));
        objects.push(encoder.encode(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`));
        objects.push(encoder.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));

        pages.forEach((pageLines, index) => {
            const pageId = pageObjectIds[index];
            const contentId = pageId + 1;
            objects.push(encoder.encode(
                `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] `
                + "/Resources << /Font << /F1 3 0 R >> >> "
                + `/Contents ${contentId} 0 R >>`
            ));

            const streamBytes = encoder.encode(contentStreams[index]);
            objects.push(concatBytes([
                encoder.encode(`<< /Length ${streamBytes.length} >>\nstream\n`),
                streamBytes,
                encoder.encode("endstream")
            ]));
        });

        const headerBytes = encoder.encode("%PDF-1.4\n");
        const chunks = [headerBytes];
        const offsets = [0];
        let offset = headerBytes.length;

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

    /* -------------------------------- dispatch -------------------------------- */

    const FORMATS = [
        { id: "txt", label: "Plain text (.txt)", mime: MIME.txt },
        { id: "docx", label: "Word document (.docx)", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        { id: "md", label: "Markdown (.md)", mime: MIME.md },
        { id: "csv", label: "Spreadsheet (.csv)", mime: MIME.csv },
        { id: "html", label: "Web page (.html)", mime: MIME.html },
        { id: "json", label: "Structured data (.json)", mime: MIME.json },
        { id: "pdf", label: "PDF document (.pdf)", mime: "application/pdf" }
    ];

    function build(format, payload = {}) {
        const text = payload.text ?? "";
        const meta = payload.meta ?? {};

        switch (format) {
            case "docx":
                return createWordDocument(text, meta);
            case "pdf":
                return createTextPdf(text, meta);
            case "md":
                return new Blob([buildMarkdown(text, meta)], { type: MIME.md });
            case "csv":
                return new Blob([buildCsv(text)], { type: MIME.csv });
            case "html":
                return new Blob([buildHtml(text, meta)], { type: MIME.html });
            case "json":
                return new Blob([buildJson(text, meta)], { type: MIME.json });
            case "txt":
            default:
                return new Blob([buildText(text)], { type: MIME.txt });
        }
    }

    function exportAs(format, payload = {}) {
        const baseName = safeFileName(payload.fileName || payload.meta?.fileName || payload.meta?.title || "extracted-text");
        const blob = build(format, payload);
        downloadBlob(`${baseName}-text.${format}`, blob);
        return blob;
    }

    return {
        FORMATS,
        build,
        exportAs,
        downloadBlob,
        downloadString,
        buildText,
        buildMarkdown,
        buildCsv,
        buildHtml,
        buildJson,
        createWordDocument,
        createTextPdf,
        safeFileName
    };
})();

if (typeof window !== "undefined") {
    window.Exporters = Exporters;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = Exporters;
}
