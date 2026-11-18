chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target !== "offscreen") return;
  const jobs = {
    STITCH: () => stitch(message),
    CROP: () => crop(message),
    JPEG: () => encodeJpeg(message.dataUrl),
    BLOB_URL: () => createBlobUrl(message.dataUrl, message.mime)
  };
  const job = jobs[message.type];
  if (!job) return;
  job().then(value => sendResponse(message.type === "BLOB_URL" ? { url: value } : { dataUrl: value }))
    .catch(error => sendResponse({ error: error.message || "Local image processing failed." }));
  return true;
});
const MAX_CANVAS_SIDE = 32767;
const MAX_CANVAS_PIXELS = 80_000_000;
function createCanvas(width, height) {
  const w = Math.ceil(width), h = Math.ceil(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) throw new Error("Invalid screenshot dimensions.");
  if (w > MAX_CANVAS_SIDE || h > MAX_CANVAS_SIDE || w * h > MAX_CANVAS_PIXELS) throw new Error("This screenshot is too large for the browser to assemble safely. Try a shorter page or capture it in sections.");
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("The browser could not create an image canvas.");
  return { canvas, context };
}
async function stitch({ captures, width, height, dpr }) {
  if (!Array.isArray(captures) || captures.length === 0) throw new Error("No page segments were captured.");
  const scale = Number(dpr) || 1;
  const { canvas, context } = createCanvas(width * scale, height * scale);
  context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
  for (const shot of captures) {
    const image = await loadImage(shot.dataUrl);
    const y = Math.round(shot.y * scale);
    const drawHeight = Math.min(image.naturalHeight, canvas.height - y);
    if (drawHeight <= 0) continue;
    context.drawImage(image, 0, 0, image.naturalWidth, drawHeight, 0, y, canvas.width, drawHeight);
  }
  return canvasToDataUrl(canvas, "image/png");
}
async function crop({ dataUrl, rect, dpr }) {
  const image = await loadImage(dataUrl), scale = Number(dpr) || 1;
  const sx = Math.max(0, Math.round(rect.x * scale)), sy = Math.max(0, Math.round(rect.y * scale));
  const sw = Math.round(rect.width * scale), sh = Math.round(rect.height * scale);
  const { canvas, context } = createCanvas(sw, sh);
  if (sx + sw > image.naturalWidth || sy + sh > image.naturalHeight) throw new Error("The selected area is outside the captured screen. Please try selecting it again.");
  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvasToDataUrl(canvas, "image/png");
}
async function encodeJpeg(dataUrl) {
  const image = await loadImage(dataUrl);
  const { canvas, context } = createCanvas(image.naturalWidth, image.naturalHeight);
  context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  return canvasToDataUrl(canvas, "image/jpeg", 0.92);
}
async function createBlobUrl(dataUrl, mime) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("Could not read the processed screenshot.");
  const sourceBlob = await response.blob();
  const blob = new Blob([sourceBlob], { type: mime || sourceBlob.type || "image/png" });
  const url = URL.createObjectURL(blob);
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return url;
}
function canvasToDataUrl(canvas, mime, quality) {
  try { return canvas.toDataURL(mime, quality); }
  catch { throw new Error("The browser ran out of memory while creating the screenshot. Try a shorter page."); }
}
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("A captured page segment could not be decoded."));
    image.src = source;
  });
}
