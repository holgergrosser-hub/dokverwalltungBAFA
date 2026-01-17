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

// COPY_MARKER_UPDATED_AT: 2026-01-17 12:35:02

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

  var firmenname = pickFirst_(placeholders, ['Firmenname', 'firmenname', 'FIRMENNAME', 'FIRMEN_name']);
  if (!firmenname) {
    firmenname = pickFirst_(firmendaten, [
      'firmenname',
      'FIRMENNAME',
      'Firma',
      'FIRMA',
      'companyName',
      'COMPANYNAME',
      'name',
      'NAME'
    ]);
  }
  if (!firmenname && customer && customer.companyName) firmenname = customer.companyName;
  addPlaceholderWithVariants_(placeholders, 'Firmenname', firmenname);

  var strasse = pickFirst_(firmendaten, ['strasse', 'STRASSE', 'straße', 'Straße', 'adresse', 'ADRESSE', 'street', 'STREET']);
  addPlaceholderWithVariants_(placeholders, 'Straße', strasse);

  var plz = pickFirst_(firmendaten, ['plz', 'PLZ', 'postleitzahl', 'POSTLEITZAHL', 'zip', 'ZIP']);
  var ort = pickFirst_(firmendaten, ['ort', 'ORT', 'stadt', 'STADT', 'city', 'CITY']);
  var plzOrt = (String(plz || '').trim() + ' ' + String(ort || '').trim()).trim();
  addPlaceholderWithVariants_(placeholders, 'PLZ_Ort', plzOrt);

  var email = pickFirst_(firmendaten, ['email', 'EMAIL', 'eMail', 'mail', 'MAIL']);
  addPlaceholderWithVariants_(placeholders, 'email', email);

  var webpage = pickFirst_(firmendaten, ['webpage', 'WEBPAGE', 'homepage', 'HOMEPAGE', 'website', 'WEBSITE', 'webseite', 'WEBSEITE']);
  addPlaceholderWithVariants_(placeholders, 'Webpage', webpage);

  // Additional Firmendaten placeholders (optional, but commonly needed in templates)
  // These are merged server-side so templates can use them in ANY document type.
  if (firmendaten) {
    addPlaceholderWithVariants_(placeholders, 'ZIELGRUPPE', pickFirst_(firmendaten, ['zielgruppe', 'ZIELGRUPPE']));
    addPlaceholderWithVariants_(placeholders, 'ZIELGEBIET', pickFirst_(firmendaten, ['zielgebiet', 'ZIELGEBIET']));
    addPlaceholderWithVariants_(placeholders, 'GESCHAEFTSFUEHRER', pickFirst_(firmendaten, ['geschaeftsfuehrer', 'GESCHAEFTSFUEHRER']));
    addPlaceholderWithVariants_(placeholders, 'QMB', pickFirst_(firmendaten, ['qmb', 'QMB']));
    addPlaceholderWithVariants_(placeholders, 'UNTERNEHMENSPOLITIK', pickFirst_(firmendaten, ['unternehmenspolitik', 'UNTERNEHMENSPOLITIK']));
    addPlaceholderWithVariants_(placeholders, 'QUALITAETSPOLITIK', pickFirst_(firmendaten, ['qualitaetspolitik', 'QUALITAETSPOLITIK']));
    addPlaceholderWithVariants_(placeholders, 'DATENSICHERUNG', pickFirst_(firmendaten, ['datensicherung', 'DATENSICHERUNG']));
  }

  // Logo placeholder variants (template often uses LOGO_URL)
  var logo = '';
  if (customer) {
    logo = pickFirst_(customer, ['logoUrl', 'logoFileId', 'logoId']);
  }
  if (!logo && firmendaten) {
    logo = pickFirst_(firmendaten, ['logoUrl', 'logo']);
  }
  addPlaceholderWithVariants_(placeholders, 'LOGO_URL', logo);

  structured.placeholders = placeholders;
  return { customer: customer, firmendaten: firmendaten };
}

const BAFA_DOKUMENTE_SHEET_NAME_ = 'DOKUMENTE';

function getSpreadsheetForDocs_() {
  // Reuse existing helper from Firmendaten.gs if present.
  if (typeof getSpreadsheet_ === 'function') {
    return getSpreadsheet_();
  }

  // Fallback to ScriptProperties only.
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID ist nicht gesetzt (Script Properties)');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getDocumentsSheetForTracking_() {
  const ss = getSpreadsheetForDocs_();
  let sheet = ss.getSheetByName(BAFA_DOKUMENTE_SHEET_NAME_);
  if (!sheet) {
    sheet = ss.insertSheet(BAFA_DOKUMENTE_SHEET_NAME_);
    sheet.appendRow(['docId', 'kundeId', 'configId', 'documentName', 'googleDocId', 'docUrl', 'templateType', 'createdAt', 'updatedAt']);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['docId', 'kundeId', 'configId', 'documentName', 'googleDocId', 'docUrl', 'templateType', 'createdAt', 'updatedAt']);
  }
  return sheet;
}

function nextDocId_() {
  return 'doc_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000000);
}

function upsertDocumentTrackingRow_(kundeId, configId, documentName, googleDocId, docUrl, templateType) {
  const sheet = getDocumentsSheetForTracking_();
  const now = new Date().toISOString();
  const data = sheet.getDataRange().getValues();

  const idx = {
    docId: data[0].indexOf('docId'),
    kundeId: data[0].indexOf('kundeId'),
    configId: data[0].indexOf('configId'),
    documentName: data[0].indexOf('documentName'),
    googleDocId: data[0].indexOf('googleDocId'),
    docUrl: data[0].indexOf('docUrl'),
    templateType: data[0].indexOf('templateType'),
    createdAt: data[0].indexOf('createdAt'),
    updatedAt: data[0].indexOf('updatedAt')
  };

  // If header doesn't match (older sheet), fall back to fixed positions.
  const hasHeader = idx.kundeId >= 0 && idx.configId >= 0 && idx.googleDocId >= 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const rowKundeId = hasHeader ? row[idx.kundeId] : row[1];
    const rowConfigId = hasHeader ? row[idx.configId] : row[2];
    const rowGoogleDocId = hasHeader ? row[idx.googleDocId] : row[4];

    if (String(rowKundeId) === String(kundeId) && String(rowConfigId) === String(configId) && String(rowGoogleDocId) === String(googleDocId)) {
      const rowNumber = r + 1;
      if (hasHeader) {
        if (idx.documentName >= 0) sheet.getRange(rowNumber, idx.documentName + 1).setValue(documentName);
        if (idx.docUrl >= 0) sheet.getRange(rowNumber, idx.docUrl + 1).setValue(docUrl);
        if (idx.templateType >= 0) sheet.getRange(rowNumber, idx.templateType + 1).setValue(templateType);
        if (idx.updatedAt >= 0) sheet.getRange(rowNumber, idx.updatedAt + 1).setValue(now);
      } else {
        sheet.getRange(rowNumber, 4).setValue(documentName);
        sheet.getRange(rowNumber, 6).setValue(docUrl);
        sheet.getRange(rowNumber, 7).setValue(templateType);
        sheet.getRange(rowNumber, 9).setValue(now);
      }
      return { updated: true };
    }
  }

  const docId = nextDocId_();
  if (hasHeader) {
    const row = new Array(data[0].length).fill('');
    if (idx.docId >= 0) row[idx.docId] = docId;
    if (idx.kundeId >= 0) row[idx.kundeId] = kundeId;
    if (idx.configId >= 0) row[idx.configId] = configId;
    if (idx.documentName >= 0) row[idx.documentName] = documentName;
    if (idx.googleDocId >= 0) row[idx.googleDocId] = googleDocId;
    if (idx.docUrl >= 0) row[idx.docUrl] = docUrl;
    if (idx.templateType >= 0) row[idx.templateType] = templateType;
    if (idx.createdAt >= 0) row[idx.createdAt] = now;
    if (idx.updatedAt >= 0) row[idx.updatedAt] = now;
    sheet.appendRow(row);
  } else {
    sheet.appendRow([docId, kundeId, configId, documentName, googleDocId, docUrl, templateType, now, now]);
  }

  return { created: true, docId: docId };
}

function coerceStructuredInput_(inputData) {
  if (!inputData || typeof inputData !== 'object' || Array.isArray(inputData)) {
    throw new Error('inputData must be an object: { placeholders, tables }');
  }

  const placeholders = inputData.placeholders && typeof inputData.placeholders === 'object' ? inputData.placeholders : {};
  const tables = inputData.tables && typeof inputData.tables === 'object' ? inputData.tables : {};

  const options = inputData.options && typeof inputData.options === 'object' ? inputData.options : {};

  return { placeholders: placeholders, tables: tables, options: options };
}

function extractUnresolvedTokensFromContainer_(container) {
  if (!container || typeof container.getText !== 'function') return [];
  var text = '';
  try {
    text = String(container.getText() || '');
  } catch (e) {
    text = '';
  }
  if (!text) return [];
  var m = text.match(/\{\{[^}]+\}\}/g);
  if (!m || !m.length) return [];
  var uniq = {};
  m.forEach(function (t) {
    uniq[String(t)] = true;
  });
  return Object.keys(uniq).sort();
}

function collectUnresolvedTokens_(body, header, footer) {
  var all = [];
  all = all.concat(extractUnresolvedTokensFromContainer_(body));
  all = all.concat(extractUnresolvedTokensFromContainer_(header));
  all = all.concat(extractUnresolvedTokensFromContainer_(footer));
  var uniq = {};
  all.forEach(function (t) {
    uniq[String(t)] = true;
  });
  return Object.keys(uniq).sort();
}

// ==========================================
// UPDATE-ZONEN (Marker-basiertes Template-Sync)
// ==========================================

// Marker müssen als eigener Absatz/Zeile im Template stehen.
// Start: [[BAFA_ZONE:NAME]]
// Ende:  [[/BAFA_ZONE:NAME]]

function zoneStartMarker_(zoneName) {
  return '[[BAFA_ZONE:' + String(zoneName || '').trim() + ']]';
}

function zoneEndMarker_(zoneName) {
  return '[[/BAFA_ZONE:' + String(zoneName || '').trim() + ']]';
}

function extractZoneNamesFromContainer_(container) {
  if (!container || typeof container.getText !== 'function') return [];
  var text = '';
  try {
    text = String(container.getText() || '');
  } catch (e) {
    text = '';
  }
  if (!text) return [];

  var re = /\[\[BAFA_ZONE:([A-Za-z0-9_-]+)\]\]/g;
  var m;
  var uniq = {};
  while ((m = re.exec(text))) {
    if (m[1]) uniq[String(m[1])] = true;
  }
  return Object.keys(uniq).sort();
}

function findMarkerChildIndex_(container, markerText) {
  if (!container || !markerText) return -1;
  var n = typeof container.getNumChildren === 'function' ? container.getNumChildren() : 0;
  for (var i = 0; i < n; i++) {
    var child = container.getChild(i);
    if (!child || typeof child.getType !== 'function') continue;
    var t = child.getType();
    if (t === DocumentApp.ElementType.PARAGRAPH) {
      var p = child.asParagraph();
      var txt = '';
      try {
        txt = String(p.getText() || '');
      } catch (e) {
        txt = '';
      }
      if (txt && txt.indexOf(markerText) >= 0) return i;
    } else if (t === DocumentApp.ElementType.LIST_ITEM) {
      var li = child.asListItem();
      var txt2 = '';
      try {
        txt2 = String(li.getText() || '');
      } catch (e2) {
        txt2 = '';
      }
      if (txt2 && txt2.indexOf(markerText) >= 0) return i;
    }
  }
  return -1;
}

function getZoneRange_(container, zoneName) {
  var name = String(zoneName || '').trim();
  if (!name) return null;
  var startMarker = zoneStartMarker_(name);
  var endMarker = zoneEndMarker_(name);

  var startIndex = findMarkerChildIndex_(container, startMarker);
  var endIndex = findMarkerChildIndex_(container, endMarker);
  if (startIndex < 0 || endIndex < 0) return null;
  if (endIndex <= startIndex) return null;
  return { startIndex: startIndex, endIndex: endIndex };
}

function insertChildCopy_(container, insertIndex, childCopy) {
  if (!container || !childCopy) return false;
  var t = childCopy.getType();
  try {
    if (t === DocumentApp.ElementType.PARAGRAPH && typeof container.insertParagraph === 'function') {
      container.insertParagraph(insertIndex, childCopy.asParagraph());
      return true;
    }
    if (t === DocumentApp.ElementType.LIST_ITEM && typeof container.insertListItem === 'function') {
      container.insertListItem(insertIndex, childCopy.asListItem());
      return true;
    }
    if (t === DocumentApp.ElementType.TABLE && typeof container.insertTable === 'function') {
      container.insertTable(insertIndex, childCopy.asTable());
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

function syncSingleZoneFromTemplate_(targetContainer, templateContainer, zoneName) {
  if (!targetContainer || !templateContainer) return { synced: false, reason: 'missing_container' };

  var targetRange = getZoneRange_(targetContainer, zoneName);
  var templateRange = getZoneRange_(templateContainer, zoneName);

  if (!targetRange || !templateRange) return { synced: false, reason: 'zone_not_found' };

  // Remove existing content between markers in TARGET
  for (var i = targetRange.endIndex - 1; i > targetRange.startIndex; i--) {
    try {
      targetContainer.removeChild(targetContainer.getChild(i));
    } catch (e) {
      // ignore
    }
  }

  // Copy elements between markers from TEMPLATE into TARGET
  var insertAt = targetRange.startIndex + 1;
  for (var j = templateRange.startIndex + 1; j < templateRange.endIndex; j++) {
    var child = templateContainer.getChild(j);
    if (!child) continue;
    var copy;
    try {
      copy = child.copy();
    } catch (e2) {
      copy = null;
    }
    if (!copy) continue;
    if (insertChildCopy_(targetContainer, insertAt, copy)) {
      insertAt++;
    }
  }

  return { synced: true };
}

function getDocSectionContainer_(doc, sectionName) {
  var s = String(sectionName || 'body').toLowerCase();
  if (s === 'header') return doc.getHeader();
  if (s === 'footer') return doc.getFooter();
  return doc.getBody();
}

function shouldUseZoneSyncForConfig_(configId, opts) {
  var o = opts && typeof opts === 'object' ? opts : {};
  if (o.zoneSync === false) return false;
  if (o.zoneSync === true) return true;
  var id = String(configId || '');
  // Default: robust for docs that are typically updated later
  return id === 'bafa_04_managementbewertung' || id === 'bafa_10_auditbericht';
}

function syncZonesFromTemplate_(targetDocId, templateDocId, opts) {
  var o = opts && typeof opts === 'object' ? opts : {};
  var sections = Array.isArray(o.zoneSections) && o.zoneSections.length ? o.zoneSections : ['body'];

  var targetDoc = DocumentApp.openById(targetDocId);
  var templateDoc = DocumentApp.openById(templateDocId);

  var synced = [];
  var notFound = [];

  sections.forEach(function (sectionName) {
    var targetContainer = getDocSectionContainer_(targetDoc, sectionName);
    var templateContainer = getDocSectionContainer_(templateDoc, sectionName);
    if (!targetContainer || !templateContainer) return;

    var zoneNames = [];
    if (Array.isArray(o.zoneNames) && o.zoneNames.length) {
      zoneNames = o.zoneNames.map(function (z) {
        return String(z || '').trim();
      }).filter(function (z) {
        return !!z;
      });
    } else {
      zoneNames = extractZoneNamesFromContainer_(templateContainer);
    }

    zoneNames.forEach(function (zn) {
      var r = syncSingleZoneFromTemplate_(targetContainer, templateContainer, zn);
      if (r && r.synced) synced.push(sectionName + ':' + zn);
      else notFound.push(sectionName + ':' + zn);
    });
  });

  targetDoc.saveAndClose();

  return { synced: synced, notFound: notFound };
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

function limitInlineImageSize_(inlineImage, maxWidth, maxHeight) {
  if (!inlineImage) return;
  var w = 0;
  var h = 0;
  try {
    w = inlineImage.getWidth();
    h = inlineImage.getHeight();
  } catch (e) {
    return;
  }

  if (!w || !h) return;

  var mw = Number(maxWidth) || 0;
  var mh = Number(maxHeight) || 0;
  if (!mw && !mh) return;

  // Keep aspect ratio and only scale down.
  var scaleW = mw ? mw / w : 1;
  var scaleH = mh ? mh / h : 1;
  var scale = Math.min(scaleW, scaleH, 1);
  if (!(scale > 0) || scale === 1) return;

  try {
    inlineImage.setWidth(Math.round(w * scale));
    inlineImage.setHeight(Math.round(h * scale));
  } catch (e2) {
    // ignore
  }
}

function replaceFoundTextWithInlineImage_(found, blob) {
  if (!found) return false;

  var el = found.getElement();
  if (!el || !el.asText) return false;

  var textEl = el.asText();
  var start = found.getStartOffset();
  var end = found.getEndOffsetInclusive();

  // Find a parent element that supports inline image insertion (Paragraph/ListItem)
  var parent = textEl.getParent();
  while (parent && !(parent.insertInlineImage || parent.appendInlineImage)) {
    parent = parent.getParent();
  }

  // If we can't insert the image, at least remove the token to avoid infinite loops.
  if (!parent) {
    try {
      textEl.deleteText(start, end);
    } catch (e) {
      // ignore
    }
    return false;
  }

  var full = textEl.getText();
  var before = full.substring(0, start);
  var after = full.substring(end + 1);

  // Keep the text before the token in the current text node
  textEl.setText(before);

  // Insert the image as a sibling element after the text node
  try {
    var childIndex = parent.getChildIndex(textEl);
    if (parent.insertInlineImage) {
      var img = parent.insertInlineImage(childIndex + 1, blob);
      // Cap logo size (in pixels) to keep templates tidy.
      limitInlineImageSize_(img, 140, 80);
      if (after) {
        if (parent.insertText) parent.insertText(childIndex + 2, after);
        else if (parent.appendText) parent.appendText(after);
      }
      return true;
    }
  } catch (e) {
    // fall through to append
  }

  // Fallback: append image and remaining text
  try {
    if (parent.appendInlineImage) {
      var img2 = parent.appendInlineImage(blob);
      limitInlineImageSize_(img2, 140, 80);
    }
    if (after) {
      if (parent.appendText) parent.appendText(after);
    }
    return true;
  } catch (e) {
    return false;
  }
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

  // Try several common placeholders (image tokens)
  var tokens = [
    '{{LOGO}}',
    '{{Logo}}',
    '{{logo}}',
    '{{FIRMENLOGO}}',
    '{{Firmenlogo}}',
    '{{LOGO_URL}}',
    '{{Logo_Url}}',
    '{{logo_url}}'
  ];
  var replacedAny = false;

  tokens.forEach(function (token) {
    var found = body.findText(escapeForRegex_(token));
    while (found) {
      // Replace token with inline image safely (cannot call insertInlineImage on Text)
      var ok = replaceFoundTextWithInlineImage_(found, blob);
      replacedAny = replacedAny || ok;

      // Re-run search from scratch because we changed the element tree
      found = body.findText(escapeForRegex_(token));
    }
  });

  return replacedAny;
}

function applyPlaceholdersToContainer_(container, placeholders) {
  if (!container) return;

  // Replace scalar placeholders {{KEY}}
  Object.keys(placeholders || {}).forEach(function (key) {
    const value = placeholders[key];
    const v = value === null || value === undefined ? '' : String(value);

    // Candidates include explicit key and common case variants
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
      container.replaceText(escapeForRegex_(needle), v);
    });
  });
}

function cleanupRemainingTokens_(container) {
  if (!container) return;
  // Remove any unreplaced tokens like {{SOMETHING}} to avoid documents with raw placeholders.
  // This runs after normal replacement and table insertion.
  container.replaceText('\\{\\{[^}]+\\}\\}', '');
}

function applyTablesToBody_(body, tables, mode) {
  if (!body) return;
  const isAppend = String(mode || '').toLowerCase() === 'append';

  Object.keys(tables || {}).forEach(function (tableName) {
    const lines = tables[tableName];
    const text = Array.isArray(lines) ? lines.join('\n') : String(lines || '');
    if (!text.trim()) return;

    const tablePlaceholder = '{{TABLE_' + tableName + '}}';
    const found = body.findText(escapeForRegex_(tablePlaceholder));

    if (found) {
      if (isAppend) {
        // Append directly after placeholder location
        const el = found.getElement();
        const parent = el.getParent();
        const p = parent && parent.asParagraph ? parent.asParagraph() : null;
        const idx = p ? body.getChildIndex(p) : -1;
        body.replaceText(escapeForRegex_(tablePlaceholder), '');
        if (idx >= 0) {
          body.insertParagraph(idx + 1, text);
        } else {
          body.appendParagraph(text);
        }
      } else {
        body.replaceText(escapeForRegex_(tablePlaceholder), text);
      }
    } else {
      // Fallback section
      body.appendParagraph('');
      body.appendParagraph(tableName).setHeading(DocumentApp.ParagraphHeading.HEADING2);
      body.appendParagraph(text);
    }
  });
}

function applyDocReplacements_(docId, placeholders, tables, customer, mode, options) {
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();

  const header = doc.getHeader();
  const footer = doc.getFooter();

  const opts = options && typeof options === 'object' ? options : {};
  const cleanupOnly = !!opts.cleanupOnly || String(mode || '').toLowerCase() === 'cleanuponly';

  if (cleanupOnly) {
    cleanupRemainingTokens_(body);
    if (header) cleanupRemainingTokens_(header);
    if (footer) cleanupRemainingTokens_(footer);
    doc.saveAndClose();
    return { cleanupOnly: true, unresolvedTokens: [] };
  }

  // Optional: insert logo image where template has LOGO tokens
  insertLogoIfPresent_(body, customer);
  if (header) insertLogoIfPresent_(header, customer);
  if (footer) insertLogoIfPresent_(footer, customer);

  // Replace placeholders in body/header/footer
  applyPlaceholdersToContainer_(body, placeholders);
  if (header) applyPlaceholdersToContainer_(header, placeholders);
  if (footer) applyPlaceholdersToContainer_(footer, placeholders);

  // Tables are body-only (safe default)
  applyTablesToBody_(body, tables, mode);

  // Detect unresolved tokens and decide what to do with them.
  // Default is KEEP (so the UI can ask the user before removing).
  var unresolvedTokens = collectUnresolvedTokens_(body, header, footer);
  var policy = String(opts.unresolvedTokensPolicy || 'keep').toLowerCase();

  if (unresolvedTokens.length > 0) {
    if (policy === 'remove') {
      cleanupRemainingTokens_(body);
      if (header) cleanupRemainingTokens_(header);
      if (footer) cleanupRemainingTokens_(footer);
      unresolvedTokens = collectUnresolvedTokens_(body, header, footer);
    } else if (policy === 'error') {
      throw new Error('Unresolved placeholders: ' + unresolvedTokens.join(', '));
    }
  }

  doc.saveAndClose();
  return {
    cleanupOnly: false,
    unresolvedTokensPolicy: policy,
    unresolvedTokens: unresolvedTokens
  };
}

function updateBafaExistingDocument(googleDocId, configId, inputData, mode) {
  if (!googleDocId) throw new Error('googleDocId fehlt');
  if (!configId) throw new Error('configId fehlt');

  const cfg = getBafaConfig_(configId);
  if (cfg.templateType !== 'doc') {
    throw new Error('Update wird aktuell nur für Google Docs unterstützt (nicht für Sheets).');
  }

  const structured = coerceStructuredInput_(inputData);

  // Try to infer kundeId from tracking sheet (best effort)
  var kundeId = structured.kundeId || structured.customerId || '';
  try {
    const sheet = getDocumentsSheetForTracking_();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[4]) === String(googleDocId)) {
        kundeId = row[1];
        break;
      }
    }
  } catch (e) {
    // ignore
  }

  const ctx = kundeId ? mergeStandardPlaceholders_(kundeId, structured) : { customer: null };

  // Optional: Sync update-zones from template BEFORE applying placeholders/tables.
  // Skipped for cleanupOnly mode.
  try {
    const opts = structured.options && typeof structured.options === 'object' ? structured.options : {};
    const cleanupOnly = !!opts.cleanupOnly || String(mode || '').toLowerCase() === 'cleanuponly';
    if (!cleanupOnly && cfg.templateId && shouldUseZoneSyncForConfig_(cfg.id, opts)) {
      syncZonesFromTemplate_(googleDocId, cfg.templateId, opts);
    }
  } catch (e) {
    // Zone sync is best-effort; document update should still proceed.
  }
  const meta = applyDocReplacements_(
    googleDocId,
    structured.placeholders,
    structured.tables,
    ctx.customer,
    mode || 'append',
    structured.options
  );

  // Touch tracking row if available
  try {
    if (kundeId) {
      upsertDocumentTrackingRow_(kundeId, cfg.id, cfg.name, googleDocId, 'https://docs.google.com/document/d/' + googleDocId + '/edit', cfg.templateType);
    }
  } catch (e) {
    // ignore
  }

  return {
    success: true,
    configId: cfg.id,
    googleDocId: googleDocId,
    docUrl: 'https://docs.google.com/document/d/' + googleDocId + '/edit',
    updatedAt: new Date().toISOString(),
    message: 'Dokument aktualisiert: ' + cfg.name,
    unresolvedTokens: meta && meta.unresolvedTokens ? meta.unresolvedTokens : [],
    unresolvedTokensPolicy: meta && meta.unresolvedTokensPolicy ? meta.unresolvedTokensPolicy : 'keep'
  };
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
  const companyName = (ctx && ctx.customer && ctx.customer.companyName) || structured.placeholders.Firmenname || kundeId;
  const docName = cfg.name + ' - ' + companyName + ' - ' + ts;

  const copied = makeCopy_(cfg.templateId, docName, folderId);
  const copiedId = copied.getId();
  const url = copied.getUrl();

  if (cfg.templateType === 'doc') {
    var meta = applyDocReplacements_(
      copiedId,
      structured.placeholders,
      structured.tables,
      ctx.customer,
      'replace',
      structured.options
    );
  }

  // Track document so it can be listed/edited later
  try {
    upsertDocumentTrackingRow_(kundeId, cfg.id, docName, copiedId, url, cfg.templateType);
  } catch (e) {
    // If tracking isn't configured, still succeed creating the doc.
  }

  // For sheets we just copy and return URL (no structured writing yet)
  return {
    success: true,
    configId: cfg.id,
    templateType: cfg.templateType,
    googleDocId: copiedId,
    documentName: docName,
    docUrl: url,
    createdAt: new Date().toISOString(),
    message: 'Dokument erstellt: ' + cfg.name,
    unresolvedTokens: meta && meta.unresolvedTokens ? meta.unresolvedTokens : [],
    unresolvedTokensPolicy: meta && meta.unresolvedTokensPolicy ? meta.unresolvedTokensPolicy : 'keep'
  };
}
