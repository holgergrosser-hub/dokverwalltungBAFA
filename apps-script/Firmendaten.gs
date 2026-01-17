/**
 * FIRMENDATEN (COPY & PASTE)
 *
 * Ziel:
 * - saveFirmendaten / getFirmendaten funktionieren in Apps Script WebApp (doPost) zuverlässig.
 * - KEIN SpreadsheetApp.getActiveSpreadsheet() als einzige Quelle (liefert in WebApps oft null).
 *
 * Voraussetzung:
 * - Script Properties enthalten: SPREADSHEET_ID = <deine Google Sheets ID>
 *   (du hast das bereits gesetzt)
 *
 * Wichtig:
 * - Es darf im gesamten Apps-Script-Projekt nur EINMAL saveFirmendaten() und getFirmendaten() geben.
 */

const FIRMENDATEN_SHEET_NAME = 'FIRMENDATEN';

function getSpreadsheet_() {
  // In Container-bound Scripts kann das funktionieren – in WebApps oft nicht.
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // ignore
  }

  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID ist nicht gesetzt (Script Properties)');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function getFirmendatenSheet_() {
  const ss = getSpreadsheet_();

  let sheet = ss.getSheetByName(FIRMENDATEN_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(FIRMENDATEN_SHEET_NAME);
    sheet.appendRow(['kundeId', 'feldName', 'feldWert', 'updatedAt']);
  }

  // Header sicherstellen
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['kundeId', 'feldName', 'feldWert', 'updatedAt']);
  }

  return sheet;
}

/**
 * Firmendaten speichern (Key-Value)
 * @param {string} kundeId
 * @param {Object} firmendatenObject
 */
function saveFirmendaten(kundeId, firmendatenObject) {
  if (!kundeId) throw new Error('kundeId fehlt');
  if (!firmendatenObject || typeof firmendatenObject !== 'object') {
    throw new Error('firmendatenObject fehlt');
  }

  const sheet = getFirmendatenSheet_();
  const now = new Date().toISOString();

  // Daten einmal lesen
  const data = sheet.getDataRange().getValues();

  // Index: (kundeId + feldName) -> rowIndex
  const index = {};
  for (let i = 1; i < data.length; i++) {
    const rowKundeId = data[i][0];
    const feldName = data[i][1];
    if (rowKundeId && feldName) {
      index[String(rowKundeId) + '|' + String(feldName)] = i;
    }
  }

  Object.entries(firmendatenObject).forEach(([feldName, feldWert]) => {
    const key = String(kundeId) + '|' + String(feldName);
    const existingRowIndex = index[key];

    if (existingRowIndex !== undefined) {
      // Update existierende Zeile
      sheet.getRange(existingRowIndex + 1, 3).setValue(feldWert);
      sheet.getRange(existingRowIndex + 1, 4).setValue(now);
    } else {
      // Neu anfügen
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
 * Firmendaten laden
 * @param {string} kundeId
 */
function getFirmendaten(kundeId) {
  if (!kundeId) throw new Error('kundeId fehlt');

  const sheet = getFirmendatenSheet_();
  const data = sheet.getDataRange().getValues();
  const result = {};

  for (let i = 1; i < data.length; i++) {
    const [rowKundeId, feldName, feldWert] = data[i];
    if (String(rowKundeId) === String(kundeId) && feldName) {
      result[String(feldName)] = feldWert;
    }
  }

  return result;
}

// ------------------------------
// API HANDLER (optional)
// Nur nötig, falls du sie nicht schon woanders hast.
// createResponse(...) muss in deinem WebApp-Code existieren.
// ------------------------------

function handleSaveFirmendaten(data, headers) {
  try {
    Logger.log('SAVE_FIRMENDATEN: kundeId=' + (data && data.kundeId));
    Logger.log('SAVE_FIRMENDATEN: fields=' + Object.keys((data && data.firmendaten) || {}).join(','));

    const { kundeId, firmendaten } = data || {};

    if (!kundeId || !firmendaten) {
      return createResponse(
        400,
        { error: 'Missing parameters', message: 'kundeId und firmendaten sind erforderlich' },
        headers
      );
    }

    // Optional: prüfen ob Kunde existiert (wenn getCustomer vorhanden ist)
    if (typeof getCustomer === 'function') {
      try {
        getCustomer(kundeId);
      } catch (e) {
        return createResponse(404, { error: 'Customer not found', message: e.message }, headers);
      }
    }

    const result = saveFirmendaten(kundeId, firmendaten);

    return createResponse(
      200,
      {
        success: true,
        kundeId: kundeId,
        fieldsUpdated: result.fieldsUpdated,
        message: 'Firmendaten erfolgreich gespeichert'
      },
      headers
    );
  } catch (error) {
    Logger.log('Fehler in handleSaveFirmendaten: ' + error);
    return createResponse(500, { error: 'Failed to save firmendaten', message: error.message }, headers);
  }
}

function handleGetFirmendaten(data, headers) {
  try {
    const { kundeId } = data || {};

    if (!kundeId) {
      return createResponse(400, { error: 'Missing kundeId', message: 'Parameter kundeId ist erforderlich' }, headers);
    }

    const firmendaten = getFirmendaten(kundeId);

    return createResponse(
      200,
      {
        success: true,
        kundeId: kundeId,
        firmendaten: firmendaten,
        fieldsCount: Object.keys(firmendaten).length
      },
      headers
    );
  } catch (error) {
    Logger.log('Fehler in handleGetFirmendaten: ' + error);
    return createResponse(500, { error: 'Failed to get firmendaten', message: error.message }, headers);
  }
}
