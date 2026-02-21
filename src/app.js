const form = document.getElementById("image-form");
const promptInput = document.getElementById("prompt");
const status = document.getElementById("status");
const resultImage = document.getElementById("result-image");
const afterMessage = document.getElementById("after-message");
const generateButton = document.getElementById("generate-btn");
const downloadButton = document.getElementById("download-btn");
const configuredBaseUrl =
  window.APP_CONFIG && typeof window.APP_CONFIG.apiBaseUrl === "string"
    ? window.APP_CONFIG.apiBaseUrl.trim()
    : "";
const apiBaseUrl = configuredBaseUrl.replace(/\/+$/, "");
let currentPrompt = "";
let backendOverlayImages = [];

async function loadReferenceImages() {
  const response = await fetch(`${apiBaseUrl}/api/reference-images`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to load backend images.");
  }

  backendOverlayImages = (data.images || []).map((item) => item.url).filter(Boolean);

  if (!backendOverlayImages.length) {
    status.textContent =
      "No backend Neil images found. Add PNG/JPG files to variation-download/assets/neil.";
    generateButton.disabled = true;
  } else {
    generateButton.disabled = false;
  }
}

function pickRandomOverlayUrl() {
  if (!backendOverlayImages.length) {
    return "";
  }

  const seed = Date.now();
  const randomish = (1664525 * seed + 1013904223) % 4294967296;
  const index = randomish % backendOverlayImages.length;
  return backendOverlayImages[index];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}

async function prepareOverlayImage(overlayUrl) {
  const overlayImage = await loadImage(overlayUrl);
  const canvas = document.createElement("canvas");
  canvas.width = overlayImage.naturalWidth;
  canvas.height = overlayImage.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable.");
  }

  ctx.drawImage(overlayImage, 0, 0);
  return canvas;
}

async function compositeAlignedFullSize(baseImageUrl, overlayUrl) {
  const baseImage = await loadImage(baseImageUrl);
  const overlayCanvas = await prepareOverlayImage(overlayUrl);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable.");
  }

  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    overlayCanvas,
    0,
    0,
    overlayCanvas.width,
    overlayCanvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/png");
}

downloadButton.addEventListener("click", async () => {
  const imageSrc = resultImage.src;
  if (!imageSrc) {
    status.textContent = "Generate an image first.";
    return;
  }

  const safePrompt = (currentPrompt || "ai-image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
  const fileName = `${safePrompt || "ai-image"}-${Date.now()}.png`;

  try {
    const response = await fetch(imageSrc);
    if (!response.ok) {
      throw new Error("Download request failed.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
    status.textContent = "Opened image in a new tab. Right-click and save image.";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  if (!prompt) {
    status.textContent = "Please enter a seedy environment.";
    return;
  }

  const referenceImageUrl = pickRandomOverlayUrl();
  if (!referenceImageUrl) {
    status.textContent = "No backend overlay image available.";
    return;
  }

  status.textContent = "Searching Epstein files";
  afterMessage.hidden = true;
  generateButton.disabled = true;
  downloadButton.disabled = true;

  try {
    const response = await fetch(`${apiBaseUrl}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Image generation failed.");
    }

    const compositedImageUrl = await compositeAlignedFullSize(
      data.imageUrl,
      referenceImageUrl,
    );

    resultImage.src = compositedImageUrl;
    currentPrompt = prompt;
    downloadButton.disabled = false;
    status.textContent = "Image matching description found";
    afterMessage.hidden = false;
  } catch (error) {
    status.textContent = error.message || "Something went wrong.";
    afterMessage.hidden = true;
  } finally {
    generateButton.disabled = false;
  }
});

loadReferenceImages().catch((error) => {
  status.textContent = error.message || "Failed to load backend images.";
});
