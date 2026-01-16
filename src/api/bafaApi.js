/**
 * BAFA Apps Script API Client
 *
 * Supports both transports implemented in your Apps Script backend:
 * - FormData (default): avoids CORS preflight for Google Apps Script
 * - JSON: standard application/json POST
 */

function assertConfigured(value, name) {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
}

async function callBafaApi({ apiUrl, apiPassword, action, data = {}, transport = 'formdata' }) {
  assertConfigured(apiUrl, 'VITE_API_URL');
  assertConfigured(action, 'action');

  const payload = {
    action,
    ...data
  };

  // Only include password when provided. This enables using a server-side proxy
  // (e.g. Netlify Function) that injects the password securely.
  if (apiPassword) {
    payload.password = apiPassword;
  }

  let response;

  if (transport === 'json') {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });
  }

  const result = await response.json();

  if (!response.ok) {
    const message = result?.message || result?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (result?.statusCode && result.statusCode >= 400) {
    throw new Error(result?.message || result?.error || `API statusCode ${result.statusCode}`);
  }

  return result;
}

export function createBafaApi({ apiUrl, apiPassword, transport } = {}) {
  const resolvedUrl = apiUrl ?? import.meta.env.VITE_API_URL;
  assertConfigured(resolvedUrl, 'VITE_API_URL');

  const resolvedPassword = apiPassword ?? import.meta.env.VITE_API_PASSWORD;

  const isDirectAppsScriptCall =
    typeof resolvedUrl === 'string' && resolvedUrl.includes('script.google.com/macros/');
  if (isDirectAppsScriptCall) {
    assertConfigured(resolvedPassword, 'VITE_API_PASSWORD');
  }

  const isNetlifyFunctionCall =
    typeof resolvedUrl === 'string' && resolvedUrl.startsWith('/.netlify/functions/');
  const resolvedTransport =
    transport ??
    import.meta.env.VITE_API_TRANSPORT ??
    (isNetlifyFunctionCall ? 'json' : 'formdata');

  const base = (action, data) =>
    callBafaApi({
      apiUrl: resolvedUrl,
      apiPassword: resolvedPassword,
      action,
      data,
      transport: resolvedTransport
    });

  return {
    listCustomers: () => base('listCustomers'),
    getCustomer: (kundeId) => base('getCustomer', { kundeId }),
    createCustomer: (companyName, parentFolderId) =>
      base('createCustomer', { companyName, parentFolderId }),

    listConfigs: () => base('listConfigs'),
    getConfig: (configId) => base('getConfig', { configId }),

    listCustomerDocuments: (kundeId) => base('listCustomerDocuments', { kundeId }),
    processDocumentForCustomer: (kundeId, configId, inputData) =>
      base('processDocumentForCustomer', { kundeId, configId, inputData }),
    updateExistingDocument: (googleDocId, configId, inputData, mode = 'append') =>
      base('updateExistingDocument', { googleDocId, configId, inputData, mode }),
    createAllDocumentsForCustomer: (kundeId) => base('createAllDocumentsForCustomer', { kundeId }),

    uploadLogo: (kundeId, logoBlob) => base('uploadLogo', { kundeId, logoBlob })
  };
}
