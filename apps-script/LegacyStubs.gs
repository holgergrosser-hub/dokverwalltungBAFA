/**
 * LEGACY STUBS (COPY & PASTE)
 *
 * Some older UI parts may call legacy endpoints with string/array input.
 * The current project focuses on BAFA v2 structured payloads.
 *
 * These stubs prevent "is not defined" crashes and return a clear error.
 */

// COPY_MARKER_UPDATED_AT: 2026-01-17 12:35:02

function processDocumentForCustomer(kundeId, configId, inputData) {
  throw new Error(
    'Legacy processDocumentForCustomer ist in diesem Projekt nicht implementiert. ' +
      'Nutze BAFA v2 (structured inputData) oder füge den Legacy DocumentProcessor hinzu.'
  );
}

function updateExistingDocument(googleDocId, configId, inputData, mode) {
  throw new Error(
    'Legacy updateExistingDocument ist in diesem Projekt nicht implementiert. ' +
      'Nutze BAFA v2 (structured inputData) oder füge den Legacy DocumentProcessor hinzu.'
  );
}
