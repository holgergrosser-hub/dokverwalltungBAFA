/**
 * CUSTOMER MANAGER (COPY & PASTE)
 *
 * Provides the business functions required by apps-script/Code.js:
 * - listCustomers, getCustomer, createCustomer
 * - uploadCustomerLogo (used by handleUploadLogo)
 *
 * Data storage: Google Sheet (Script Property SPREADSHEET_ID)
 * Sheet: KUNDEN
 */

// COPY_MARKER_UPDATED_AT: 2026-01-17 12:35:02

const KUNDEN_SHEET_NAME_ = 'KUNDEN';

function getCustomersSpreadsheet_() {
  // Prefer Firmendaten helper if present
  if (typeof getSpreadsheet_ === 'function') {
    return getSpreadsheet_();
  }

  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID ist nicht gesetzt (Script Properties)');
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getCustomersSheet_() {
  const ss = getCustomersSpreadsheet_();
  let sheet = ss.getSheetByName(KUNDEN_SHEET_NAME_);
  if (!sheet) {
    sheet = ss.insertSheet(KUNDEN_SHEET_NAME_);
    sheet.appendRow([
      'kundeId',
      'companyName',
      'folderId',
      'parentFolderId',
      'logoFileId',
      'logoUrl',
      'createdAt',
      'updatedAt'
    ]);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'kundeId',
      'companyName',
      'folderId',
      'parentFolderId',
      'logoFileId',
      'logoUrl',
      'createdAt',
      'updatedAt'
    ]);
  }
  return sheet;
}

function nextKundeId_() {
  return 'kunde_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000000);
}

function normalizeString_(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function folderUrlFromId_(folderId) {
  if (!folderId) return '';
  return 'https://drive.google.com/drive/folders/' + String(folderId);
}

function fileViewUrlFromId_(fileId) {
  if (!fileId) return '';
  // Works for inline images in Google Docs; access depends on Drive permissions.
  return 'https://drive.google.com/uc?export=view&id=' + String(fileId);
}

function ensureCustomerFolder_(companyName, parentFolderId) {
  const props = PropertiesService.getScriptProperties();
  const fallbackRoot = props.getProperty('DEFAULT_CUSTOMERS_ROOT_FOLDER_ID') || props.getProperty('DEFAULT_CUSTOMER_FOLDER_ID');

  const parentId = normalizeString_(parentFolderId) || normalizeString_(fallbackRoot);
  if (!parentId) {
    // If nothing configured, create in Drive root (not ideal, but functional).
    const root = DriveApp.getRootFolder();
    return root.createFolder(companyName).getId();
  }

  const parent = DriveApp.getFolderById(parentId);

  // Reuse existing folder with same name if present (avoids duplicates)
  try {
    const it = parent.getFoldersByName(companyName);
    if (it && it.hasNext()) {
      return it.next().getId();
    }
  } catch (e) {
    // ignore
  }

  return parent.createFolder(companyName).getId();
}

function listCustomers() {
  const sheet = getCustomersSheet_();
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  const header = values[0] || [];
  const idx = {
    kundeId: header.indexOf('kundeId'),
    companyName: header.indexOf('companyName'),
    folderId: header.indexOf('folderId'),
    parentFolderId: header.indexOf('parentFolderId'),
    logoFileId: header.indexOf('logoFileId'),
    logoUrl: header.indexOf('logoUrl'),
    createdAt: header.indexOf('createdAt'),
    updatedAt: header.indexOf('updatedAt')
  };

  const hasHeader = idx.kundeId >= 0 && idx.companyName >= 0;
  const out = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const kundeId = hasHeader ? row[idx.kundeId] : row[0];
    const companyName = hasHeader ? row[idx.companyName] : row[1];
    if (!kundeId || !companyName) continue;

    const folderId = hasHeader ? row[idx.folderId] : row[2];
    const parentFolderId = hasHeader ? row[idx.parentFolderId] : row[3];
    const logoFileId = hasHeader ? row[idx.logoFileId] : row[4];
    const logoUrl = hasHeader ? row[idx.logoUrl] : row[5];
    const createdAt = hasHeader ? row[idx.createdAt] : row[6];
    const updatedAt = hasHeader ? row[idx.updatedAt] : row[7];

    out.push({
      kundeId: String(kundeId),
      companyName: String(companyName),
      folderId: folderId ? String(folderId) : '',
      folderUrl: folderId ? folderUrlFromId_(folderId) : '',
      parentFolderId: parentFolderId ? String(parentFolderId) : '',
      logoFileId: logoFileId ? String(logoFileId) : '',
      logoUrl: logoUrl ? String(logoUrl) : '',
      createdAt: createdAt || '',
      updatedAt: updatedAt || ''
    });
  }

  out.sort(function (a, b) {
    return String(a.companyName || '').localeCompare(String(b.companyName || ''));
  });

  return out;
}

function getCustomer(kundeId) {
  const id = normalizeString_(kundeId);
  if (!id) throw new Error('kundeId fehlt');

  const sheet = getCustomersSheet_();
  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) throw new Error('Customer not found');

  const header = values[0] || [];
  const idx = {
    kundeId: header.indexOf('kundeId'),
    companyName: header.indexOf('companyName'),
    folderId: header.indexOf('folderId'),
    parentFolderId: header.indexOf('parentFolderId'),
    logoFileId: header.indexOf('logoFileId'),
    logoUrl: header.indexOf('logoUrl'),
    createdAt: header.indexOf('createdAt'),
    updatedAt: header.indexOf('updatedAt')
  };
  const hasHeader = idx.kundeId >= 0 && idx.companyName >= 0;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowId = hasHeader ? row[idx.kundeId] : row[0];
    if (String(rowId) !== String(id)) continue;

    const companyName = hasHeader ? row[idx.companyName] : row[1];
    const folderId = hasHeader ? row[idx.folderId] : row[2];
    const parentFolderId = hasHeader ? row[idx.parentFolderId] : row[3];
    const logoFileId = hasHeader ? row[idx.logoFileId] : row[4];
    const logoUrl = hasHeader ? row[idx.logoUrl] : row[5];
    const createdAt = hasHeader ? row[idx.createdAt] : row[6];
    const updatedAt = hasHeader ? row[idx.updatedAt] : row[7];

    return {
      kundeId: String(rowId),
      companyName: companyName ? String(companyName) : '',
      folderId: folderId ? String(folderId) : '',
      folderUrl: folderId ? folderUrlFromId_(folderId) : '',
      parentFolderId: parentFolderId ? String(parentFolderId) : '',
      logoFileId: logoFileId ? String(logoFileId) : '',
      logoUrl: logoUrl ? String(logoUrl) : '',
      createdAt: createdAt || '',
      updatedAt: updatedAt || ''
    };
  }

  throw new Error('Customer not found: ' + id);
}

function createCustomer(companyName, parentFolderId) {
  const name = normalizeString_(companyName);
  if (!name) throw new Error('companyName fehlt');

  const sheet = getCustomersSheet_();
  const now = new Date().toISOString();

  const kundeId = nextKundeId_();
  const folderId = ensureCustomerFolder_(name, parentFolderId);

  const customer = {
    kundeId: kundeId,
    companyName: name,
    folderId: folderId,
    folderUrl: folderUrlFromId_(folderId),
    parentFolderId: normalizeString_(parentFolderId) || '',
    logoFileId: '',
    logoUrl: '',
    createdAt: now,
    updatedAt: now
  };

  sheet.appendRow([
    customer.kundeId,
    customer.companyName,
    customer.folderId,
    customer.parentFolderId,
    customer.logoFileId,
    customer.logoUrl,
    customer.createdAt,
    customer.updatedAt
  ]);

  return customer;
}

function parseDataUrlToBlob_(dataUrl, defaultName) {
  const s = normalizeString_(dataUrl);
  if (!s) throw new Error('logoBlob ist leer');

  // Typical: data:image/png;base64,AAAA
  const m = s.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) {
    throw new Error('logoBlob muss ein Data-URL String sein (data:<mime>;base64,...)');
  }

  const mimeType = m[1];
  const b64 = m[2];
  const bytes = Utilities.base64Decode(b64);

  let ext = '';
  if (mimeType === 'image/png') ext = 'png';
  else if (mimeType === 'image/jpeg') ext = 'jpg';
  else if (mimeType === 'image/svg+xml') ext = 'svg';

  const filename = (defaultName || 'logo') + (ext ? '.' + ext : '');
  return Utilities.newBlob(bytes, mimeType, filename);
}

function uploadCustomerLogo(kundeId, logoBlob) {
  const customer = getCustomer(kundeId);
  if (!customer.folderId) throw new Error('Customer hat keine folderId');

  const blob = parseDataUrlToBlob_(logoBlob, 'logo');

  const folder = DriveApp.getFolderById(customer.folderId);
  const file = folder.createFile(blob);

  // Optional: keep name stable
  try {
    file.setName('Logo - ' + customer.companyName);
  } catch (e) {
    // ignore
  }

  const fileId = file.getId();
  const logoUrl = fileViewUrlFromId_(fileId);

  // Update customer row
  const sheet = getCustomersSheet_();
  const values = sheet.getDataRange().getValues();
  const header = values[0] || [];
  const idx = {
    kundeId: header.indexOf('kundeId'),
    logoFileId: header.indexOf('logoFileId'),
    logoUrl: header.indexOf('logoUrl'),
    updatedAt: header.indexOf('updatedAt')
  };
  const hasHeader = idx.kundeId >= 0;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowId = hasHeader ? row[idx.kundeId] : row[0];
    if (String(rowId) !== String(kundeId)) continue;

    const rowNumber = r + 1;
    const now = new Date().toISOString();

    if (hasHeader) {
      if (idx.logoFileId >= 0) sheet.getRange(rowNumber, idx.logoFileId + 1).setValue(fileId);
      if (idx.logoUrl >= 0) sheet.getRange(rowNumber, idx.logoUrl + 1).setValue(logoUrl);
      if (idx.updatedAt >= 0) sheet.getRange(rowNumber, idx.updatedAt + 1).setValue(now);
    } else {
      // legacy positions
      sheet.getRange(rowNumber, 5).setValue(fileId);
      sheet.getRange(rowNumber, 6).setValue(logoUrl);
      sheet.getRange(rowNumber, 8).setValue(now);
    }

    break;
  }

  return logoUrl;
}
