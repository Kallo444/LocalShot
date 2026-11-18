# LocalShot

**Private-by-design screenshots for Chrome.** Capture a full webpage, the visible tab, or a selected region and save the result locally.

LocalShot is an independent open-source project. It is not affiliated with Google or Chrome.

## Project status

**Early development — v1.0.1.** The project is being actively iterated. This is not yet a stable release. Please report reproducible issues with the Chrome version, operating system, capture mode and exact error message.

## Features

- Full-page capture by scrolling the active tab and stitching viewport captures.
- Visible-tab screenshot.
- Drag-to-select an area within the visible viewport.
- JPEG output by default; PNG remains available.
- Optional suppression of fixed and sticky elements during full-page capture.
- Custom filename pattern and Downloads subfolder.
- Optional Chrome Save As dialog.
- Recent capture history stored locally.
- Keyboard shortcuts: `Alt+Shift+F` (full page) and `Alt+Shift+V` (visible tab).

## Privacy model

LocalShot is designed to process screenshots on-device.

- It has no analytics, advertising, account system, cloud storage or remote upload endpoint.
- It captures the active tab only after the user starts a capture.
- Cropping, stitching and image encoding run in a local extension offscreen document.
- The resulting image is saved using Chrome Downloads.
- Preferences and recent history are stored in `chrome.storage.local`.
- The recent history stores filename, source URL and capture time; it does not store image pixels.

The extension uses `activeTab` and `scripting` rather than persistent broad host permissions. Review `manifest.json` and the source before installing.

## Install locally

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository folder containing `manifest.json`.
5. Pin LocalShot, open a normal HTTP or HTTPS page, and choose a capture mode.

## Save location

By default, screenshots are saved to `Downloads/LocalShot/`. Chrome controls the Downloads root folder. Enable **Ask where to save each screenshot** in settings to choose a destination per capture.

## Keyboard shortcuts

- Full page: `Alt+Shift+F`
- Visible tab: `Alt+Shift+V`

Customise them at `chrome://extensions/shortcuts`.

## Development

Requires Node.js 20 or later. No build step is required.

```bash
npm run check
npm test
```

The GitHub Actions workflow runs both checks on pushes and pull requests.

## Known limitations

- Very long pages may exceed browser canvas or memory limits. LocalShot now stops with an explicit message rather than attempting unbounded allocation.
- Lazy-loaded content may require a longer scroll delay.
- Sticky/fixed suppression is heuristic and can hide floating controls.
- Nested scrolling containers, cross-origin frames, shadow DOM, animations and dynamic layouts may not be captured perfectly.
- Area capture is limited to the visible viewport.
- Chrome internal pages, Chrome Web Store pages and protected content cannot be captured.
- Browser-level integration tests are still needed; Node tests do not replace testing in Chrome.

## Roadmap

- [x] Add unit tests for filename, folder, settings and scroll-position logic.
- [x] Add CI syntax checks and unit tests.
- [ ] Add browser integration tests on representative websites.
- [ ] Improve lazy-loaded content handling.
- [ ] Replace heuristic sticky handling with a safer, more configurable approach.
- [ ] Add screenshot preview and annotation editor.
- [ ] Add local searchable screenshot library.
- [ ] Add PDF export.

## Contributing

Focused bug reports and pull requests are welcome. Do not attach private screenshots or sensitive page content.

## License

MIT. See [LICENSE](LICENSE).
