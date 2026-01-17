/**
 * FIRMENDATEN-MANAGER (WebApp-sicher)
 *
 * Wichtig:
 * - In einer Apps Script WebApp ist `SpreadsheetApp.getActiveSpreadsheet()` oft `null`.
 * - Daher: Spreadsheet-ID in ScriptProperties hinterlegen und via `openById` öffnen.
 *
 * ScriptProperties Keys:
 * - SPREADSHEET_ID
 */

/**
 * DEPRECATED / REFERENCE ONLY
 *
 * Diese Datei ist absichtlich umbenannt, damit sie beim Copy/Paste
 * keine globalen Namen überschreibt (Apps Script teilt sich 1 Global Scope).
 *
 * Nutze stattdessen `Firmendaten.gs` als Single Source of Truth.
 */

const FIRMENDATEN_SHEET_NAME_SM = 'FIRMENDATEN';

function getSpreadsheet_SM_() {
  // Try active spreadsheet first (works in container-bound / editor context)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // ignore
  }

  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error(
      'SPREADSHEET_ID nicht gesetzt. Bitte in ScriptProperties setzen (Key: SPREADSHEET_ID)'
    );
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Firmendaten für einen Kunden speichern
 * @param {string} kundeId
 * @param {Object} firmendatenObject
 */
function saveFirmendaten_SM(kundeId, firmendatenObject) {
  if (!kundeId) throw new Error('kundeId fehlt');
  if (!firmendatenObject || typeof firmendatenObject !== 'object') {
    throw new Error('firmendatenObject fehlt');
  }

  const ss = getSpreadsheet_SM_();
  let sheet = ss.getSheetByName(FIRMENDATEN_SHEET_NAME_SM);

  if (!sheet) {
    sheet = ss.insertSheet(FIRMENDATEN_SHEET_NAME_SM);
    sheet.appendRow(['kundeId', 'feldName', 'feldWert', 'updatedAt']);
  }

  const now = new Date().toISOString();

  // Read once for performance
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();

  Object.entries(firmendatenObject).forEach(([feldName, feldWert]) => {
    let foundRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === kundeId && data[i][1] === feldName) {
        foundRowIndex = i;
        break;
      }
    }

    if (foundRowIndex >= 0) {
      // Update existing
      sheet.getRange(foundRowIndex + 1, 3).setValue(feldWert);
      sheet.getRange(foundRowIndex + 1, 4).setValue(now);
    } else {
      // Insert new
      sheet.appendRow([kundeId, feldName, feldWert, now]);
    }
  });

  return {
    success: true,
    kundeId: kundeId,
    fieldsUpdated: Object.keys(firmendatenObject).length
  };
}

/**
 * Firmendaten für einen Kunden laden
 * @param {string} kundeId
 */
function getFirmendaten_SM(kundeId) {
  if (!kundeId) throw new Error('kundeId fehlt');

  const ss = getSpreadsheet_SM_();
  const sheet = ss.getSheetByName(FIRMENDATEN_SHEET_NAME_SM);

  if (!sheet) {
    return {};
  }

  const data = sheet.getDataRange().getValues();
  const result = {};

  for (let i = 1; i < data.length; i++) {
    const [rowKundeId, feldName, feldWert] = data[i];
    if (rowKundeId === kundeId && feldName) {
      result[feldName] = feldWert;
    }
  }

  return result;
}
