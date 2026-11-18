(() => {
  const MAX_FILENAME_LENGTH = 120;
  function cleanFilenamePart(value) {
    return String(value ?? "").replace(/[\\/:*?"<>|]+/g, "-").replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").replace(/^\.+|\.+$/g, "").trim().slice(0, MAX_FILENAME_LENGTH);
  }
  function normalizeFolder(value) {
    return String(value ?? "").replace(/\\/g, "/").split("/").map(part => part.trim()).filter(part => part && part !== "." && part !== "..").map(part => part.replace(/[<>:"|?*\u0000-\u001f]/g, "-")).join("/");
  }
  function buildFilename({ title, pattern, date, type, format, folder }) {
    const safeTitle = cleanFilenamePart(title) || "page";
    const safeDate = cleanFilenamePart(date);
    const safeType = cleanFilenamePart(type);
    const raw = String(pattern || "{title}_{date}").replaceAll("{title}", safeTitle).replaceAll("{date}", safeDate).replaceAll("{type}", safeType);
    const stem = cleanFilenamePart(raw) || "LocalShot";
    const extension = format === "jpeg" ? "jpg" : "png";
    const safeFolder = normalizeFolder(folder);
    return `${safeFolder ? safeFolder + "/" : ""}${stem}.${extension}`;
  }
  function getScrollPositions(pageHeight, viewportHeight, overlap = 80) {
    const height = Math.max(1, Math.floor(pageHeight));
    const viewport = Math.max(1, Math.floor(viewportHeight));
    const maxY = Math.max(0, height - viewport);
    const stride = Math.max(1, viewport - Math.max(0, Math.floor(overlap)));
    const positions = [];
    for (let y = 0; y < height; y += stride) {
      positions.push(Math.min(y, maxY));
      if (y >= maxY) break;
    }
    positions.push(maxY);
    return [...new Set(positions)].sort((a, b) => a - b);
  }
  function normalizeSettings(settings, defaults) {
    const merged = { ...defaults, ...(settings || {}) };
    const delay = Number(merged.delayMs);
    merged.delayMs = Number.isFinite(delay) ? Math.min(3000, Math.max(150, Math.round(delay))) : defaults.delayMs;
    merged.format = merged.format === "png" ? "png" : "jpeg";
    merged.folder = normalizeFolder(merged.folder);
    merged.filenamePattern = String(merged.filenamePattern || defaults.filenamePattern).slice(0, 180);
    merged.hideSticky = Boolean(merged.hideSticky);
    merged.saveAs = Boolean(merged.saveAs);
    return merged;
  }
  const api = { cleanFilenamePart, normalizeFolder, buildFilename, getScrollPositions, normalizeSettings };
  globalThis.LocalShotUtils = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
