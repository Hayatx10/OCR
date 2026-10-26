# Textify AI — Complete Project Question Bank (with Answers)

> Every question an examiner, interviewer, project guide, or viva panel is likely to ask about this OCR project, grouped by topic, with model answers grounded in the actual code.

---

## 1. Project Overview

**Q1. What is this project?**
Textify AI is a browser-based OCR (Optical Character Recognition) studio. A user uploads an image of text — a scan, screenshot, phone photo, or note — and the app converts it into editable, searchable, exportable text. It is wrapped in a Node.js/Express server that provides accounts, sessions, and a saved-document library backed by MongoDB (with a local-JSON development fallback).

**Q2. What problem does it solve?**
It removes the manual work of retyping text from images. It also handles the real-world problems that make OCR fail — shadows, uneven lighting, noise, tilt, multiple languages, batches of files, and post-processing of messy output — and lets the result leave the app in 7 different formats.

**Q3. Who are the target users?**
Students digitising notes and textbook pages, office workers converting scanned documents, researchers extracting text from PDFs/screenshots, shop owners scanning product barcodes, and anyone who needs to copy text that exists only as pixels.

**Q4. What are the core features?**
1. Image-to-text OCR with preprocessing tools (rotate, crop, grayscale, shadow cleanup, perspective correction).
2. Multi-language recognition (56 language models, up to 3 combined per scan).
3. QR code and 1-D barcode reading.
4. A batch OCR queue for many images at once.
5. Seven export formats (TXT, DOCX, MD, CSV, HTML, JSON, PDF).
6. Smart post-processing (8 cleanup passes + proofreading).
7. Per-word confidence heat map (click a word to locate it in the image).
8. Saved document library per user account.
9. Table detection and CSV export.
10. Single-letter classification mode.

**Q5. What are the "5 differentiating features"?**
The five features chosen to separate this app from a plain OCR demo are: **Smart OCR Post-Processor, Multi-language OCR, QR & Barcode Reader, Batch OCR Queue, and Extended Export Formats.**

**Q6. What is the tech stack?**
- **Frontend:** HTML5, CSS3, vanilla JavaScript (no framework), Canvas API.
- **OCR:** Tesseract.js 5.1.1 (WASM build loaded from jsDelivr).
- **Barcode:** ZXing (`@zxing/library` 0.23.0, UMD build).
- **Perspective correction:** OpenCV.js (`@techstark/opencv-js` 4.10).
- **Backend:** Node.js ≥ 20, Express 5.
- **Database:** MongoDB (Atlas free tier) via the official `mongodb` driver 7.x.
- **Sessions:** `express-session` + `connect-mongo`.
- **Security:** `helmet`, `express-rate-limit`, `bcryptjs`.
- **Config:** `dotenv`.

**Q7. Describe the architecture.**
It is a **client-heavy, two-tier architecture**:
- The browser does all compute-intensive work: image decoding, preprocessing with Canvas, OCR with Tesseract.js (WebAssembly + Web Worker), barcode decoding with ZXing, post-processing, and file generation.
- The Express server is deliberately thin: it serves the static app, handles register/login/logout, maintains sessions, and exposes a REST API for the user's saved documents.
- MongoDB stores two collections (`users`, `documents`); session documents are stored by `connect-mongo`.

**Q8. Why is OCR done in the browser instead of on the server?**
- **Privacy:** the image never leaves the user's machine, which matters for ID cards, invoices, and medical documents.
- **Cost:** no server GPU/CPU bill and no per-page API fee.
- **Scalability:** each client brings its own CPU, so 100 users do not queue behind one server.
- **Offline-ish behaviour:** after the first model download the models are cached by the browser.

**Q9. What input formats are accepted?**
PNG, JPG/JPEG, and WEBP images. The interface advertises these three; any format the browser can decode through `createImageBitmap` will work.

**Q10. What output does the user get?**
Editable text in the result panel with live word/character/line counts, an average confidence score, a detected table (if any), a summary, cleanup suggestions, decoded QR/barcode values, and downloads in 7 formats.

---

## 2. OCR Fundamentals & Tesseract.js

**Q11. What is OCR?**
Optical Character Recognition is the process of converting an image of text into machine-encoded text. It involves image preprocessing, text detection (finding lines and words), character segmentation/recognition, and linguistic post-correction.

**Q12. How does Tesseract work internally?**
Tesseract 4/5 uses a **LSTM (Long Short-Term Memory) neural network** recogniser. The pipeline is: adaptive thresholding → connected-component analysis → line finding → word/character recognition by the LSTM → dictionary/language-model scoring → layout and reading-order analysis.

**Q13. Why Tesseract.js instead of a cloud OCR API?**
It is free, open-source, runs offline after the model download, keeps images private, and requires no API keys or billing. Cloud APIs (Google Vision, Azure Read) are more accurate on hard images, but they cost money and upload user data.

**Q14. Which Tesseract.js version is used, and why pin it?**
`tesseract.js@5.1.1`. Pinning avoids silent breaking changes in the CDN build and guarantees the tested worker API (`createWorker(language, oem, options)`).

**Q15. What is a Tesseract worker and why reuse it?**
A worker is a Web Worker that loads the WASM engine and a language model. Creating one is the slowest step (downloading and initialising tens of MB). The app caches `ocrWorker` together with `ocrWorkerLanguage` and only recreates it when the selected language changes, so repeated extractions and batch items are much faster.

**Q16. What happens when the user changes language?**
`getOcrWorker()` compares the requested language string with `ocrWorkerLanguage`. If it differs, the old worker is terminated (`.terminate()`) and a new one is created with the new language set. This prevents memory leaks from keeping several models alive.

**Q17. What are OEM and PSM?**
- **OEM (OCR Engine Mode):** which engine to use. `1` = LSTM only (the modern, most accurate engine). Legacy `0` combines the old engine; `2` is legacy only; `3` is "default, based on what is available".
- **PSM (Page Segmentation Mode):** how the page is interpreted. `3` = fully automatic page segmentation (no orientation/script detection), which suits documents, screenshots, and mixed layouts. `10` = single character, used by the letter classifier.

**Q18. Which parameters are set, and why?**
```js
tessedit_pageseg_mode: "3",       // automatic layout analysis
preserve_interword_spaces: "1",   // keeps column spacing in tables/forms
user_defined_dpi: "300"           // stops Tesseract guessing DPI on upscaled rasters
```
`preserve_interword_spaces` is important for invoices and tables, where wide gaps carry meaning. `user_defined_dpi` improves accuracy when the image has been resized and has no DPI metadata.

**Q19. What is `tessdata_best`?**
It is the most accurate set of Tesseract trained models (float LSTM, no integer quantisation), at the cost of larger downloads and slower inference than `tessdata_fast`. The app uses it for Hindi, where the extra accuracy matters, and defaults otherwise.

**Q20. Why is Hindi treated specially?**
`ocrModelOptions(language)` returns `HINDI_BEST_MODEL_OPTIONS` (`langPath` pointing to `tessdata_best`, `gzip: false`, `cachePath: "tessdata_best"`) whenever `hin` is in the language string. Hindi's default model is noticeably weaker, so the best model is worth the extra download.

**Q21. How is a confidence score produced?**
Tesseract returns a per-word confidence (0–100) and an overall page confidence. The app stores `data.confidence` in `lastConfidence`, shows it in the confidence bar, and uses a **word-level heat map** so the user can see which words are unreliable.

**Q22. Why is there a retry when confidence is below 80?**
`runOcr()` first recognises the lightly prepared image. If confidence is under 80 or the text is empty, it runs a second pass on `prepareEnhancedOcrImage()` — a locally normalised, contrast-corrected version — and keeps whichever result scores higher. Different images respond differently to preprocessing, so trying both is more robust than guessing one pipeline.

**Q23. How are two OCR results compared?**
```js
function ocrResultScore(data) {
  const text = data.text?.trim() || "";
  if (!text) return -1;
  const confidence = Number(data.confidence);
  return (Number.isFinite(confidence) ? confidence : 0) + Math.min(text.length, 1000) / 1000;
}
```
The score is confidence plus a tiny length bonus (max 0.001), so between two equally confident results the one that actually found more text wins. Empty text always scores −1.

**Q24. How is the image upscaled before recognition?**
`prepareOcrImage()` scales small images up so characters are not just a few pixels tall:
```js
const scale = Math.min(2.5, 3200 / largestSide, Math.max(1, 2000 / largestSide));
```
This caps enlargement at 2.5×, never exceeds 3200 px, and targets at least 2000 px on the long side. High-quality smoothing is enabled and the result is re-encoded as PNG to avoid JPEG artefacts before OCR.

**Q25. What is the one-shot fallback mode?**
If the cached worker cannot be created (CDN blocked, WASM unsupported), `tesseract.recognize(image, language, options)` is called directly. It is slower but keeps the app usable.

**Q26. How does multi-language OCR work?**
Tesseract accepts a `+`-joined language string, e.g. `eng+hin`. The UI allows up to three languages; `ocrLanguage()` joins them. This is essential for mixed documents such as Hindi text with English product names.

**Q27. Why limit to three languages?**
Each language adds a model download and slows recognition roughly linearly, while accuracy can drop because the language model has more ambiguous candidates. Three covers realistic bilingual documents.

**Q28. How does click-a-word navigation work?**
Tesseract returns `words` with bounding boxes. `renderOcrWordMap()` draws them over the image; clicking a word scrolls/highlights the corresponding box using `lastOcrWords` and `lastOcrImageDimensions` (the width/height actually sent to OCR, so boxes line up after upscaling).

**Q29. What is the single-letter classifier?**
A small mode that reconfigures the worker to PSM 10 (single character) with an alphabetic whitelist, recognises one image, strips non-letters, and shows the top result. It is useful for reading a single unknown initial or stamped letter.

---

## 3. Image Preprocessing

**Q30. Why preprocess before OCR?**
Tesseract performs best on **high-contrast, evenly lit, low-noise, upright, dark-on-light** text. Real photos violate all of these: shadows, gradients, blur, JPEG noise, and tilt. Preprocessing directly raises the character-recognition rate.

**Q31. How is grayscale computed and why those weights?**
```js
gray = 0.299·R + 0.587·G + 0.114·B
```
These are ITU-R BT.601 luma weights. They match human brightness perception (green contributes most, blue least), so contrast between text and paper is preserved better than a simple average.

**Q32. Explain the shadow-removal step.**
For every pixel, the app estimates the local background brightness as the mean of a square window around it (computed in O(1) per pixel using an integral image). It then divides the pixel by that background:
```js
normalized = min(255, round(gray * 225 / max(80, background)))
```
Bright paper regions become white, dark text stays dark, and slow illumination gradients (shadows, lamp falloff) are divided out. The `max(80, …)` guard prevents division blow-ups in genuinely dark areas, and `225` maps typical paper to near-white instead of pure 255 so faint strokes survive.

**Q33. What is an integral image and why use it?**
An integral (summed-area) image stores, at each point, the sum of all pixels above and to the left. Any rectangle sum then needs only four lookups, so a local mean of radius *r* costs O(1) instead of O(r²). This makes full-image background estimation fast enough for the browser.

**Q34. Why is the window radius adaptive?**
```js
radius = max(8, round(min(width, height) / 45))
```
The radius must be large enough to average over both text and paper (so text does not darken its own background estimate) but small enough to follow lighting changes. Scaling it with the shorter side keeps behaviour consistent across image sizes.

**Q35. Why a median filter, not a mean/box blur?**
A median removes salt-and-pepper noise and isolated specks while preserving edges, whereas a mean blur smears character strokes and thin joins. OCR depends on stroke edges, so median is the right choice.

**Q36. How is the median of five computed efficiently?**
`medianOfFive()` uses a fixed **9-comparator sorting network** on five local values (centre, left, right, above, below). It returns the middle value with no array allocation, which matters when it runs once per pixel on a multi-megapixel image.

**Q37. Why threshold at 175 instead of 128?**
The normalised image has paper pushed toward 255 and text toward 0, but anti-aliased edges land in between. A threshold of 175 keeps moderately dark edge pixels as text, recovering thin or faded strokes; 128 would drop them and break letters. It is deliberately a fixed, conservative value rather than an aggressive adaptive threshold that can erase faint text.

**Q38. Is the image binarised before Tesseract?**
Yes, `cleanImage({forOcr:true})` writes a 1-bit-looking black/white image back to the canvas and the app continues with that file. Tesseract also thresholds internally, but a clean binary input reduces noise-driven segmentation errors.

**Q39. Why is the processing canvas capped at 1800 px?**
Beyond roughly 1800 px on the long side the accuracy gain is negligible while preprocessing cost grows quadratically, memory use rises, and browser canvas limits can be hit. 1800 is the accuracy/speed sweet spot for this pipeline.

**Q40. Does preprocessing always run?**
Only when the **Auto-enhance** checkbox is checked (it is checked by default). Users can switch it off to OCR the original image, which is sometimes better for clean screenshots.

**Q41. What does the "Clean up shadows and noise" button do?**
It calls the same `cleanImage()` without `forOcr`, applies the identical shadow normalisation + median + threshold pipeline, and writes the result back into the workspace so the user can inspect it before extracting.

**Q42. How does rotation work?**
`rotateSelectedImage(direction)` creates a canvas with swapped width/height, translates to the correct corner, rotates by ±90°, redraws the bitmap, and replaces the working file via `canvasToImageFile()`.

**Q43. How does cropping work?**
Opening the crop editor draws the image on a preview canvas. Pointer events record a drag rectangle (`cropSelection`). On apply, the selection is scaled back to full image coordinates and drawn 1:1 into a new canvas, so no quality is lost to the preview scale.

**Q44. How does perspective correction work?**
`correctPerspective()` loads OpenCV.js, converts the image to grayscale, blurs it, runs Canny edge detection, finds contours, and looks for the largest 4-corner polygon (the document outline). It orders the corners top-left, top-right, bottom-right, bottom-left and applies `cv.warpPerspective` to a rectangle. This turns a photo taken at an angle into a flat scan. All OpenCV objects are explicitly freed in `finally` to avoid WASM memory leaks.

**Q45. Why not use OpenCV for the basic cleanup too?**
OpenCV.js is a large download. The shadow/median/threshold pipeline only needs simple per-pixel arithmetic, which plain JavaScript with typed arrays handles quickly and without a 8–10 MB dependency. OpenCV is loaded lazily, only when perspective correction is actually requested.

**Q46. What are `isProcessing` and `isScanningImage` for?**
They are re-entrancy guards. Every heavy operation checks and sets them, and `setScannerBusy()` disables the toolbar buttons, so a user cannot start two OCR runs or edit the image while a scan is in progress.

**Q47. Why is the intermediate file a JPEG at 0.94 quality (or PNG for OCR)?**
JPEG at 0.94 keeps edited photos small with visually lossless quality for display and re-editing. For OCR preparation, PNG is used because JPEG ringing artefacts around text edges harm recognition.

---

## 4. Post-Processing (Smart OCR Post-Processor)

**Q48. Why post-process OCR output?**
Even good OCR confuses look-alike characters (`0/O`, `1/l/I`, `rn/m`), breaks words at line ends, leaves table borders, and normalises punctuation inconsistently. Post-processing repairs the text without re-running OCR.

**Q49. What are the eight passes?**
1. **Dehyphenate** — join words broken across lines.
2. **Fix misread characters** — repair `rn/m`, `0/O`, `1/l` inside words.
3. **Tidy punctuation** — remove stray spaces, add missing sentence spaces.
4. **Remove table borders** — delete rows of `|`, `_`, `-`, `=`.
5. **Remove duplicate lines** — keep the first occurrence of repeated lines.
6. **Normalize whitespace** — collapse repeated spaces and blank lines.
7. **Expand special characters** — ligatures (ﬁ, ﬂ) and curly quotes to ASCII.
8. **Smart punctuation** — convert straight quotes to typographic quotes.

**Q50. Why is the misread fix dictionary-gated?**
A blind replacement of `0`→`O` would destroy numbers (`2024`→`2O24`). The app only applies a substitution when the resulting word exists in its dictionary and the original does not. This makes risky fixes safe: real words are never "corrected" into nonsense.

**Q51. Give an example.**
Input: `The h0me page and 1nvoice t0tal` → output `The home page and invoice total`, reported as 3 changes. `h0me`→`home` and `1nvoice`→`invoice` are accepted because the results are dictionary words; `t0tal`→`total` likewise.

**Q52. How are changes counted?**
`applyRegex()` wraps `String.replace` in a callback that increments a counter; `chain()` sums counts across patterns; each pass returns `{ text, count }`. The UI shows exactly how many fixes each pass made instead of guessing from a text diff.

**Q53. Are all passes applied automatically?**
No. They are **opt-in**. The user opens Smart cleanup and ticks the passes they want; only the selected IDs are run by `clean(text, enabledIds)`. This avoids surprising edits to code, poetry, or intentionally odd text.

**Q54. What are the risks of the punctuation passes?**
Smart quotes and ligature expansion are cosmetic and can affect code snippets or CSV data. That is why they are opt-in and separately labelled.

**Q55. What does the proofreader do?**
"Check writing" scans the recognized text for likely misspellings and presents them as individual suggestions; "Apply all suggestions" applies the accepted ones. It is a second, suggestion-based layer on top of the automatic passes.

**Q56. Is post-processing idempotent?**
Mostly. Running whitespace normalisation twice produces the same result; misread fixes stop finding new dictionary-valid changes. Smart punctuation is effectively idempotent because curly quotes are not matched again. Duplicate-line removal is idempotent by definition.

**Q57. Could post-processing reduce accuracy?**
Yes, if a pass is misused. The mitigation is the dictionary gate, opt-in selection, and per-pass change counts so the user can see and undo anything unexpected.

---

## 5. Multi-language Support

**Q58. How many languages are supported?**
Fifty-six Tesseract language codes are listed, covering English, Hindi, Arabic, Bengali, Chinese (Simplified/Traditional), Japanese, Korean, Russian, German, French, Spanish, Portuguese, and many more.

**Q59. How does the picker work?**
`LANGUAGES` is an array of `{code, name}`. The menu supports search filtering, multi-select (max 3), a "Clear all" action, and a label that summarises the current selection.

**Q60. How is the language sent to Tesseract?**
`ocrLanguage()` joins selected codes with `+` (e.g. `eng+hin`) and passes that string to `createWorker()` / `recognize()`.

**Q61. What are the trade-offs of combining languages?**
Pros: mixed documents are read correctly. Cons: larger downloads, slower recognition, and a higher chance of ambiguous characters because multiple dictionaries compete. Hence the 3-language cap.

**Q62. What happens for right-to-left languages like Arabic or Hebrew?**
Tesseract returns logical-order text; the result panel renders it correctly because the characters carry RTL directionality. Users should select the RTL language(s) so the correct model is used.

**Q63. What if the wrong language is chosen?**
Accuracy drops sharply — for example, English text read with a Cyrillic model produces plausible-looking gibberish. The UI keeps the choice visible so mistakes are easy to spot and fix.

---

## 6. QR & Barcode Reader

**Q64. Which library handles QR/barcodes?**
ZXing (`@zxing/library` 0.23.0), loaded on demand as a UMD script.

**Q65. Why ZXing?**
It is mature, pure JavaScript, supports QR plus common 1-D symbologies (EAN-13, Code 128, Code 39, UPC), and needs no server round-trip.

**Q66. Why is it lazy-loaded?**
Most users only do OCR. Loading ZXing only when "Read QR / barcode" is clicked keeps first-load size and startup time down.

**Q67. Which formats are decoded?**
QR codes and 1-D barcodes such as EAN-13/EAN-8, UPC-A, Code 128, Code 39, ITF, and Codabar, depending on the hints passed to ZXing.

**Q68. What does the app show for a result?**
A "Codes found" panel listing the decoded value and format, with a close action. Multiple codes in one image are supported.

**Q69. What happens if no code is found?**
The panel reports that nothing was detected and suggests a sharper, closer, better-lit image. A failed decode is normal for blurry or partially cropped codes.

**Q70. Can it decode a code inside a document photo?**
Yes, as long as the code is reasonably large and sharp. Preprocessing (crop/rotate) improves the odds.

---

## 7. Batch OCR Queue

**Q71. What is the batch queue?**
A list of images processed sequentially with one shared OCR worker, producing one text result per image.

**Q72. Why sequential rather than parallel?**
Each Tesseract worker holds a full WASM engine and language model in memory. Running many in parallel on a laptop would thrash CPU and memory and usually be slower overall. One worker reuses the loaded model, so per-file cost drops after the first item.

**Q73. How is progress shown?**
Each queue item has its own status (waiting, processing, done, failed) plus a progress percentage driven by Tesseract's logger. `activeQueueId` tracks the current item.

**Q74. What happens if one file fails?**
That item is marked failed with an error message and the queue continues with the next file, so one bad image does not abort a 50-file batch.

**Q75. How does the batch use languages?**
The same selected language set is used for the whole run, which is correct for a batch of documents in the same language and avoids reloading the model per file.

**Q76. Can batch results be exported together?**
Yes — "Download all (.md)" concatenates the queue results into a single Markdown file with per-file headings.

**Q77. Are batch results saved to the library?**
Yes, when "Save to library" is enabled, each successful item is stored with `source: "batch"`.

**Q78. Can the user stop or clear a batch?**
"Clear queue" empties the list. The start button is disabled while a run is active, and the shared `isProcessing` guard prevents overlapping runs.

---

## 8. Export Formats

**Q79. Which formats are supported?**
TXT, DOCX, Markdown, CSV, HTML, JSON, and PDF — seven formats.

**Q80. Why so many formats?**
Different destinations need different structures: TXT for notes, DOCX for reports, MD for developers, CSV for spreadsheets/tables, HTML for the web, JSON for pipelines, and PDF for sharing a fixed layout.

**Q81. How is the DOCX built without a library?**
`exporters.js` writes the Open XML package itself: `[Content_Types].xml`, `_rels/.rels`, and `word/document.xml`, zipped with a **stored (uncompressed) ZIP writer** including CRC-32 checksums, local headers, central directory, and end-of-central-directory record. The text is escaped (`&`, `<`, `>`, `"`, `'`) and control characters stripped so Word opens it cleanly.

**Q82. Is the PDF text selectable or an image?**
The exported PDF contains **real, selectable text** drawn with the base-14 Helvetica font. `createTextPdf()` builds objects (catalog, pages, font, content stream) and a correct xref table, so PDF readers can search and copy the text.

**Q83. Is there also an image→PDF feature?**
Yes. A separate "PDF" button embeds the processed image into a PDF page. That is for sharing the scan itself; the export menu's PDF is the text version.

**Q84. How are CSV fields escaped?**
Values containing commas, quotes, or newlines are wrapped in double quotes and internal quotes are doubled (`""`), following RFC 4180. Rows are separated with `\r\n` for Excel compatibility.

**Q85. What does the JSON export contain?**
A structured object with the text plus metadata: title, language, confidence, character/word counts, and timestamps where available. This makes it easy to feed into another application.

**Q86. How is the HTML export made safe?**
All text is HTML-escaped before being wrapped in a minimal document, preventing the recognized text from injecting markup or scripts.

**Q87. How does the browser download files?**
`exportAs()` builds a `Blob` with the correct MIME type, creates an object URL, clicks a temporary anchor with a `download` filename, then revokes the URL. No server is involved.

**Q88. Why generate files client-side?**
It is instant, avoids uploading the user's text, and keeps the server stateless. The trade-off is that very large documents are limited by browser memory.

---

## 9. Database & Data Model

**Q89. Why MongoDB rather than a relational database?**
The natural unit is a complete scan document — title, extracted text of up to 200,000 characters, language, confidence, counts, thumbnail, timestamps. It is read and written as a whole and its shape can evolve. A document store avoids joins and schema migrations for this access pattern. The original PostgreSQL layer was fully replaced at the user's request.

**Q90. Which MongoDB service is used?**
MongoDB Atlas, M0 free tier. It provides a managed cluster with a TLS `mongodb+srv://` connection string, no local installation, and automatic backups on paid tiers.

**Q91. What are the collections and their key fields?**
- `users`: `_id`, `email` (unique), `password_hash`, `created_at`, `last_seen_at`.
- `documents`: `_id`, `user_id` (ObjectId), `title`, `file_name`, `text`, `language`, `confidence`, `char_count`, `word_count`, `thumbnail`, `source` (`single`/`batch`), `created_at`, `updated_at`.
- `sessions` (created by `connect-mongo`): session id and serialised session data.

**Q92. Which indexes are created and why?**
```js
users:     { email: 1 } unique        // fast login, prevents duplicate accounts
users:     { created_at: -1 }         // admin/listing by recency
documents: { user_id: 1, created_at: -1 }  // a user's library, newest first
documents: { user_id: 1, title: 1 }        // title search scoping
```
The compound indexes match the actual query shape (filter by owner, sort by date), avoiding in-memory sorts.

**Q93. How are users isolated from each other's documents?**
Every document query includes `user_id: <session user's ObjectId>`. `getDocument`, `updateDocument`, and `deleteDocument` filter on both `_id` and `user_id`, so guessing another document's ID returns "not found" rather than someone else's text.

**Q94. How is input sanitised before storage?**
`sanitizeDocumentInput()` enforces types and hard caps: title 200 chars, file name 260, text 200,000, language 60, thumbnail 400,000, numeric fields coerced or null, and `source` restricted to `single`/`batch`. This prevents oversized or malformed documents from bloating the database.

**Q95. How does listing/pagination work?**
`listDocuments(userId, {limit, skip, query, language})`: limit is clamped to 1–100, skip to ≥0. It returns `{ items, total }` from `find().sort().skip().limit()` plus `countDocuments()` in parallel. Search is a case-insensitive regex over title, text, and file name, with user input escaped by `escapeRegExp()` to prevent regex injection.

**Q96. What is the local-JSON fallback?**
If `MONGODB_URI` is missing (or unreachable in development), `db.js` switches to `storageMode = "local"` and stores `data/users.json` and `data/documents.json`. Writes are serialised through `updateLocalArray()` (read → mutate → write) so concurrent requests do not corrupt the file.

**Q97. Why have a fallback at all?**
It lets a reviewer clone the repo and run it with `npm run dev` without creating an Atlas account. It is explicitly development-only; the README warns that production must have MongoDB.

**Q98. What happens if MongoDB is down in production?**
`connectDatabase()` rethrows the connection error when `NODE_ENV === "production"`, so the process fails fast instead of silently writing to local files in a production environment.

**Q99. How are IDs handled?**
MongoDB uses `ObjectId`; the API returns the hex string as `id`. `toObjectId()` validates and converts incoming strings, returning `null` for malformed IDs so the route can answer 404 instead of throwing.

**Q100. What happens when all documents are deleted?**
`deleteAllDocuments(userId)` deletes only that user's documents (`deleteMany({user_id})` or a filtered local write), never the whole collection.

**Q101. How is the database connection reused?**
A single `MongoClient` is created in `connectDatabase()` and shared by both collections. The `appName: "textify-ocr"` tag makes the app identifiable in Atlas metrics, and `serverSelectionTimeoutMS` keeps startup from hanging.

---

## 10. Authentication, Sessions & Accounts

**Q102. How does authentication work?**
Email + password. On register, the server validates the input, hashes the password with **bcrypt, cost factor 12**, stores the user, and creates a session. On login, it fetches the user by normalised email and uses `bcrypt.compare()` against the stored hash.

**Q103. Why bcrypt and not SHA-256?**
bcrypt is deliberately slow and salted, which makes brute-force and rainbow-table attacks expensive. Cost 12 is a good 2026 baseline (roughly a few hundred milliseconds per hash). A fast hash like SHA-256 is unsuitable for passwords.

**Q104. Why is the password capped at 72 bytes?**
bcrypt only considers the first 72 bytes of input; silently ignoring the rest would make passwords weaker than users think. `validateCredentials()` rejects longer passwords explicitly, and also enforces 8–128 characters.

**Q105. What are the validation rules?**
Email must match a basic RFC-style pattern and be ≤254 characters; it is trimmed and lower-cased. Password must be 8–128 characters and ≤72 UTF-8 bytes.

**Q106. How are sessions stored?**
`express-session` with a `connect-mongo` store when MongoDB is available; otherwise an in-memory store. The session cookie is named `textify.sid`, is `httpOnly`, `sameSite: "lax"`, lasts 7 days, and is `secure: "auto"` in production (so it is only sent over HTTPS).

**Q107. Why does the app warn that restarting the server signs everyone out?**
Because in local fallback mode the session store is in memory. In MongoDB mode, sessions persist in the `sessions` collection and survive restarts.

**Q108. What is `LazySessionStore` for?**
The session middleware is configured at startup, but the Mongo store is only available after the async database connection resolves. `LazySessionStore` defers each store call until the real store exists, avoiding a race between server boot and DB connect.

**Q109. How does the server protect the app itself?**
`requireAuth` guards the HTML app and the client scripts (`script.js`, `text-tools.js`, `exporters.js`) — an unauthenticated visitor is redirected to `/login`. `requireApiAuth` guards the document API and returns 401 JSON instead of a redirect.

**Q110. What does `/api/auth/me` do?**
Returns the current session's public user (`id`, `email`) so the UI can show who is signed in; it is used to detect an expired session and redirect to login.

**Q111. How does logout work?**
`POST /api/auth/logout` destroys the session, clears the cookie, and returns success. The client then navigates to `/login`.

**Q112. Why is `Cache-Control: no-store` set on auth routes?**
It prevents browsers and proxies from caching authentication responses, which could otherwise leak account state or stale error messages.

---

## 11. Security

**Q113. What does Helmet configure?**
A strict Content-Security-Policy plus standard hardening headers. `defaultSrc 'self'`, scripts only from self and `cdn.jsdelivr.net` (plus `wasm-unsafe-eval` for Tesseract's WebAssembly), images from self/blob/data, workers from self/blob/CDN, `objectSrc 'none'`, `frameAncestors 'none'`, and `upgradeInsecureRequests` in production. `x-powered-by` is disabled so the stack is not advertised.

**Q114. Why is `wasm-unsafe-eval` needed?**
Tesseract.js compiles WebAssembly, which requires that CSP allowance. Without it the OCR engine cannot start. It is the narrowest directive that enables WASM (unlike `unsafe-eval`).

**Q115. What rate limiting is in place?**
- Auth: 20 requests per 15 minutes per IP — slows credential stuffing and brute force.
- Documents: 120 requests per minute per IP — stops accidental or malicious hammering of the API.

**Q116. How does the app prevent SQL/NoSQL injection?**
There is no SQL. Mongo queries are built from typed values, and user search text is passed through `escapeRegExp()` before becoming a `RegExp`, so characters like `.*` or `(` cannot alter the query.

**Q117. How is XSS prevented?**
The result panel uses `textarea.value` and `textContent`, not `innerHTML`, for recognized text. Exports escape XML/HTML entities. The CSP blocks inline and third-party scripts.

**Q118. Is CSRF a concern?**
Cookies are `sameSite: "lax"`, which blocks cross-site POSTs from forms and fetch in modern browsers. State-changing routes are POST/PATCH/DELETE and require a valid session. For higher assurance, a CSRF token could be added.

**Q119. Are uploads stored on the server?**
No. Images never leave the browser; only the extracted text and a small thumbnail are saved, and only if the user opts to save to the library. This greatly reduces the attack surface and privacy risk.

**Q120. What happens to `.env`?**
It is git-ignored and must never be committed. It holds `MONGODB_URI`, `MONGODB_DB`, and `SESSION_SECRET`. `.env.example` documents the keys without secrets.

**Q121. Why must `SESSION_SECRET` be long and random?**
It signs the session cookie. A short or guessable secret lets an attacker forge sessions. The server warns and falls back to a known development secret when it is missing — acceptable locally, never in production. Generate one with `crypto.randomBytes(48).toString("base64url")`.

**Q122. What else should be done before production deployment?**
Set `NODE_ENV=production`, use HTTPS (or `TRUST_PROXY=1` behind a trusted proxy), set a strong `SESSION_SECRET`, restrict Atlas network access to the server's IP, enable Atlas backups, add monitoring, and consider a CSRF token and per-user (not just per-IP) quotas.

---

## 12. Performance

**Q123. What are the main performance costs?**
First-load downloads (Tesseract WASM ~ a few MB plus language data), image preprocessing (per-pixel loops), OCR inference, and OpenCV/ZXing if used.

**Q124. How is first-load cost reduced?**
Tesseract, OpenCV, and ZXing are all **lazy-loaded on first use**, not on page load. The app shell stays small and interactive immediately.

**Q125. How is repeated OCR made fast?**
Worker reuse: the model stays loaded across extractions and across all items in a batch. Only a language change forces a reload.

**Q126. Why is preprocessing O(n) per pixel?**
The integral image makes local means O(1), the median network is a fixed number of comparisons, and all buffers are typed arrays (`Uint8Array`, `Float64Array`, `Uint32Array`), which are cache-friendly and avoid per-pixel object allocation.

**Q127. Why cap image dimensions?**
Cost grows with pixel count, and OCR accuracy plateaus. The 1800 px cleanup cap and 3200 px OCR cap bound memory and time per image.

**Q128. How is the UI kept responsive during OCR?**
Tesseract runs in a Web Worker, so the main thread continues to paint. Progress messages update the status text and per-item queue progress.

**Q129. What is the database read cost of the library?**
One indexed compound query (`user_id`, `created_at`) with `skip`/`limit`, plus a count. Typical libraries return in a single round trip with no in-memory sort.

**Q130. How could throughput be improved further?**
Serve the language models from the app's own CDN/origin, preload the worker after login, compress stored thumbnails more aggressively, paginate the library UI, and optionally use a pool of two workers on multi-core machines.

---

## 13. Accuracy, Limitations & Troubleshooting

**Q131. What factors most affect accuracy?**
Resolution (character height in pixels), focus/blur, contrast, lighting evenness, skew, font/script, language-model choice, and compression artefacts. The app addresses each one with upscaling, cleanup, thresholding, perspective correction, and language selection.

**Q132. What is a realistic accuracy expectation?**
On clean screenshots and flatbed scans of printed Latin text: often 95–99%. On phone photos with good light: roughly 85–95%. On handwriting, decorative fonts, receipts, very small text, or low light: much lower, sometimes unusable. No OCR engine guarantees 100%.

**Q133. Why does OCR sometimes return nothing?**
Possible causes: the image is too small or blurred, the text is too faint, the wrong language is selected, the page is upside down or heavily skewed, or cleanup over-thresholded thin text. Fixes: crop closer, rotate, disable auto-enhance, try another language, or use perspective correction.

**Q134. Why did changing preprocessing make results worse?**
Aggressive global contrast stretching, guessed deskew angles, and adaptive thresholds can erase faint strokes or rotate the image wrongly. The project therefore uses a conservative, proven pipeline: local background division, median denoise, and a fixed 175 threshold. This is a real engineering lesson: measure accuracy before and after any preprocessing change.

**Q135. Does the app support handwriting?**
Only marginally. Tesseract's LSTM models are trained mainly on printed text; cursive handwriting is a known limitation and would need a dedicated model (or a cloud API).

**Q136. Does it handle tables?**
Partially. `preserve_interword_spaces` keeps column gaps, there is a "Detect table" action that reconstructs rows/columns, and the table can be exported as CSV. Complex merged-cell layouts can still be misread.

**Q137. Does it handle multi-column pages?**
PSM 3 performs automatic layout analysis and generally follows columns, but unusual layouts (sidebars, captions, rotated labels) can interleave text. Cropping to one column is the reliable workaround.

**Q138. What about rotated or upside-down images?**
There is no automatic 180°/90° orientation detection. Users rotate manually with the left/right buttons. Tesseract's own orientation detection is not enabled.

**Q139. Why is the confidence score sometimes low even when the text looks right?**
Confidence is an average over words; a few low-confidence words (numbers, rare names, punctuation) pull it down. Use the word heat map rather than the number alone.

**Q140. How should a user get the best result?**
1) Use a sharp, well-lit image. 2) Crop to the text area. 3) Keep auto-enhance on for photos, off for clean screenshots. 4) Correct perspective for angled photos. 5) Select the correct language(s). 6) Check the confidence heat map. 7) Apply only the cleanup passes you need. 8) Proofread before exporting.

---

## 14. Testing, Tooling & Deployment

**Q141. How is the code checked?**
`npm run check` runs `node --check` on every JavaScript file (`server.js`, `db.js`, `auth.js`, `script.js`, `text-tools.js`, `exporters.js`) to catch syntax errors. Functional checks were done by running the server, calling `/api/health`, registering/logging in over HTTP, and unit-testing the post-processor and PDF generator.

**Q142. What does `/api/health` return?**
```json
{ "status": "ok", "storage": "local" | "mongodb", "sessions": "memory" | "mongodb" }
```
It is a quick way to verify which storage and session backends are active — useful during setup and in monitoring.

**Q143. How is the project run locally?**
`npm install`, then `npm run dev` (Node `--watch`), and open `http://localhost:3010`. Optionally create `.env` from `.env.example` with the Atlas URI and a session secret.

**Q144. How would this be deployed?**
Node 20+ host (Render, Railway, Fly.io, a VPS) or a container. Set environment variables there, allow the host's IP in Atlas, terminate TLS at the platform or proxy (`TRUST_PROXY=1`), and run `npm start`. Because OCR runs client-side, the server needs no GPU.

**Q145. What would you monitor in production?**
Health endpoint availability, Atlas connection errors and latency, 4xx/5xx rates, rate-limit rejections, session store growth, and client-side OCR failure/confidence telemetry (if added).

**Q146. How would you unit-test the post-processor?**
Feed known bad strings and assert the expected output and change counts, e.g. `clean("The h0me page and 1nvoice t0tal", ["misreads"])` must return `"The home page and invoice total"` with 3 changes. Add cases for dehyphenation, ligatures, duplicate lines, and CSV escaping.

**Q147. How would you test the exporters?**
Build each format, assert the MIME type and magic bytes (e.g. PDF starts with `%PDF-1.4`, DOCX/ZIP starts with `PK\x03\x04`), open them in the target application, and verify the text is present and correctly escaped.

**Q148. How would you test OCR accuracy objectively?**
Create a small ground-truth set of images with known text, run OCR, and compute **Character Error Rate (CER)** and **Word Error Rate (WER)**. Compare pipelines (auto-enhance on/off, different languages, enhanced retry) and keep only changes that reduce CER. This is the correct way to validate any preprocessing "optimisation".

---

## 15. Design Decisions & Trade-offs

**Q149. Why vanilla JavaScript instead of React?**
The app is a single workspace with direct Canvas and file APIs. A framework would add build tooling and bundle size without solving a real problem here. Vanilla keeps the app easy to run with `node server.js` and easy to audit.

**Q150. Why keep OCR and post-processing as separate modules?**
Single responsibility: `script.js` orchestrates capture and OCR, `text-tools.js` owns text repair, `exporters.js` owns file generation. Each can be tested and changed independently.

**Q151. Why is the server stateless apart from sessions?**
Images and text processing live in the browser, so the server only needs identity and saved documents. That makes horizontal scaling trivial — any instance can serve any request once sessions are in MongoDB.

**Q152. Why store a thumbnail?**
It makes the library visually browsable without storing the original image, which keeps documents small and avoids retaining potentially sensitive photos.

**Q153. Why cap saved text at 200,000 characters?**
It bounds document size (well under Mongo's 16 MB limit even with metadata), keeps list responses fast, and is far more than a normal scan produces.

**Q154. What are the main limitations of the whole system?**
Browser and device dependency (WASM, memory), first-use download size, handwriting weakness, no automatic rotation, no server-side OCR fallback, local fallback not suitable for production, and no full-text index on documents (regex search only).

---

## 16. Future Work

**Q155. What improvements would you add next?**
- Automatic orientation/deskew detection.
- Server-side OCR fallback for weak devices.
- A MongoDB text index for fast full-text library search.
- Per-user quotas and usage analytics.
- PDF multi-page input and page-by-page OCR.
- Handwriting models or a cloud OCR option for hard cases.
- A proper CER/WER benchmark harness in CI.
- Offline PWA install with cached language models.

**Q156. How would you support PDF input?**
Render each page to a canvas with a PDF.js, then run the existing pipeline per page and concatenate the text with page markers.

**Q157. How would you add automatic deskew safely?**
Estimate skew from the Hough transform or projection-profile variance over a small angle range (−10° to +10°), rotate only when the gain is clearly significant, and verify with a CER benchmark before enabling it by default.

**Q158. How could the app work fully offline?**
Register a service worker, cache the app shell, the Tesseract WASM build, and the chosen language models; then the OCR path needs no network at all.

**Q159. How would you add PII redaction?**
Detect patterns (emails, phone numbers, card numbers, Aadhaar/PAN-like IDs) with regex plus validation (e.g. Luhn for cards), highlight them in the result, and offer one-click masking before export or save.

**Q160. How would you measure user-perceived quality?**
Track OCR success rate, average confidence, retry rate, and export/edit rate anonymously, then correlate with image properties (resolution, contrast) to guide UX hints.

---

## 17. Likely Viva / Interview Follow-ups

**Q161. "Is the OCR done in Python with pytesseract?"**
Not in the current build. The shipped app runs Tesseract.js in the browser. The "Project details" cards describe an earlier Python/OpenCV and MNIST-style letter-classification prototype; the production path is JavaScript. Be ready to explain both: the prototype validated the concept, the web app made it deployable and private.

**Q162. "Where exactly does the OCR happen?"**
In a Web Worker created by Tesseract.js inside the user's browser. The server only serves files and stores accounts/documents.

**Q163. "Show me the flow from upload to export."**
`browse/drop` → `setSelectedFile()` + thumbnail → optional rotate/crop/grayscale/perspective → `extractText()` → optional `cleanImage({forOcr:true})` → `runOcr()` (prepare, recognise, retry if confidence < 80, keep best) → render text, confidence, word map → optional cleanup/proofread/table detection → `exportAs(format)` builds a Blob and downloads it → optional `POST /api/documents` to save.

**Q164. "What is the single most important line of preprocessing?"**
The local background division `gray * 225 / max(80, background)`. It removes shadows and lighting gradients, which is the most common cause of OCR failure in phone photos.

**Q165. "What happens if two users upload at the same time?"**
Nothing shared: each browser OCRs independently. On the server, document writes are scoped by `user_id`, and Mongo handles concurrency. In local fallback mode, `updateLocalArray()` serialises writes to avoid file corruption.

**Q166. "Why not store the original image in MongoDB?"**
Size and privacy. A 4 MB photo per scan would blow past the 16 MB document limit when combined with text, and retaining user images increases breach impact. A small thumbnail plus the text is enough.

**Q167. "How do you know your optimisation improved accuracy?"**
Only by measurement. The correct method is a ground-truth image set scored with CER/WER; without it, "looks better" is anecdotal. In this project a more aggressive preprocessing change measurably hurt results and was reverted to the conservative pipeline.

**Q168. "What would break first at scale?"**
The client, not the server: large images and multiple language models can exhaust browser memory. On the server side, the first pressure points would be Atlas connection limits on the free tier and session-store growth.

**Q169. "Is the app accessible?"**
It uses semantic buttons, `aria-label`s on icon actions, `aria-expanded` on menus, live-region toast announcements, and keyboard-focusable controls. Further work: full keyboard navigation for the crop tool and stronger contrast auditing.

**Q170. "What did you learn from this project?"**
That OCR accuracy is dominated by input quality and preprocessing discipline, not by the engine alone; that destructive "improvements" must be validated with metrics; and that keeping sensitive work in the browser plus a thin, well-guarded server is a strong architecture for a document tool.

---

## Quick Reference — Key Numbers

| Item | Value |
|---|---|
| Tesseract.js | 5.1.1 |
| OEM / PSM | 1 (LSTM) / 3 (auto page) |
| Retry confidence threshold | 80 |
| Processing canvas cap | 1800 px |
| OCR upscale cap | 2.5×, max 3200 px, target ≥ 2000 px |
| Shadow radius | `max(8, min(w,h)/45)` |
| Binarisation threshold | 175 |
| Post-processing passes | 8 |
| Languages | 56 codes, max 3 combined |
| Export formats | 7 |
| bcrypt cost | 12 |
| Session lifetime | 7 days |
| Auth rate limit | 20 / 15 min |
| Document rate limit | 120 / min |
| Max saved text | 200,000 chars |
| Library page size | 1–100 (default 20) |
| Server JSON limit | 16 KB (3 MB for documents) |
