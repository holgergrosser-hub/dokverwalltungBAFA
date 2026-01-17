/**
 * DOCUMENT CONFIGS (COPY & PASTE)
 *
 * Provides the business functions required by apps-script/Code.js:
 * - listDocumentConfigs
 * - getDocumentConfig
 * - createAllDocumentsForCustomer (basic BAFA-only implementation)
 */

// COPY_MARKER_UPDATED_AT: 2026-01-17 12:35:02

function listDocumentConfigs() {
  if (typeof BAFA_CONFIGS_ !== 'undefined') {
    return Object.keys(BAFA_CONFIGS_).map(function (k) {
      return BAFA_CONFIGS_[k];
    });
  }
  return [];
}

function getDocumentConfig(configId) {
  const id = String(configId || '');
  if (!id) throw new Error('configId fehlt');

  if (typeof BAFA_CONFIGS_ !== 'undefined' && BAFA_CONFIGS_[id]) {
    return BAFA_CONFIGS_[id];
  }

  throw new Error('Config not found: ' + id);
}

function createAllDocumentsForCustomer(kundeId) {
  if (!kundeId) throw new Error('kundeId fehlt');

  const configs = listDocumentConfigs();
  const created = [];
  const failed = [];

  configs.forEach(function (cfg) {
    try {
      // Only create configs that have templates.
      if (!cfg || !cfg.id || !cfg.templateId) return;

      // Prefer BAFA v2 implementation if present.
      if (typeof processBafaDocumentForCustomer === 'function' && String(cfg.id).indexOf('bafa_') === 0) {
        const res = processBafaDocumentForCustomer(kundeId, cfg.id, { placeholders: {}, tables: {}, options: { unresolvedTokensPolicy: 'keep' } });
        created.push({ configId: cfg.id, googleDocId: res.googleDocId, docUrl: res.docUrl });
      }
    } catch (e) {
      failed.push({ configId: cfg && cfg.id ? cfg.id : '', error: e && e.message ? e.message : String(e) });
    }
  });

  return {
    success: failed.length === 0,
    kundeId: String(kundeId),
    createdCount: created.length,
    failedCount: failed.length,
    created: created,
    failed: failed
  };
}
