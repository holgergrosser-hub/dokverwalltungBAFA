/**
 * ERWEITERTE API - BAFA DOKUMENTE
 * Mit Kundenverwaltung, Logo-Upload und Dokument-Tracking
 *
 * FIX: Unterstützt jetzt FormData UND JSON
 *
 * Hinweis: Diese Datei enthält nur das WebApp-Routing + Handler.
 * Die Business-Funktionen (listCustomers, createCustomer, etc.) müssen
 * im selben Apps-Script-Projekt vorhanden sein (separate .gs Dateien sind ok).
 */

// ==========================================
// AUTHENTIFIZIERUNG
// ==========================================

function getPassword() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const password = scriptProperties.getProperty('API_PASSWORD');

  if (!password) {
    throw new Error('API_PASSWORD nicht konfiguriert!');
  }

  return password;
}

function setupPassword() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const password = 'BAFA-2024-Secure'; // ⚠️ ÄNDERN!
  scriptProperties.setProperty('API_PASSWORD', password);
  Logger.log('✅ Passwort gesetzt!');
}

function authenticate(requestData) {
  const correctPassword = getPassword();
  if (requestData.password !== correctPassword) {
    return { success: false, message: 'Falsches Passwort' };
  }
  return { success: true };
}

// ==========================================
// MAIN ENDPOINTS
// ==========================================

function doPost(e) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // =============================================
    // FIX: FormData ODER JSON akzeptieren
    // =============================================
    let requestData;

    if (e.parameter && e.parameter.data) {
      // FormData von Frontend (CORS-freundlich)
      requestData = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      // Direktes JSON
      requestData = JSON.parse(e.postData.contents);
    } else {
      return createResponse(
        400,
        {
          error: 'No data received',
          message: 'Keine Daten empfangen'
        },
        headers
      );
    }
    // =============================================

    // Authentifizierung
    const authResult = authenticate(requestData);
    if (!authResult.success) {
      return createResponse(
        401,
        {
          error: 'Unauthorized',
          message: authResult.message
        },
        headers
      );
    }

    // Action Router
    switch (requestData.action) {
      case 'status':
        return createResponse(
          200,
          {
            status: 'online',
            system: 'BAFA Dokumente',
            version: '2.3.0',
            timestamp: new Date().toISOString()
          },
          headers
        );

      // KUNDEN
      case 'listCustomers':
        return handleListCustomers(headers);

      case 'getCustomer':
        return handleGetCustomer(requestData, headers);

      case 'createCustomer':
        return handleCreateCustomer(requestData, headers);

      // LOGO
      case 'uploadLogo':
        return handleUploadLogo(requestData, headers);

      // FIRMENDATEN
      case 'saveFirmendaten':
        return handleSaveFirmendaten(requestData, headers);

      case 'getFirmendaten':
        return handleGetFirmendaten(requestData, headers);

      // DOKUMENTE
      case 'listCustomerDocuments':
        return handleListCustomerDocuments(requestData, headers);

      case 'processDocumentForCustomer':
        return handleProcessDocumentForCustomer(requestData, headers);

      case 'updateExistingDocument':
        return handleUpdateExistingDocument(requestData, headers);

      case 'createAllDocumentsForCustomer':
        return handleCreateAllDocuments(requestData, headers);

      // CONFIGS (Original)
      case 'listConfigs':
        return handleListConfigs(headers);

      case 'getConfig':
        return handleGetConfig(requestData, headers);

      default:
        return createResponse(
          400,
          {
            error: 'Invalid action',
            message: `Action '${requestData.action}' nicht unterstützt`
          },
          headers
        );
    }
  } catch (error) {
    Logger.log('Fehler in doPost: ' + error);
    return createResponse(500, {
      error: 'Internal Server Error',
      message: error.message
    });
  }
}

function doOptions(e) {
  // Note: ContentService TextOutput does not support custom headers.
  // CORS headers are unnecessary when calling this WebApp server-to-server (e.g. via Netlify Function proxy).
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return createResponse(200, {
    status: 'online',
    system: 'BAFA Dokumente',
    version: '2.3.0',
    timestamp: new Date().toISOString(),
    features: [
      'Kundenverwaltung',
      'Logo-Upload',
      'Dokument-Tracking',
      'Bearbeiten-Funktion',
      '15 Dokumenttypen',
      'FormData Support (CORS-Fix)',
      'Firmendaten-System'
    ]
  });
}

// ==========================================
// HANDLER: KUNDEN
// ==========================================

function handleListCustomers(headers) {
  try {
    const customers = listCustomers();
    return createResponse(200, { customers }, headers);
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Failed to list customers',
        message: error.message
      },
      headers
    );
  }
}

function handleGetCustomer(data, headers) {
  try {
    const { kundeId } = data;
    if (!kundeId) {
      return createResponse(400, { error: 'Missing kundeId' }, headers);
    }

    const customer = getCustomer(kundeId);
    return createResponse(200, { customer }, headers);
  } catch (error) {
    return createResponse(
      404,
      {
        error: 'Customer not found',
        message: error.message
      },
      headers
    );
  }
}

function handleCreateCustomer(data, headers) {
  try {
    const { companyName, parentFolderId } = data;
    if (!companyName) {
      return createResponse(400, { error: 'Missing companyName' }, headers);
    }

    const customer = createCustomer(companyName, parentFolderId);
    return createResponse(200, { customer }, headers);
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Failed to create customer',
        message: error.message
      },
      headers
    );
  }
}

// ==========================================
// HANDLER: LOGO
// ==========================================

function handleUploadLogo(data, headers) {
  try {
    const { kundeId, logoBlob } = data;

    if (!kundeId || !logoBlob) {
      return createResponse(
        400,
        {
          error: 'Missing parameters',
          message: 'kundeId und logoBlob sind erforderlich'
        },
        headers
      );
    }

    const logoUrl = uploadCustomerLogo(kundeId, logoBlob);

    return createResponse(
      200,
      {
        success: true,
        logoUrl: logoUrl,
        message: 'Logo erfolgreich hochgeladen'
      },
      headers
    );
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Logo upload failed',
        message: error.message
      },
      headers
    );
  }
}

// ==========================================
// HANDLER: DOKUMENTE
// ==========================================

function handleListCustomerDocuments(data, headers) {
  try {
    const { kundeId } = data;

    if (!kundeId) {
      return createResponse(400, { error: 'Missing kundeId' }, headers);
    }

    const documents = listCustomerDocuments(kundeId);

    return createResponse(
      200,
      {
        kundeId: kundeId,
        documents: documents,
        count: documents.length
      },
      headers
    );
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Failed to list documents',
        message: error.message
      },
      headers
    );
  }
}

function handleProcessDocumentForCustomer(data, headers) {
  try {
    const { kundeId, configId, inputData } = data;

    if (!kundeId || !configId || !inputData) {
      return createResponse(
        400,
        {
          error: 'Missing parameters',
          message: 'kundeId, configId und inputData sind erforderlich'
        },
        headers
      );
    }

    // BAFA v2: structured inputData { placeholders, tables }
    // Only used when configId starts with bafa_ and helper exists.
    const isBafa = String(configId || '').indexOf('bafa_') === 0;
    const isStructured = inputData && typeof inputData === 'object' && !Array.isArray(inputData);

    let result;
    if (isBafa && isStructured && typeof processBafaDocumentForCustomer === 'function') {
      result = processBafaDocumentForCustomer(kundeId, configId, inputData);
    } else {
      // Legacy behavior (typically expects inputData as array of lines)
      result = processDocumentForCustomer(kundeId, configId, inputData);
    }

    return createResponse(200, result, headers);
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Document processing failed',
        message: error.message
      },
      headers
    );
  }
}

function handleUpdateExistingDocument(data, headers) {
  try {
    const { googleDocId, configId, inputData, mode } = data;

    if (!googleDocId || !configId || !inputData) {
      return createResponse(
        400,
        {
          error: 'Missing parameters',
          message: 'googleDocId, configId und inputData sind erforderlich'
        },
        headers
      );
    }

    const result = updateExistingDocument(googleDocId, configId, inputData, mode || 'append');

    return createResponse(200, result, headers);
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Document update failed',
        message: error.message
      },
        headers
    );
  }
}

function handleCreateAllDocuments(data, headers) {
  try {
    const { kundeId } = data;

    if (!kundeId) {
      return createResponse(400, { error: 'Missing kundeId' }, headers);
    }

    const result = createAllDocumentsForCustomer(kundeId);

    return createResponse(200, result, headers);
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Batch creation failed',
        message: error.message
      },
      headers
    );
  }
}

// ==========================================
// HANDLER: CONFIGS
// ==========================================

function handleListConfigs(headers) {
  try {
    const configs = listDocumentConfigs();
    return createResponse(200, { configs }, headers);
  } catch (error) {
    return createResponse(
      500,
      {
        error: 'Failed to list configs',
        message: error.message
      },
      headers
    );
  }
}

function handleGetConfig(data, headers) {
  try {
    const { configId } = data;
    if (!configId) {
      return createResponse(400, { error: 'Missing configId' }, headers);
    }

    const config = getDocumentConfig(configId);
    return createResponse(200, { config }, headers);
  } catch (error) {
    return createResponse(
      404,
      {
        error: 'Config not found',
        message: error.message
      },
      headers
    );
  }
}

// ==========================================
// HELPER
// ==========================================

function createResponse(statusCode, data, headers = {}) {
  const response = {
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    ...data
  };

  const output = ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );

  return output;
}
