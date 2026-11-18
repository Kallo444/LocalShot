# Changelog

All notable changes to LocalShot are documented here.

## 1.0.1 — Capture reliability and safety

- Fix visible and area captures resetting the webpage scroll position.
- Restore page state only when a full-page capture has started.
- Add a hard limit for excessive full-page capture segments.
- Add canvas dimension and memory guards with actionable error messages.
- Improve area-selection cancellation handling.
- Add shared filename, folder, settings and scroll-position helpers.
- Add automated unit tests and CI checks.

## 1.0.0 — Initial development snapshot

- Add Manifest V3 Chrome extension structure.
- Support full-page, visible-tab and selected-area capture.
- Add JPEG and PNG output.
- Add local settings and recent-capture history.
- Add keyboard shortcuts and optional Save As prompt.
- Add project documentation and MIT licence.

This is an early development build. Capture behaviour still needs real-browser testing across varied websites.
