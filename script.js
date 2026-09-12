const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const settings = document.getElementById("settings");
const result = document.getElementById("result");
const errorBox = document.getElementById("error");

const fileName = document.getElementById("fileName");
const originalSize = document.getElementById("originalSize");

const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");

const compressButton = document.getElementById("compressButton");

const resultOriginal = document.getElementById("resultOriginal");
const resultCompressed = document.getElementById("resultCompressed");
const reduction = document.getElementById("reduction");

const downloadButton = document.getElementById("downloadButton");
const resetButton = document.getElementById("resetButton");

let selectedFile = null;
let downloadUrl = null;

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return (
        (bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)
        + " "
        + units[index]
    );
}

function showError(message) {

    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {

    errorBox.textContent = "";
    errorBox.classList.add("hidden");
}

function handleFile(file) {

    hideError();

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        showError("Please select a JPG, PNG or WebP image.");
        return;
    }

    if (file.size > MAX_FILE_SIZE) {

        showError("The maximum file size is 20 MB.");
        return;
    }

    selectedFile = file;

    fileName.textContent = file.name;
    originalSize.textContent = formatBytes(file.size);

    dropZone.classList.add("hidden");
    settings.classList.remove("hidden");
    result.classList.add("hidden");
}

fileInput.addEventListener("change", function () {

    handleFile(this.files[0]);

});

dropZone.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropZone.classList.add("dragover");

});

dropZone.addEventListener("dragleave", function () {

    dropZone.classList.remove("dragover");

});

dropZone.addEventListener("drop", function (event) {

    event.preventDefault();

    dropZone.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    handleFile(file);

});

quality.addEventListener("input", function () {

    qualityValue.textContent = `${quality.value}%`;

});

compressButton.addEventListener("click", function () {

    if (!selectedFile) {
        return;
    }

    hideError();

    compressButton.disabled = true;
    compressButton.textContent = "Compressing...";

    const image = new Image();

    image.onload = function () {

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(
            image,
            0,
            0,
            image.width,
            image.height
        );

        /*
         * JPEG is used for the output because it provides
         * predictable quality-based compression.
         *
         * PNG/WebP files will therefore also be converted
         * into JPEG.
         */

        const compressionQuality = Number(quality.value) / 100;

        canvas.toBlob(
            function (blob) {

                if (!blob) {

                    showError("Compression failed. Please try another image.");

                    compressButton.disabled = false;
                    compressButton.textContent = "Compress Image";

                    return;
                }

                if (downloadUrl) {
                    URL.revokeObjectURL(downloadUrl);
                }

                downloadUrl = URL.createObjectURL(blob);

                resultOriginal.textContent =
                    formatBytes(selectedFile.size);

                resultCompressed.textContent =
                    formatBytes(blob.size);

                let percentage =
                    ((selectedFile.size - blob.size) /
                    selectedFile.size) * 100;

                /*
                 * If compression makes the file larger,
                 * report that instead of showing a fake reduction.
                 */

                if (percentage >= 0) {

                    reduction.textContent =
                        `${percentage.toFixed(1)}%`;

                } else {

                    reduction.textContent =
                        `File increased by ${Math.abs(percentage).toFixed(1)}%`;
                }

                downloadButton.href = downloadUrl;

                const originalName =
                    selectedFile.name
                        .replace(/\.[^/.]+$/, "");

                downloadButton.download =
                    `${originalName}-compressed.jpg`;

                settings.classList.add("hidden");
                result.classList.remove("hidden");

                compressButton.disabled = false;
                compressButton.textContent = "Compress Image";

            },
            "image/jpeg",
            compressionQuality
        );

        URL.revokeObjectURL(image.src);
    };

    image.onerror = function () {

        showError("The image could not be processed.");

        compressButton.disabled = false;
        compressButton.textContent = "Compress Image";
    };

    image.src = URL.createObjectURL(selectedFile);

});

resetButton.addEventListener("click", function () {

    if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        downloadUrl = null;
    }

    selectedFile = null;

    fileInput.value = "";

    dropZone.classList.remove("hidden");
    settings.classList.add("hidden");
    result.classList.add("hidden");

    quality.value = 75;
    qualityValue.textContent = "75%";

    hideError();

});