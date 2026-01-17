# Apps Script (Reference)

This folder contains reference `.gs` files intended for copy/paste into your Google Apps Script project.

## Firmendaten
- Use **only** `Code.js` (router) + `Firmendaten.gs` (storage + handlers).
- Avoid having multiple definitions of the same global functions in Apps Script (last one wins), especially:
  - `saveFirmendaten`
  - `getFirmendaten`
  - `handleSaveFirmendaten`
  - `handleGetFirmendaten`

Other files here are kept as deprecated reference and have been renamed to not override the canonical implementations.
