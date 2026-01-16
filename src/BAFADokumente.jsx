import React, { useMemo, useState, useEffect } from 'react';
import { createBafaApi } from './api/bafaApi';
import Firmendaten from './Firmendaten';

/**
 * BAFA DOKUMENTE - HAUPTKOMPONENTE
 * Mit Kundenverwaltung, Logo-Upload und Dokument-Tracking
 */

function BAFADokumente() {
  // API Config
  const API_URL = import.meta.env.VITE_API_URL;
  const API_PASSWORD = import.meta.env.VITE_API_PASSWORD;
  const API_TRANSPORT = import.meta.env.VITE_API_TRANSPORT;

  const apiConfigError = useMemo(() => {
    if (!API_URL) return 'API nicht konfiguriert: VITE_API_URL fehlt.';
    if (API_URL.includes('script.google.com/macros/') && !API_PASSWORD) {
      return 'API nicht konfiguriert: VITE_API_PASSWORD fehlt (bei direktem Apps-Script Call).';
    }
    return null;
  }, [API_URL, API_PASSWORD]);

  const api = useMemo(() => {
    if (apiConfigError) return null;
    return createBafaApi({ apiUrl: API_URL, apiPassword: API_PASSWORD, transport: API_TRANSPORT });
  }, [API_URL, API_PASSWORD, API_TRANSPORT, apiConfigError]);

  // State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDocuments, setCustomerDocuments] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  
  const [mode, setMode] = useState('overview'); // 'overview', 'create', 'edit'
  const [activeTab, setActiveTab] = useState('dokumente'); // 'dokumente' | 'firmendaten'
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const [inputData, setInputData] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newParentFolderId, setNewParentFolderId] = useState('');

  // Laden beim Start
  useEffect(() => {
    if (apiConfigError) {
      setError(apiConfigError);
      return;
    }
    loadCustomers();
    loadConfigs();
  }, [apiConfigError]);

  // ==========================================
  // API CALLS
  // (Transport: FormData oder JSON wird im API-Client entschieden)
  // ==========================================

  const loadCustomers = async () => {
    try {
      if (!api) return [];
      const data = await api.listCustomers();
      const list = data.customers || [];
      setCustomers(list);
      return list;
    } catch (err) {
      console.error('Fehler beim Laden der Kunden:', err);
      return [];
    }
  };

  const loadConfigs = async () => {
    try {
      if (!api) return [];
      const data = await api.listConfigs();
      const list = data.configs || [];
      setConfigs(list);
      return list;
    } catch (err) {
      console.error('Fehler beim Laden der Configs:', err);
      return [];
    }
  };

  const loadCustomerDocuments = async (kundeId) => {
    try {
      if (!api) return;
      const data = await api.listCustomerDocuments(kundeId);
      if (data.documents) {
        setCustomerDocuments(data.documents);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Dokumente:', err);
    }
  };

  const uploadLogo = async (kundeId, logoBlob) => {
    try {
      if (!api) throw new Error('API nicht konfiguriert');
      const data = await api.uploadLogo(kundeId, logoBlob);
      
      if (data.statusCode === 200) {
        // Kunden neu laden um Logo-URL zu aktualisieren
        const refreshedCustomers = await loadCustomers();
        
        // Selektierten Kunden aktualisieren
        const updatedCustomer = refreshedCustomers.find(c => c.kundeId === kundeId);
        if (updatedCustomer) {
          updatedCustomer.logoUrl = data.logoUrl;
          setSelectedCustomer({...updatedCustomer});
        }
        
        return data.logoUrl;
      }
      throw new Error(data.message || 'Logo-Upload fehlgeschlagen');
    } catch (err) {
      console.error('Fehler beim Logo-Upload:', err);
      throw err;
    }
  };

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleSelectCustomer = async (kundeId) => {
    const customer = customers.find(c => c.kundeId === kundeId);
    setSelectedCustomer(customer);
    setActiveTab('dokumente');
    setMode('overview');
    setResult(null);
    setError(null);
    
    if (customer) {
      await loadCustomerDocuments(kundeId);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();

    if (!newCompanyName.trim()) {
      setError('Bitte Firmennamen eingeben');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!api) throw new Error('API nicht konfiguriert');

      const data = await api.createCustomer(
        newCompanyName.trim(),
        newParentFolderId.trim() || undefined
      );

      // Backend responses can differ (e.g. `{ customer: {...} }` vs flat object).
      const created =
        data?.customer ??
        data?.createdCustomer ??
        data?.data?.customer ??
        (data && typeof data === 'object' ? data : null);

      const createdId = created?.kundeId ?? data?.kundeId ?? null;
      const createdName = created?.companyName ?? newCompanyName.trim();

      const refreshedCustomers = await loadCustomers();

      if (createdId) {
        await handleSelectCustomer(createdId);
      } else if (createdName && Array.isArray(refreshedCustomers)) {
        const matches = refreshedCustomers.filter(
          (c) => (c?.companyName || '').toLowerCase() === createdName.toLowerCase()
        );
        const bestMatch = matches[matches.length - 1];
        if (bestMatch?.kundeId) {
          await handleSelectCustomer(bestMatch.kundeId);
        }
      }

      setNewCompanyName('');
      setNewParentFolderId('');
      setResult({ message: `Kunde erstellt: ${created?.companyName || createdName || ''}` });
    } catch (err) {
      setError('Kunde erstellen fehlgeschlagen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    
    if (!logoFile || !selectedCustomer) {
      setError('Bitte Kunde und Logo-Datei auswählen');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const logoUrl = await uploadLogo(selectedCustomer.kundeId, event.target.result);
          setResult({ message: `Logo erfolgreich hochgeladen!`, logoUrl });
          setLogoFile(null);
        } catch (err) {
          setError('Logo-Upload fehlgeschlagen: ' + err.message);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(logoFile);
    } catch (err) {
      setError('Fehler beim Lesen der Datei: ' + err.message);
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomer || !selectedConfig || !inputData) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      if (!api) throw new Error('API nicht konfiguriert');
      const data = await api.processDocumentForCustomer(
        selectedCustomer.kundeId,
        selectedConfig.id,
        inputData.split('\n')
      );
      
      if (data.statusCode === 200) {
        setResult(data);
        setInputData('');
        await loadCustomerDocuments(selectedCustomer.kundeId);
        setMode('overview');
      } else {
        setError(data.message || 'Fehler beim Erstellen');
      }
    } catch (err) {
      setError('Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    
    if (!selectedDocument || !inputData) {
      setError('Bitte Daten eingeben');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      if (!api) throw new Error('API nicht konfiguriert');
      const data = await api.updateExistingDocument(
        selectedDocument.googleDocId,
        selectedDocument.configId,
        inputData.split('\n'),
        'append'
      );
      
      if (data.statusCode === 200) {
        setResult(data);
        setInputData('');
        await loadCustomerDocuments(selectedCustomer.kundeId);
        setMode('overview');
      } else {
        setError(data.message || 'Fehler beim Aktualisieren');
      }
    } catch (err) {
      setError('Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (apiConfigError) {
    return (
      <div style={styles.container}>
        <div style={styles.configError}>
          <h3>⚠️ Konfiguration fehlt</h3>
          <p>{apiConfigError}</p>
          <p style={{ marginTop: 8, marginBottom: 8 }}>Empfohlen (sicher, ohne Passwort im Browser):</p>
          <ul style={{ marginTop: 0 }}>
            <li><code>VITE_API_URL=/.netlify/functions/bafa</code></li>
            <li><code>VITE_API_TRANSPORT=json</code></li>
            <li>
              Netlify (server-side): <code>BAFA_API_URL</code> und <code>BAFA_API_PASSWORD</code>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📄 BAFA Dokumente</h1>
        <p style={styles.subtitle}>Automatische Dokumentenerstellung für BAFA-Beratungen</p>
      </div>

      {/* Kundenauswahl */}
      <div style={styles.card}>
        <label style={styles.label}>🏢 Kunde auswählen:</label>
        <select
          style={styles.select}
          value={selectedCustomer?.kundeId || ''}
          onChange={(e) => handleSelectCustomer(e.target.value)}
        >
          <option value="">-- Bitte Kunde wählen --</option>
          {customers.map(c => (
            <option key={c.kundeId} value={c.kundeId}>
              {c.companyName} ({c.kundeId})
            </option>
          ))}
        </select>
      </div>

      {/* Kunde anlegen */}
      <div style={styles.card}>
        <h3>Neuen Kunden anlegen</h3>
        <form onSubmit={handleCreateCustomer}>
          <div style={styles.section}>
            <label style={styles.label}>Firmenname:</label>
            <input
              style={styles.input}
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="z.B. Muster GmbH"
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Parent Folder ID (optional):</label>
            <input
              style={styles.input}
              value={newParentFolderId}
              onChange={(e) => setNewParentFolderId(e.target.value)}
              placeholder="Google Drive Folder ID"
            />
          </div>

          <button
            type="submit"
            disabled={!newCompanyName.trim() || loading}
            style={newCompanyName.trim() && !loading ? styles.button : styles.buttonDisabled}
          >
            {loading ? 'Wird erstellt...' : 'Kunden erstellen'}
          </button>
        </form>
      </div>

      {/* Kunde ausgewählt */}
      {selectedCustomer && (
        <>
          {/* Kunden-Info & Logo */}
          <div style={styles.card}>
            <div style={styles.customerInfo}>
              <div>
                <h3 style={styles.customerName}>{selectedCustomer.companyName}</h3>
                <p style={styles.customerDetail}>Kunde-ID: {selectedCustomer.kundeId}</p>
                <p style={styles.customerDetail}>Status: {selectedCustomer.status}</p>
                <p style={styles.customerDetail}>
                  Ordner: <a 
                    href={`https://drive.google.com/drive/folders/${selectedCustomer.folderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    📁 In Drive öffnen
                  </a>
                </p>
              </div>
              
              {/* Logo-Anzeige */}
              <div style={styles.logoSection}>
                {selectedCustomer.logoUrl ? (
                  <img 
                    src={selectedCustomer.logoUrl} 
                    alt="Firmenlogo"
                    style={styles.logoImage}
                  />
                ) : (
                  <div style={styles.noLogo}>Kein Logo</div>
                )}
                
                {/* Logo-Upload */}
                <div style={styles.logoUpload}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    style={styles.fileInput}
                  />
                  <button
                    onClick={handleLogoUpload}
                    disabled={!logoFile || loading}
                    style={logoFile && !loading ? styles.buttonSmall : styles.buttonSmallDisabled}
                  >
                    Logo hochladen
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={styles.card}>
            <div className="tabs">
              <button
                type="button"
                className={activeTab === 'dokumente' ? 'active' : ''}
                onClick={() => setActiveTab('dokumente')}
              >
                Dokumente
              </button>
              <button
                type="button"
                className={activeTab === 'firmendaten' ? 'active' : ''}
                onClick={() => setActiveTab('firmendaten')}
              >
                Firmendaten
              </button>
            </div>
          </div>

          {activeTab === 'firmendaten' && <Firmendaten kunde={selectedCustomer} api={api} />}

          {activeTab === 'dokumente' && (
            <>
              {/* Batch: Alle Dokumente erstellen */}
              <div style={styles.card}>
                <button
                  onClick={async () => {
                    if (!selectedCustomer) return;
                    setLoading(true);
                    setError(null);
                    setResult(null);

                    try {
                      if (!api) throw new Error('API nicht konfiguriert');
                      const data = await api.createAllDocumentsForCustomer(selectedCustomer.kundeId);
                      setResult(data);
                      await loadCustomerDocuments(selectedCustomer.kundeId);
                    } catch (err) {
                      setError('Batch-Erstellung fehlgeschlagen: ' + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  style={!loading ? styles.button : styles.buttonDisabled}
                >
                  {loading ? 'Wird ausgeführt...' : 'Alle Dokumente für den Kunden erstellen'}
                </button>
              </div>

              {/* Modus-Auswahl */}
              <div style={styles.card}>
                <div style={styles.modeButtons}>
                  <button
                    onClick={() => setMode('overview')}
                    style={mode === 'overview' ? styles.modeButtonActive : styles.modeButton}
                  >
                    📊 Übersicht
                  </button>
                  <button
                    onClick={() => {
                      setMode('create');
                      setSelectedConfig(null);
                      setInputData('');
                    }}
                    style={mode === 'create' ? styles.modeButtonActive : styles.modeButton}
                  >
                    ➕ Neues Dokument
                  </button>
                </div>
              </div>

              {/* ÜBERSICHT-MODUS */}
              {mode === 'overview' && (
                <div style={styles.card}>
                  <h3>📋 Dokument-Übersicht</h3>

                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Dokumenttyp</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Erstellt</th>
                        <th style={styles.th}>Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((config) => {
                        const doc = customerDocuments.find((d) => d.configId === config.id);
                        return (
                          <tr key={config.id}>
                            <td style={styles.td}>{config.name}</td>
                            <td style={styles.td}>
                              {doc ? (
                                <span style={styles.statusExists}>✅ Vorhanden</span>
                              ) : (
                                <span style={styles.statusMissing}>❌ Fehlt</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              {doc ? new Date(doc.createdAt).toLocaleDateString('de-DE') : '-'}
                            </td>
                            <td style={styles.td}>
                              {doc ? (
                                <div style={styles.actionButtons}>
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://docs.google.com/document/d/${doc.googleDocId}/edit`,
                                        '_blank'
                                      )
                                    }
                                    style={styles.buttonTiny}
                                  >
                                    Öffnen
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setSelectedConfig(config);
                                      setMode('edit');
                                      setInputData('');
                                    }}
                                    style={styles.buttonTiny}
                                  >
                                    Bearbeiten
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedConfig(config);
                                    setMode('create');
                                    setInputData('');
                                  }}
                                  style={styles.buttonTiny}
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

              {/* ERSTELLEN-MODUS */}
              {mode === 'create' && (
                <div style={styles.card}>
                  <h3>➕ Neues Dokument erstellen</h3>

                  <form onSubmit={handleCreateDocument}>
                    <div style={styles.section}>
                      <label style={styles.label}>Dokumenttyp:</label>
                      <select
                        style={styles.select}
                        value={selectedConfig?.id || ''}
                        onChange={(e) => {
                          const config = configs.find((c) => c.id === e.target.value);
                          setSelectedConfig(config);
                        }}
                      >
                        <option value="">-- Typ wählen --</option>
                        {configs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {selectedConfig && <p style={styles.description}>{selectedConfig.description}</p>}
                    </div>

                    {selectedConfig && (
                      <div style={styles.section}>
                        <label style={styles.label}>
                          {selectedConfig.inputLabel || 'Einträge'} (ein Eintrag pro Zeile):
                        </label>
                        <textarea
                          style={styles.textarea}
                          rows="12"
                          placeholder={selectedConfig.inputPlaceholder || 'Eintrag 1\nEintrag 2\n...'}
                          value={inputData}
                          onChange={(e) => setInputData(e.target.value)}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!selectedConfig || !inputData || loading}
                      style={
                        selectedConfig && inputData && !loading ? styles.button : styles.buttonDisabled
                      }
                    >
                      {loading ? '⏳ Wird erstellt...' : '🚀 Dokument erstellen'}
                    </button>
                  </form>
                </div>
              )}

              {/* BEARBEITEN-MODUS */}
              {mode === 'edit' && selectedDocument && (
                <div style={styles.card}>
                  <h3>✏️ Dokument bearbeiten</h3>
                  <p style={styles.editInfo}>
                    Dokument: <strong>{selectedDocument.documentName}</strong>
                    <br />
                    Erstellt: {new Date(selectedDocument.createdAt).toLocaleDateString('de-DE')}
                    <br />
                    <a
                      href={`https://docs.google.com/document/d/${selectedDocument.googleDocId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.link}
                    >
                      📄 In Google Docs öffnen
                    </a>
                  </p>

                  <form onSubmit={handleUpdateDocument}>
                    <div style={styles.section}>
                      <label style={styles.label}>Neue Einträge hinzufügen (ein Eintrag pro Zeile):</label>
                      <textarea
                        style={styles.textarea}
                        rows="10"
                        placeholder="Neue Einträge hier eingeben..."
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                      />
                      <p style={styles.hint}>Die neuen Einträge werden zur bestehenden Tabelle hinzugefügt.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={!inputData || loading}
                      style={inputData && !loading ? styles.button : styles.buttonDisabled}
                    >
                      {loading ? '⏳ Wird aktualisiert...' : '💾 Einträge hinzufügen'}
                    </button>
                  </form>
                </div>
              )}

              {/* Erfolg */}
              {result && (
                <div style={styles.success}>
                  <h3>✅ Erfolg!</h3>
                  <p>{result.message}</p>
                  {result.docUrl && (
                    <a
                      href={result.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.linkButton}
                    >
                      📄 Dokument öffnen
                    </a>
                  )}
                </div>
              )}

              {/* Fehler */}
              {error && (
                <div style={styles.error}>
                  <h3>❌ Fehler</h3>
                  <p>{error}</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p>BAFA Dokumente System v2.3 (Firmendaten)</p>
      </div>
    </div>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#1a1a1a'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  customerInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '30px'
  },
  customerName: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    color: '#1a1a1a'
  },
  customerDetail: {
    margin: '5px 0',
    color: '#666',
    fontSize: '14px'
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  logoImage: {
    maxWidth: '200px',
    maxHeight: '100px',
    objectFit: 'contain',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: 'white'
  },
  noLogo: {
    width: '200px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    color: '#999',
    fontSize: '14px'
  },
  logoUpload: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%'
  },
  fileInput: {
    fontSize: '13px',
    padding: '8px'
  },
  modeButtons: {
    display: 'flex',
    gap: '10px'
  },
  modeButton: {
    flex: 1,
    padding: '12px',
    border: '2px solid #e0e0e0',
    backgroundColor: 'white',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  modeButtonActive: {
    flex: 1,
    padding: '12px',
    border: '2px solid #0066cc',
    backgroundColor: '#e6f2ff',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e0e0e0'
  },
  statusExists: {
    color: '#155724',
    fontWeight: 'bold'
  },
  statusMissing: {
    color: '#721c24',
    fontWeight: 'bold'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  section: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333',
    fontSize: '15px'
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontFamily: 'Monaco, Consolas, monospace',
    lineHeight: '1.6',
    resize: 'vertical'
  },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed'
  },
  buttonSmall: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonSmallDisabled: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed'
  },
  buttonTiny: {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontStyle: 'italic'
  },
  hint: {
    fontSize: '13px',
    color: '#666',
    marginTop: '6px'
  },
  editInfo: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  success: {
    padding: '20px',
    backgroundColor: '#d4edda',
    border: '2px solid #c3e6cb',
    borderRadius: '12px',
    color: '#155724'
  },
  error: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    border: '2px solid #f5c6cb',
    borderRadius: '12px',
    color: '#721c24'
  },
  configError: {
    padding: '24px',
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '12px',
    color: '#856404'
  },
  link: {
    color: '#0066cc',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  linkButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#155724',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '40px',
    padding: '20px',
    color: '#999',
    fontSize: '14px'
  }
};

export default BAFADokumente;
