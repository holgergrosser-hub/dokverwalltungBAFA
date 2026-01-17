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

function applyDocReplacements_(docId, placeholders, tables) {
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();

  // Replace scalar placeholders {{KEY}}
  Object.keys(placeholders || {}).forEach(function (key) {
    const value = placeholders[key];
    const needle = '{{' + key + '}}';
    body.replaceText(escapeForRegex_(needle), value === null || value === undefined ? '' : String(value));
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

  const folderId = getCustomerFolderIdForDocs_(kundeId);
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const docName = cfg.name + ' - ' + kundeId + ' - ' + ts;

  const copied = makeCopy_(cfg.templateId, docName, folderId);
  const copiedId = copied.getId();
  const url = copied.getUrl();

  if (cfg.templateType === 'doc') {
    applyDocReplacements_(copiedId, structured.placeholders, structured.tables);
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
