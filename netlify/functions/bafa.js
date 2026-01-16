/**
 * Netlify Function proxy for BAFA Google Apps Script WebApp.
 *
 * Why: Never ship the Apps Script password to the browser.
 * Frontend calls this function; the function injects BAFA_API_PASSWORD server-side.
 *
 * Required env vars (Netlify Dashboard):
 * - BAFA_API_URL
 * - BAFA_API_PASSWORD
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiUrl = process.env.BAFA_API_URL;
  const apiPassword = process.env.BAFA_API_PASSWORD;

  if (!apiUrl || !apiPassword) {
    const presentBafaKeys = Object.keys(process.env || {}).filter((k) => k.startsWith('BAFA_'));
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Server not configured',
        message: 'Missing BAFA_API_URL and/or BAFA_API_PASSWORD on Netlify',
        missing: {
          BAFA_API_URL: !apiUrl,
          BAFA_API_PASSWORD: !apiPassword
        },
        presentKeys: presentBafaKeys
      })
    };
  }

  let incoming;
  try {
    incoming = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  if (!incoming || typeof incoming !== 'object' || !incoming.action) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required field: action' })
    };
  }

  // Inject password server-side.
  const payload = { ...incoming, password: apiPassword };

  try {
    // Use FormData with a single `data` field. This matches the Apps Script backend
    // and avoids any CORS/preflight concerns on the Apps Script side.
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    const bodyText = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8';

    return {
      statusCode: response.status,
      headers: { ...corsHeaders, 'Content-Type': contentType },
      body: bodyText
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Upstream request failed',
        message: err?.message || String(err)
      })
    };
  }
};
