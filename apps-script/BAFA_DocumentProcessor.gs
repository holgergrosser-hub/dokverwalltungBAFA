/**
 * BAFA Document Processor (copy/paste into your Apps Script project)
 *
 * Purpose:
 * - Create BAFA documents from Google Doc/Sheet templates
 * - Replace placeholders like {{KEY}}
 * - Insert table content via {{TABLE_<name>}} placeholders (or append if missing)
 *
 * Works with payloads sent from the new frontend:
 * inputData = { placeholders: {KEY: value}, tables: { tableName: ["a|b", ...] } }
 */

const BAFA_CONFIGS_ = {
  bafa_01_beraterbewertung: {
    id: 'bafa_01_beraterbewertung',
    name: 'Beraterbewertung',
    templateType: 'doc',
    templateId: '19sHCWql5I8O0VOGNh4n5ylhocj2BUCEgBk9VcRP1gSE'
  },
  bafa_02_kundenrueckmeldung: {
    id: 'bafa_02_kundenrueckmeldung',
    name: 'Kundenrückmeldung',
    templateType: 'doc',
    templateId: '1znLS0aew5TJTMqm0KPvTcGUhCjmB8VBWt8TX-IAy9NY'
  },
  bafa_03_normen_gesetze: {
    id: 'bafa_03_normen_gesetze',
    name: 'Liste der Normen und Gesetze',
    templateType: 'doc',
    templateId: '1SOnoiVsGQKSbzPs7-VKuVuZ-bB4hrkuAnTLFp9ZBMCo'
  },
  bafa_04_managementbewertung: {
    id: 'bafa_04_managementbewertung',
    name: 'Managementbewertung',
    templateType: 'doc',
    templateId: '1bjcsPKMBu4YbUm64UgwkEgLMDrMxxnGgc1bORYpv_jk'
  },
  bafa_05_massnahmenplan: {
    id: 'bafa_05_massnahmenplan',
    name: 'Maßnahmenplan',
    templateType: 'sheet',
    templateId: '1-pWJXHqptSCRiKaXwlCQ87w23PU1Eh8tBdt5lijNNeo'
  },
  bafa_06_prozess: {
    id: 'bafa_06_prozess',
    name: 'Prozess',
    templateType: 'doc',
    templateId: ''
  },
  bafa_07_schulungsplan: {
    id: 'bafa_07_schulungsplan',
    name: 'Schulungsplan',
    templateType: 'doc',
    templateId: '1i1b-WMi4u-mFh9H4p_Og-bwmUAmhVRuKyjk5vqxgHUA'
  },
  bafa_08_ziele_kennzahlen: {
    id: 'bafa_08_ziele_kennzahlen',
    name: 'Ziele und Prozesskennzahlen',
    templateType: 'doc',
    templateId: '1lUwqH5dK7bm-9qdysJpEi4Y34jZl3caOpWEhfcc4TyA'
  },
  bafa_09_unternehmenshandbuch: {
    id: 'bafa_09_unternehmenshandbuch',
    name: 'Unternehmenshandbuch',
    templateType: 'doc',
    templateId: '1NNkBv9fkgLN_fmuRXcPdgVie9wydNJONw3ljwdjAxrA'
  },
  bafa_10_auditbericht: {
    id: 'bafa_10_auditbericht',
    name: 'Auditbericht (Internes Audit)',
    templateType: 'doc',
    templateId: '1B-yXQN2GCMm0-5TtCogWdNG-ODg-AS7Ha6T4PdbvQJ4'
  },
  bafa_11_vollmacht: {
    id: 'bafa_11_vollmacht',
    name: 'Vollmacht',
    templateType: 'doc',
    templateId: '1NXiTpCPnErWghQJlxcfKU6WXC0unei5t4KTrtqr3ST0'
  },
  bafa_12_firmeninformationen: {
    id: 'bafa_12_firmeninformationen',
    name: 'Firmeninformationen für Fördergeldantrag',
    templateType: 'doc',
    templateId: '1xulA8qw2HMKTZ5EblvPgcWxxO-T44Zq3M6U1bE0jnuI'
  },
  bafa_13_projektbericht: {
    id: 'bafa_13_projektbericht',
    name: 'Projektbericht',
    templateType: 'doc',
    templateId: '1SDMZcBgq53XhyMnvbClwHqxufUXrpH9s-dBcO_FLnto'
  },
  bafa_14_ausfuellanleitung: {
    id: 'bafa_14_ausfuellanleitung',
    name: 'Ausfüllanleitung',
    templateType: 'doc',
    templateId: '1lrxkWP1R0li0BotmCb3SgZJeAC9237r5S2LlAOoRS68'
  }
};

function getBafaConfig_(configId) {
  const cfg = BAFA_CONFIGS_[String(configId || '')];
  if (!cfg) throw new Error("BAFA config not found: " + configId);
  return cfg;
}

function escapeForRegex_(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickFirst_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];
  }
  return '';
}

function extractDriveFileId_(maybeUrlOrId) {
  var s = String(maybeUrlOrId || '').trim();
  if (!s) return '';

  // Already looks like an id
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s) && s.indexOf('http') !== 0) return s;

  // /d/<id>/
  var m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})\//);
  if (m && m[1]) return m[1];

  // id=<id>
  m = s.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (m && m[1]) return m[1];

  return '';
}

function addPlaceholderWithVariants_(placeholders, key, value) {
  if (!key) return;
  var v = value === null || value === undefined ? '' : String(value);
  if (v.trim() === '') return;

  // Always set the explicit key
  placeholders[key] = placeholders[key] || v;

  var base = String(key);
  var lower = base.toLowerCase();
  var upper = base.toUpperCase();
  var title = base.length ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : base;
  var capFirst = base.length ? base.charAt(0).toUpperCase() + base.slice(1) : base;

  placeholders[lower] = placeholders[lower] || v;
  placeholders[upper] = placeholders[upper] || v;
  placeholders[title] = placeholders[title] || v;
  placeholders[capFirst] = placeholders[capFirst] || v;

  // Handle underscores by capitalizing each part (plz_ort -> PLZ_Ort)
  if (base.indexOf('_') >= 0) {
    var parts = base.split('_');
    var mapped = parts
      .map(function (p) {
        if (!p) return p;
        if (p.length <= 3) return p.toUpperCase();
        return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      })
      .join('_');
    placeholders[mapped] = placeholders[mapped] || v;
  }

  // German umlaut/transliteration variants (strasse <-> straße, ae<->ä, oe<->ö, ue<->ü)
  var de1 = base
    .replace(/ss/g, 'ß')
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü');
  var de2 = base
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue');

  if (de1 !== base) placeholders[de1] = placeholders[de1] || v;
  if (de2 !== base) placeholders[de2] = placeholders[de2] || v;
}

function mergeStandardPlaceholders_(kundeId, structured) {
  var placeholders = structured.placeholders || {};

  var customer = null;
  if (typeof getCustomer === 'function') {
    try {
      customer = getCustomer(kundeId);
    } catch (e) {
      customer = null;
    }
  }

  var firmendaten = null;
  if (typeof getFirmendaten === 'function') {
    try {
      firmendaten = getFirmendaten(kundeId) || {};
    } catch (e) {
      firmendaten = null;
    }
  }

  var firmenname = pickFirst_(placeholders, ['Firmenname', 'firmenname', 'FIRMENNAME']);
  if (!firmenname) firmenname = pickFirst_(firmendaten, ['firmenname', 'companyName', 'name']);
  if (!firmenname && customer && customer.companyName) firmenname = customer.companyName;
  addPlaceholderWithVariants_(placeholders, 'Firmenname', firmenname);

  var strasse = pickFirst_(firmendaten, ['strasse', 'straße', 'adresse', 'street']);
  addPlaceholderWithVariants_(placeholders, 'Straße', strasse);

  var plz = pickFirst_(firmendaten, ['plz', 'postleitzahl', 'zip']);
  var ort = pickFirst_(firmendaten, ['ort', 'stadt', 'city']);
  var plzOrt = (String(plz || '').trim() + ' ' + String(ort || '').trim()).trim();
  addPlaceholderWithVariants_(placeholders, 'PLZ_Ort', plzOrt);

  var email = pickFirst_(firmendaten, ['email', 'eMail', 'mail']);
  addPlaceholderWithVariants_(placeholders, 'email', email);

  var webpage = pickFirst_(firmendaten, ['webpage', 'homepage', 'website', 'webseite']);
  addPlaceholderWithVariants_(placeholders, 'Webpage', webpage);

  structured.placeholders = placeholders;
  return { customer: customer, firmendaten: firmendaten };
}

function coerceStructuredInput_(inputData) {
  if (!inputData || typeof inputData !== 'object' || Array.isArray(inputData)) {
    throw new Error('inputData must be an object: { placeholders, tables }');
  }

  const placeholders = inputData.placeholders && typeof inputData.placeholders === 'object' ? inputData.placeholders : {};
  const tables = inputData.tables && typeof inputData.tables === 'object' ? inputData.tables : {};

  return { placeholders: placeholders, tables: tables };
}

function getCustomerFolderIdForDocs_(kundeId) {
  // Prefer existing customer implementation if available.
  if (typeof getCustomer === 'function') {
    const customer = getCustomer(kundeId);
    if (customer && customer.folderId) return customer.folderId;
  }

  // Optional fallback: use Script Properties DEFAULT_CUSTOMER_FOLDER_ID
  const props = PropertiesService.getScriptProperties();
  const fallbackFolderId = props.getProperty('DEFAULT_CUSTOMER_FOLDER_ID');
  if (fallbackFolderId) return fallbackFolderId;

  // Last resort: root (not ideal, but prevents hard failure)
  return null;
}

function makeCopy_(templateId, name, folderId) {
  const file = DriveApp.getFileById(templateId);
  if (folderId) {
    const folder = DriveApp.getFolderById(folderId);
    return file.makeCopy(name, folder);
  }
  return file.makeCopy(name);
}

function insertLogoIfPresent_(body, customer) {
  if (!customer) return false;
  var raw = customer.logoFileId || customer.logoId || customer.logoUrl || '';
  var fileId = extractDriveFileId_(raw);
  if (!fileId) return false;

  var blob;
  try {
    blob = DriveApp.getFileById(fileId).getBlob();
  } catch (e) {
    return false;
  }

  // Try several common placeholders
  var tokens = ['{{LOGO}}', '{{Logo}}', '{{logo}}', '{{FIRMENLOGO}}', '{{Firmenlogo}}'];
  var replacedAny = false;

  tokens.forEach(function (token) {
    var found = body.findText(escapeForRegex_(token));
    while (found) {
      var text = found.getElement().asText();
      var start = found.getStartOffset();
      var end = found.getEndOffsetInclusive();
      text.deleteText(start, end);
      text.insertInlineImage(start, blob);
      replacedAny = true;
      found = body.findText(escapeForRegex_(token), found);
    }
  });

  return replacedAny;
}

function applyDocReplacements_(docId, placeholders, tables, customer) {
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();

  // Optional: insert logo image where template has {{LOGO}}
  insertLogoIfPresent_(body, customer);

  // Replace scalar placeholders {{KEY}}
  Object.keys(placeholders || {}).forEach(function (key) {
    const value = placeholders[key];
    const v = value === null || value === undefined ? '' : String(value);

    // Try common variants of the placeholder token
    var candidates = [];
    candidates.push('{{' + key + '}}');
    candidates.push('{{' + String(key).toLowerCase() + '}}');
    candidates.push('{{' + String(key).toUpperCase() + '}}');
    candidates.push('{{' + (String(key).length ? String(key).charAt(0).toUpperCase() + String(key).slice(1) : String(key)) + '}}');

    // German transliteration variants
    var k = String(key);
    var kDe1 = k.replace(/ss/g, 'ß').replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü');
    var kDe2 = k
      .replace(/ß/g, 'ss')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/Ä/g, 'Ae')
      .replace(/Ö/g, 'Oe')
      .replace(/Ü/g, 'Ue');
    if (kDe1 !== k) candidates.push('{{' + kDe1 + '}}');
    if (kDe2 !== k) candidates.push('{{' + kDe2 + '}}');

    // De-duplicate
    var uniq = {};
    candidates.forEach(function (c) {
      uniq[c] = true;
    });

    Object.keys(uniq).forEach(function (needle) {
      body.replaceText(escapeForRegex_(needle), v);
    });
  });

  // Replace tables via {{TABLE_name}} or append
  Object.keys(tables || {}).forEach(function (tableName) {
    const lines = tables[tableName];
    const text = Array.isArray(lines) ? lines.join('\n') : String(lines || '');

    const tablePlaceholder = '{{TABLE_' + tableName + '}}';
    const found = body.findText(escapeForRegex_(tablePlaceholder));

    if (found) {
      body.replaceText(escapeForRegex_(tablePlaceholder), text);
    } else {
      body.appendParagraph('');
      body.appendParagraph(tableName).setHeading(DocumentApp.ParagraphHeading.HEADING2);
      body.appendParagraph(text);
    }
  });

  doc.saveAndClose();
}

/**
 * Create BAFA document for a customer.
 *
 * Return shape is intentionally similar to existing API patterns.
 */
function processBafaDocumentForCustomer(kundeId, configId, inputData) {
  if (!kundeId) throw new Error('kundeId fehlt');
  if (!configId) throw new Error('configId fehlt');

  const cfg = getBafaConfig_(configId);

  if (!cfg.templateId) {
    throw new Error('Kein Template hinterlegt für ' + cfg.name + ' (' + cfg.id + ')');
  }

  const structured = coerceStructuredInput_(inputData);
  const ctx = mergeStandardPlaceholders_(kundeId, structured);

  const folderId = getCustomerFolderIdForDocs_(kundeId);
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const docName = cfg.name + ' - ' + kundeId + ' - ' + ts;

  const copied = makeCopy_(cfg.templateId, docName, folderId);
  const copiedId = copied.getId();
  const url = copied.getUrl();

  if (cfg.templateType === 'doc') {
    applyDocReplacements_(copiedId, structured.placeholders, structured.tables, ctx.customer);
  }

  // For sheets we just copy and return URL (no structured writing yet)
  return {
    success: true,
    configId: cfg.id,
    templateType: cfg.templateType,
    googleDocId: copiedId,
    docUrl: url,
    createdAt: new Date().toISOString(),
    message: 'Dokument erstellt: ' + cfg.name
  };
}
