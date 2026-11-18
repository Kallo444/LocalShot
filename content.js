(() => {
  if (window.__localShotInstalled) return;
  window.__localShotInstalled = true;
  let captureState = null;
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "START_CAPTURE") {
      try {
        captureState = { x: window.scrollX, y: window.scrollY, hidden: [], styleNode: null };
        if (message.hideSticky) hideFixedAndSticky();
        sendResponse({
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          height: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0, window.innerHeight),
          dpr: window.devicePixelRatio || 1
        });
      } catch (error) {
        restorePage();
        sendResponse({ error: error.message });
      }
      return;
    }
    if (message?.type === "SCROLL_TO") { window.scrollTo(0, message.y); sendResponse({ ok: true }); return; }
    if (message?.type === "END_CAPTURE") { restorePage(); sendResponse({ ok: true }); return; }
    if (message?.type === "SELECT_AREA") {
      selectArea().then(rect => sendResponse({ rect, dpr: window.devicePixelRatio || 1 })).catch(() => sendResponse({ rect: null }));
      return true;
    }
  });
  function hideFixedAndSticky() {
    const state = captureState;
    if (!state) return;
    const style = document.createElement("style");
    style.textContent = "html { scroll-behavior: auto !important; } [data-localshot-hidden='1'] { visibility: hidden !important; }";
    (document.head || document.documentElement).appendChild(style);
    state.styleNode = style;
    for (const element of document.querySelectorAll("body *")) {
      const position = window.getComputedStyle(element).position;
      if (position === "fixed" || position === "sticky") {
        state.hidden.push({ element, previous: element.getAttribute("data-localshot-hidden") });
        element.setAttribute("data-localshot-hidden", "1");
      }
    }
  }
  function restorePage() {
    if (!captureState) return;
    const state = captureState;
    captureState = null;
    if (state.styleNode?.isConnected) state.styleNode.remove();
    for (const item of state.hidden) {
      if (!item.element.isConnected) continue;
      if (item.previous === null) item.element.removeAttribute("data-localshot-hidden");
      else item.element.setAttribute("data-localshot-hidden", item.previous);
    }
    window.scrollTo(state.x, state.y);
  }
  function selectArea() {
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,.12);";
      const hint = document.createElement("div");
      hint.textContent = "Drag to select an area · Esc to cancel";
      hint.style.cssText = "position:absolute;top:16px;left:50%;transform:translateX(-50%);background:#202124;color:white;padding:9px 13px;border-radius:7px;font:13px system-ui";
      overlay.appendChild(hint);
      document.documentElement.appendChild(overlay);
      let start = null, box = null, finished = false;
      const finish = rect => {
        if (finished) return;
        finished = true;
        overlay.remove();
        window.removeEventListener("keydown", onKey);
        resolve(rect);
      };
      const onKey = event => { if (event.key === "Escape") finish(null); };
      window.addEventListener("keydown", onKey);
      overlay.addEventListener("pointerdown", event => {
        start = { x: event.clientX, y: event.clientY };
        box = document.createElement("div");
        box.style.cssText = "position:absolute;border:2px solid #1a73e8;background:rgba(26,115,232,.16);pointer-events:none";
        overlay.appendChild(box);
        overlay.setPointerCapture(event.pointerId);
      });
      overlay.addEventListener("pointermove", event => {
        if (!start || !box) return;
        Object.assign(box.style, {
          left: `${Math.min(start.x, event.clientX)}px`,
          top: `${Math.min(start.y, event.clientY)}px`,
          width: `${Math.abs(event.clientX - start.x)}px`,
          height: `${Math.abs(event.clientY - start.y)}px`
        });
      });
      overlay.addEventListener("pointerup", event => {
        if (!start) return;
        const rect = { x: Math.min(start.x, event.clientX), y: Math.min(start.y, event.clientY), width: Math.abs(event.clientX - start.x), height: Math.abs(event.clientY - start.y) };
        finish(rect.width > 3 && rect.height > 3 ? rect : null);
      });
      overlay.addEventListener("pointercancel", () => finish(null));
    });
  }
})();
