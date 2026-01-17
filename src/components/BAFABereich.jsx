import React, { useEffect, useMemo, useState } from 'react';
import { createBafaApi } from '../api/bafaApi';
import { BAFA_CONFIGS } from '../configs/bafa-configs';
import { resolveFirmendatenSource } from '../utils/resolveFirmendatenSource';

function buildTemplateUrl(config) {
  if (!config?.docId) return '';
  const templateType = config.templateType || 'doc';
  return templateType === 'sheet'
    ? `https://docs.google.com/spreadsheets/d/${config.docId}/edit`
    : `https://docs.google.com/document/d/${config.docId}/edit`;
}

function parseLines(rawText) {
  if (!rawText) return [];
  return String(rawText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatTodayForDateInput() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildDocUrlFromRecord(doc) {
  if (!doc) return '';
  if (doc.docUrl) return doc.docUrl;
  if (!doc.googleDocId) return '';
  const isSheet = String(doc.templateType || '').toLowerCase() === 'sheet';
  return isSheet
    ? `https://docs.google.com/spreadsheets/d/${doc.googleDocId}/edit`
    : `https://docs.google.com/document/d/${doc.googleDocId}/edit`;
}

/**
 * BAFA Bereich (14 Dokumente)
 * - Form wird aus src/configs/bafa-configs.js generiert
 * - sendet inputData strukturiert an das Backend (placeholders + tables)
 */
function BAFABereich({ kunde, api: apiProp, firmendatenReloadKey = 0 }) {
  const api = useMemo(() => apiProp ?? createBafaApi(), [apiProp]);

  const [selectedKey, setSelectedKey] = useState('');
  const [placeholderData, setPlaceholderData] = useState({});
  const [tableData, setTableData] = useState({});
  const [firmendaten, setFirmendaten] = useState(null);
  const [loadingFirmendaten, setLoadingFirmendaten] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [customerDocuments, setCustomerDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [formMode, setFormMode] = useState('create'); // create | update
  const [selectedDocument, setSelectedDocument] = useState(null);

  const configKeyById = useMemo(() => {
    const map = {};
    Object.keys(BAFA_CONFIGS).forEach((k) => {
      const id = BAFA_CONFIGS[k]?.id;
      if (id) map[id] = k;
    });
    return map;
  }, []);

  const config = selectedKey ? BAFA_CONFIGS[selectedKey] : null;

  useEffect(() => {
    setSelectedKey('');
    setPlaceholderData({});
    setTableData({});
    setError(null);
    setSuccess(null);
    setFirmendaten(null);
    setCustomerDocuments([]);
    setSelectedDocument(null);
    setFormMode('create');
  }, [kunde?.kundeId]);

  const loadCustomerDocuments = async () => {
    if (!kunde?.kundeId) return;
    setLoadingDocs(true);
    try {
      const data = await api.listCustomerDocuments(kunde.kundeId);
      const docs = data?.documents ?? [];
      setCustomerDocuments(Array.isArray(docs) ? docs : []);
    } catch (e) {
      // Listing is nice-to-have; don't block document creation.
      setCustomerDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadCustomerDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunde?.kundeId]);

  useEffect(() => {
    let cancelled = false;

    async function loadFirmendaten() {
      if (!kunde?.kundeId) return;
      if (!config) return;

      const needsFirmendaten = (config.placeholders || []).some(
        (p) => p?.source && String(p.source).startsWith('firmendaten.')
      );
      if (!needsFirmendaten) return;

      setLoadingFirmendaten(true);
      setError(null);
      try {
        const data = await api.getFirmendaten(kunde.kundeId);
        const loaded =
          data?.firmendaten ??
          data?.data?.firmendaten ??
          (data?.success && typeof data?.firmendaten === 'object' ? data.firmendaten : null) ??
          {};

        if (!cancelled) {
          setFirmendaten(loaded || {});
        }
      } catch (e) {
        if (!cancelled) {
          setFirmendaten(null);
          setError(e?.message || String(e));
        }
      } finally {
        if (!cancelled) setLoadingFirmendaten(false);
      }
    }

    loadFirmendaten();

    return () => {
      cancelled = true;
    };
  }, [api, kunde?.kundeId, config?.id, firmendatenReloadKey]);

  // Prefill placeholderData from firmendaten sources
  useEffect(() => {
    if (!config) return;
    if (!kunde?.kundeId) return;

    const next = { ...placeholderData };
    let changed = false;

    for (const field of config.placeholders || []) {
      if (!field?.source) continue;
      if (next[field.key]) continue; // do not overwrite user input

      const value = resolveFirmendatenSource(field.source, { kunde, firmendaten });
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        next[field.key] = String(value);
        changed = true;
      }
    }

    if (changed) {
      setPlaceholderData(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmendaten, config?.id]);

  // Prefill "today" defaults for date fields (best effort)
  useEffect(() => {
    if (!config) return;
    const next = { ...placeholderData };
    let changed = false;

    for (const field of config.placeholders || []) {
      if (!field?.autoToday) continue;
      if (String(next[field.key] || '').trim()) continue;
      if ((field.type || 'text') !== 'date') continue;
      next[field.key] = formatTodayForDateInput();
      changed = true;
    }

    if (changed) {
      setPlaceholderData(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id]);

  const handlePlaceholderChange = (key, value) => {
    setPlaceholderData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTableChange = (tableName, value) => {
    setTableData((prev) => ({
      ...prev,
      [tableName]: value
    }));
  };

  const handleCreate = async () => {
    if (!kunde?.kundeId) {
      setError('Bitte zuerst einen Kunden auswählen');
      return;
    }

    if (!config) {
      setError('Bitte wählen Sie einen Dokumenttyp');
      return;
    }

    // Pflichtfelder prüfen
    const missingFields = (config.placeholders || [])
      .filter((field) => field.required && !String(placeholderData[field.key] || '').trim())
      .map((field) => field.label);

    if (missingFields.length > 0) {
      setError('Bitte füllen Sie alle Pflichtfelder aus: ' + missingFields.join(', '));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const inputData = {
        placeholders: { ...placeholderData },
        tables: {}
      };

      for (const table of config.tables || []) {
        inputData.tables[table.name] = parseLines(tableData[table.name]);
      }

      const result =
        formMode === 'update' && selectedDocument?.googleDocId
          ? await api.updateExistingDocument(
              selectedDocument.googleDocId,
              config.id,
              inputData,
              'append'
            )
          : await api.processDocumentForCustomer(kunde.kundeId, config.id, inputData);

      if (result?.success === false) {
        throw new Error(result?.message || 'Fehler beim Erstellen');
      }

      // Wenn Backend docUrl liefert, öffnen
      const docUrl = result?.docUrl || result?.url || null;
      if (docUrl) {
        window.open(docUrl, '_blank');
      }

      // If unresolved placeholders remain, ask before removing.
      const unresolved = Array.isArray(result?.unresolvedTokens) ? result.unresolvedTokens : [];
      if (unresolved.length > 0) {
        const maxShow = 20;
        const preview = unresolved.slice(0, maxShow).join('\n');
        const more = unresolved.length > maxShow ? `\n… (+${unresolved.length - maxShow} weitere)` : '';

        const ok = window.confirm(
          `Im Dokument sind noch Platzhalter enthalten:\n\n${preview}${more}\n\nOK = Platzhalter entfernen\nAbbrechen = Eingaben nachtragen (Platzhalter bleiben im Dokument)`
        );

        if (ok) {
          const docId = result?.googleDocId || selectedDocument?.googleDocId;
          if (docId) {
            await api.updateExistingDocument(
              docId,
              config.id,
              {
                options: {
                  cleanupOnly: true,
                  unresolvedTokensPolicy: 'remove'
                }
              },
              'cleanupOnly'
            );
          }
        }
      }

      setSuccess(
        formMode === 'update'
          ? 'Dokument wurde aktualisiert.'
          : 'Dokument wurde erstellt.'
      );

      setPlaceholderData({});
      setTableData({});
      setSelectedDocument(null);
      setFormMode('create');
      await loadCustomerDocuments();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (!kunde?.kundeId) {
    return (
      <div className="bereich">
        <h2>🏢 BAFA Dokumente</h2>
        <div className="info-box warning">Bitte zuerst einen Kunden auswählen.</div>
      </div>
    );
  }

  return (
    <div className="bereich">
      <h2>🏢 BAFA Dokumente</h2>
      <p className="description">
        Erstellen Sie BAFA-Förderantrag Dokumente für: <strong>{kunde.companyName}</strong>
      </p>

      <div className="info-box">
        <p>
          📋 <strong>{Object.keys(BAFA_CONFIGS).length} BAFA-Dokumenttypen</strong> verfügbar
        </p>
        <p>ℹ️ Vorlagen: Google Docs / Sheets</p>
      </div>

      {error && <div className="info-box error">❌ {error}</div>}
      {success && <div className="info-box">✅ {success}</div>}

      <div className="info-box" style={{ marginTop: 12 }}>
        <p>
          <strong>Sehen / Bearbeiten</strong>
        </p>
        {loadingDocs ? (
          <p>Dokumente werden geladen…</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Dokument</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(BAFA_CONFIGS).map((key) => {
                  const c = BAFA_CONFIGS[key];
                  const doc = customerDocuments.find((d) => String(d?.configId) === String(c?.id));
                  const canEdit = !!doc && String(c?.templateType || 'doc') !== 'sheet';
                  return (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{doc ? '✅ Vorhanden' : '❌ Fehlt'}</td>
                      <td>
                        {doc ? (
                          <>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                const url = buildDocUrlFromRecord(doc);
                                if (url) window.open(url, '_blank');
                              }}
                            >
                              Öffnen
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={!canEdit}
                              title={!canEdit ? 'Bearbeiten aktuell nur für Google Docs' : ''}
                              onClick={() => {
                                setError(null);
                                setSuccess(null);
                                setFormMode('update');
                                setSelectedDocument(doc);
                                setSelectedKey(configKeyById[c.id] || key);
                                setPlaceholderData({});
                                setTableData({});
                              }}
                            >
                              Bearbeiten
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setError(null);
                              setSuccess(null);
                              setFormMode('create');
                              setSelectedDocument(null);
                              setSelectedKey(key);
                              setPlaceholderData({});
                              setTableData({});
                            }}
                          >
                            Erstellen
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Dokumenttyp wählen:</label>
        <select
          value={selectedKey}
          onChange={(e) => {
            setSelectedKey(e.target.value);
            setPlaceholderData({});
            setTableData({});
            setError(null);
          }}
          className="select-large"
        >
          <option value="">-- Bitte wählen --</option>
          {Object.keys(BAFA_CONFIGS).map((key) => {
            const doc = BAFA_CONFIGS[key];
            return (
              <option key={key} value={key} disabled={!doc.docId && key !== 'prozess'}>
                {doc.name}
                {doc.note ? ' ⚠️' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {config && (
        <div className="document-form">
          <h3>
            {formMode === 'update' ? '✏️ ' : '➕ '}
            {config.name}
          </h3>
          <p className="description">{config.description}</p>

          {formMode === 'update' && selectedDocument?.googleDocId && (
            <div className="info-box">
              <p>
                <strong>Aktualisiere bestehendes Dokument:</strong>{' '}
                {selectedDocument.documentName || selectedDocument.googleDocId}
              </p>
              <p>
                <a
                  href={buildDocUrlFromRecord(selectedDocument)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  In Google öffnen →
                </a>
              </p>
            </div>
          )}

          {config.note && <div className="info-box warning">⚠️ {config.note}</div>}

          {loadingFirmendaten && (
            <div className="info-box">Firmendaten werden geladen (Auto-Fill)…</div>
          )}

          {buildTemplateUrl(config) && (
            <div className="info-box">
              <p>
                📄 <strong>Vorlage:</strong>{' '}
                <a href={buildTemplateUrl(config)} target="_blank" rel="noopener noreferrer">
                  In Google öffnen →
                </a>
              </p>
            </div>
          )}

          {config.placeholders?.length > 0 && (
            <div className="form-section">
              <h4>📝 Platzhalter</h4>
              {config.placeholders.map((field) => (
                <div key={field.key} className="form-group">
                  <label>
                    {field.label}
                    {field.required && <span className="required">*</span>}
                    {field.source && <span className="hint">(aus Firmendaten)</span>}
                  </label>
                  {String(field.type || '').toLowerCase() === 'textarea' ? (
                    <textarea
                      value={placeholderData[field.key] || ''}
                      onChange={(e) => handlePlaceholderChange(field.key, e.target.value)}
                      placeholder={field.label}
                      required={field.required}
                      rows={field.rows || 4}
                      className="textarea-large"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={placeholderData[field.key] || ''}
                      onChange={(e) => handlePlaceholderChange(field.key, e.target.value)}
                      placeholder={field.label}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {config.tables?.length > 0 && (
            <div className="form-section">
              <h4>📊 Tabellen</h4>
              {config.tables.map((table) => (
                <div key={table.name} className="form-group">
                  <label>
                    {table.title}
                    <span className="hint">(ein Eintrag pro Zeile)</span>
                  </label>
                  <textarea
                    value={tableData[table.name] || ''}
                    onChange={(e) => handleTableChange(table.name, e.target.value)}
                    rows={5}
                    placeholder={table.inputPlaceholder}
                    className="textarea-large"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button onClick={handleCreate} disabled={loading} className="btn-primary">
              {loading
                ? formMode === 'update'
                  ? 'Aktualisiere…'
                  : 'Erstelle Dokument…'
                : formMode === 'update'
                  ? '💾 BAFA-Dokument aktualisieren'
                  : '📄 BAFA-Dokument erstellen'}
            </button>
            {formMode === 'update' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFormMode('create');
                  setSelectedDocument(null);
                  setError(null);
                  setSuccess(null);
                }}
                style={{ marginLeft: 8 }}
              >
                Abbrechen
              </button>
            )}
          </div>

          <div className="info-box" style={{ marginTop: 16 }}>
            <p>
              <strong>Hinweis:</strong> Wenn das Backend die neue configId noch nicht kennt,
              muss es im Apps Script ergänzt werden.
            </p>
          </div>
        </div>
      )}

      {!selectedKey && (
        <div className="info-box">
          <p>👆 Wählen Sie einen Dokumenttyp aus der Liste oben.</p>
        </div>
      )}
    </div>
  );
}

export default BAFABereich;
