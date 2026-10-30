const imageTextInput = document.getElementById("imageTextInput");
const imageFontSelect = document.getElementById("imageFontSelect");
const imageSizeSelect = document.getElementById("imageSizeSelect");
const imageWidthSelect = document.getElementById("imageWidthSelect");
const imageAlignSelect = document.getElementById("imageAlignSelect");
const imageTextColor = document.getElementById("imageTextColor");
const imageBackgroundColor = document.getElementById("imageBackgroundColor");
const useOcrTextBtn = document.getElementById("useOcrTextBtn");
const downloadTextImageBtn = document.getElementById("downloadTextImageBtn");
const textImageCanvas = document.getElementById("textImageCanvas");
const textImagePlaceholder = document.getElementById("textImagePlaceholder");
const textImageDimensions = document.getElementById("textImageDimensions");
const textImageStatus = document.getElementById("textImageStatus");
const ocrOutputText = document.getElementById("outputText");

const MAX_IMAGE_HEIGHT = 10000;
let isExportingTextImage = false;

function setTextImageStatus(message, isSuccess = false) {
    textImageStatus.textContent = message;
    textImageStatus.classList.toggle("is-success", isSuccess);
}

function wrapImageText(context, text, maxWidth) {
    const lines = [];

    for (const paragraph of text.split(/\r?\n/)) {
        if (!paragraph.trim()) {
            lines.push("");
            continue;
        }

        let line = "";
        for (const word of paragraph.split(/\s+/)) {
            const candidate = line ? `${line} ${word}` : word;
            if (context.measureText(candidate).width <= maxWidth) {
                line = candidate;
                continue;
            }

            if (line) {
                lines.push(line);
                line = "";
            }

            let part = "";
            for (const character of word) {
                if (part && context.measureText(part + character).width > maxWidth) {
                    lines.push(part);
                    part = "";
                }
                part += character;
            }
            line = part;
        }

        if (line) {
            lines.push(line);
        }
    }

    return lines;
}

function renderTextImage() {
    const text = imageTextInput.value.trim();
    const hasText = Boolean(text);
    downloadTextImageBtn.disabled = !hasText || isExportingTextImage;
    textImageCanvas.classList.toggle("hidden", !hasText);
    textImagePlaceholder.classList.toggle("hidden", hasText);
    textImageStatus.classList.remove("is-success");
    textImageStatus.textContent = "";

    if (!hasText) {
        textImageDimensions.textContent = "Your image preview will appear here.";
        return;
    }

    const width = Number(imageWidthSelect.value);
    const fontSize = Number(imageSizeSelect.value);
    const padding = Math.round(width * 0.07);
    const lineHeight = Math.ceil(fontSize * 1.45);
    const context = textImageCanvas.getContext("2d");

    if (!context) {
        downloadTextImageBtn.disabled = true;
        setTextImageStatus("Your browser could not create an image preview.");
        return;
    }

    context.font = `${fontSize}px ${imageFontSelect.value}`;
    const lines = wrapImageText(context, text, width - padding * 2);
    const height = Math.max(320, padding * 2 + lines.length * lineHeight);

    if (height > MAX_IMAGE_HEIGHT) {
        downloadTextImageBtn.disabled = true;
        textImageCanvas.classList.add("hidden");
        textImagePlaceholder.classList.remove("hidden");
        textImagePlaceholder.textContent = "This text is too long for one image. Shorten it or reduce the text size.";
        textImageDimensions.textContent = "Preview unavailable";
        setTextImageStatus("The image would exceed the 10,000 px height limit.");
        return;
    }

    textImageCanvas.width = width;
    textImageCanvas.height = height;
    context.fillStyle = imageBackgroundColor.value;
    context.fillRect(0, 0, width, height);
    context.font = `${fontSize}px ${imageFontSelect.value}`;
    context.fillStyle = imageTextColor.value;
    context.textBaseline = "top";
    context.textAlign = imageAlignSelect.value;

    const textX = imageAlignSelect.value === "left"
        ? padding
        : imageAlignSelect.value === "right"
            ? width - padding
            : width / 2;
    lines.forEach((line, index) => {
        context.fillText(line, textX, padding + index * lineHeight);
    });

    textImageDimensions.textContent = `${width} × ${height} px`;
    textImagePlaceholder.textContent = "Enter some text to see your image preview.";
}

function updateOcrButton() {
    useOcrTextBtn.disabled = !ocrOutputText.value.trim();
}

[
    imageTextInput,
    imageFontSelect,
    imageSizeSelect,
    imageWidthSelect,
    imageAlignSelect,
    imageTextColor,
    imageBackgroundColor
].forEach((control) => {
    control.addEventListener(control === imageTextInput ? "input" : "change", renderTextImage);
});

useOcrTextBtn.addEventListener("click", () => {
    imageTextInput.value = ocrOutputText.value;
    renderTextImage();
    imageTextInput.focus();
});

ocrOutputText.addEventListener("input", updateOcrButton);

downloadTextImageBtn.addEventListener("click", () => {
    if (!imageTextInput.value.trim() || downloadTextImageBtn.disabled) {
        return;
    }

    isExportingTextImage = true;
    downloadTextImageBtn.disabled = true;
    try {
        textImageCanvas.toBlob((blob) => {
            isExportingTextImage = false;
            downloadTextImageBtn.disabled = !imageTextInput.value.trim();
            if (!blob) {
                setTextImageStatus("Could not create the PNG. Try again or use a shorter text.");
                return;
            }

            try {
                Exporters.downloadBlob("textify-image.png", blob);
                setTextImageStatus("PNG downloaded.", true);
            } catch (error) {
                setTextImageStatus("Could not download the PNG. Check your browser settings and try again.");
                console.error("Text image download failed:", error);
            }
        }, "image/png");
    } catch (error) {
        isExportingTextImage = false;
        downloadTextImageBtn.disabled = !imageTextInput.value.trim();
        setTextImageStatus("Could not create the PNG. Try again or use a shorter text.");
        console.error("Text image creation failed:", error);
    }
});

updateOcrButton();
renderTextImage();
