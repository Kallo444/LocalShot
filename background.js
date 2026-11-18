importScripts("utils.js");
const DEFAULT_SETTINGS = { folder: "LocalShot", format: "jpeg", delayMs: 500, hideSticky: true, saveAs: false, filenamePattern: "{title}_{date}" };
const MAX_CAPTURE_SEGMENTS = 300;
let busy = false;
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") await chrome.storage.local.set({ settings: DEFAULT_SETTINGS, history: [] });
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "CAPTURE") return;
  capture(message.mode).then(result => sendResponse({ ok: true, ...result })).catch(error => sendResponse({ ok: false, error: error?.message || "Screenshot capture failed." }));
  return true;
});
chrome.commands.onCommand.addListener(command => {
  const mode = command === "capture-full-page" ? "full" : command === "capture-visible-area" ? "visible" : null;
  if (mode) capture(mode).catch(error => console.error("LocalShot:", error));
});
async function getSettings() {
  const stored = await chrome.storage.local.get({ settings: DEFAULT_SETTINGS });
  return LocalShotUtils.normalizeSettings(stored.settings, DEFAULT_SETTINGS);
}
async function capture(mode) {
  if (busy) throw new Error("A capture is already running. Please wait for it to finish.");
  busy = true;
  let tab;
  let contentScriptReady = false;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.windowId || !/^https?:/i.test(tab.url || "")) throw new Error("Open a normal HTTP or HTTPS webpage first. Chrome internal pages cannot be captured.");
    const settings = await getSettings();
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    contentScriptReady = true;
    let imageDataUrl;
    if (mode === "visible") {
      imageDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    } else if (mode === "area") {
      const selection = await chrome.tabs.sendMessage(tab.id, { type: "SELECT_AREA" });
      if (!selection?.rect) throw new Error("Area selection cancelled. Drag a rectangle on the page to capture it.");
      const visible = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
      imageDataUrl = await processOffscreen("CROP", { dataUrl: visible, rect: selection.rect, dpr: selection.dpr });
    } else if (mode === "full") {
      const page = await chrome.tabs.sendMessage(tab.id, { type: "START_CAPTURE", hideSticky: settings.hideSticky });
      if (!page?.viewportWidth || !page?.viewportHeight || !page?.height) throw new Error(page?.error || "Could not read the webpage dimensions.");
      const pageHeight = Math.max(page.height, page.viewportHeight);
      const positions = LocalShotUtils.getScrollPositions(pageHeight, page.viewportHeight, 80);
      if (positions.length > MAX_CAPTURE_SEGMENTS) throw new Error(`This page is too long to capture safely (${positions.length} segments). Try capturing a smaller section.`);
      const captures = [];
      for (const y of positions) {
        await chrome.tabs.sendMessage(tab.id, { type: "SCROLL_TO", y });
        await sleep(settings.delayMs);
        captures.push({ y, dataUrl: await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }) });
      }
      imageDataUrl = await processOffscreen("STITCH", { captures, width: page.viewportWidth, height: pageHeight, dpr: page.dpr });
    } else throw new Error("Unknown screenshot mode.");
    if (settings.format === "jpeg") imageDataUrl = await processOffscreen("JPEG", { dataUrl: imageDataUrl });
    const filename = await saveImage(imageDataUrl, tab, settings, mode);
    await addHistory(filename, tab.url);
    return { filename };
  } catch (error) {
    console.error("LocalShot capture error:", error);
    throw error;
  } finally {
    if (tab?.id && contentScriptReady) await chrome.tabs.sendMessage(tab.id, { type: "END_CAPTURE" }).catch(() => {});
    busy = false;
  }
}
async function ensureOffscreenDocument() {
  const url = chrome.runtime.getURL("offscreen.html");
  const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [url] });
  if (!contexts.length) await chrome.offscreen.createDocument({ url: "offscreen.html", reasons: ["BLOBS"], justification: "Process screenshot images locally before saving them." });
}
async function processOffscreen(type, data) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({ target: "offscreen", type, ...data });
  if (!response?.dataUrl) throw new Error(response?.error || `Screenshot ${type.toLowerCase()} processing failed.`);
  return response.dataUrl;
}
async function saveImage(dataUrl, tab, settings, mode) {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = LocalShotUtils.buildFilename({ title: tab.title || "page", pattern: settings.filenamePattern, date, type: mode, format: settings.format, folder: settings.folder });
  await ensureOffscreenDocument();
  const result = await chrome.runtime.sendMessage({ target: "offscreen", type: "BLOB_URL", dataUrl, mime: settings.format === "jpeg" ? "image/jpeg" : "image/png" });
  if (!result?.url) throw new Error(result?.error || "Could not prepare the screenshot file for download.");
  const downloadId = await chrome.downloads.download({ url: result.url, filename, conflictAction: "uniquify", saveAs: settings.saveAs });
  if (typeof downloadId !== "number") throw new Error("Chrome did not start the screenshot download.");
  return filename;
}
async function addHistory(name, url) {
  const { history = [] } = await chrome.storage.local.get({ history: [] });
  history.unshift({ name, url, time: Date.now() });
  await chrome.storage.local.set({ history: history.slice(0, 30) });
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
