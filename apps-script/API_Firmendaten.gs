/**
 * DEPRECATED / REFERENCE ONLY
 *
 * Diese Datei ist absichtlich "ungefährlich" gemacht, damit sie beim Copy/Paste
 * in ein Apps-Script-Projekt keine globalen Handler-Namen überschreibt.
 *
 * Nutze stattdessen die Implementierung in `Firmendaten.gs`.
 */

function handleSaveFirmendaten_DEPRECATED(data, headers) {
  try {
    const { kundeId, firmendaten } = data;

    if (!kundeId || !firmendaten) {
      return createResponse(
        400,
        {
          error: 'Missing parameters',
          message: 'kundeId und firmendaten sind erforderlich'
        },
        headers
      );
    }

    // Optional: ensure customer exists (depends on your existing implementation)
    const customer = getCustomer(kundeId);
    if (!customer) {
      return createResponse(
        404,
        {
          error: 'Customer not found',
          message: `Kunde ${kundeId} nicht gefunden`
        },
        headers
      );
    }

    const result = saveFirmendaten(kundeId, firmendaten);

    return createResponse(
      200,
      {
        success: true,
        kundeId: kundeId,
        fieldsUpdated: Object.keys(firmendaten).length,
        message: `Firmendaten erfolgreich gespeichert (${Object.keys(firmendaten).length} Felder)`,
        result: result
      },
      headers
    );
  } catch (error) {
    Logger.log('Fehler in handleSaveFirmendaten: ' + error);
    return createResponse(
      500,
      {
        error: 'Failed to save firmendaten',
        message: error.message
      },
      headers
    );
  }
}

function handleGetFirmendaten_DEPRECATED(data, headers) {
  try {
    const { kundeId } = data;

    if (!kundeId) {
      return createResponse(
        400,
        {
          error: 'Missing kundeId',
          message: 'Parameter kundeId ist erforderlich'
        },
        headers
      );
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
    return createResponse(
      500,
      {
        error: 'Failed to get firmendaten',
        message: error.message
      },
      headers
    );
  }
}
