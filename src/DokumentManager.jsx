import React, { useEffect, useMemo, useState } from 'react';
import { createBafaApi } from './api/bafaApi';
import BAFABereich from './components/BAFABereich';
import Firmendaten from './Firmendaten';

function DokumentManager() {
  const api = useMemo(() => createBafaApi(), []);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [activeTab, setActiveTab] = useState('bafa'); // 'iso' | 'bafa' | 'firmendaten'

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newParentFolderId, setNewParentFolderId] = useState('');

  const [logoFile, setLogoFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listCustomers();
        const list = data?.customers || [];
        if (!cancelled) setCustomers(list);
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [api]);

  const handleSelectCustomer = (kundeId) => {
    const customer = customers.find((c) => c.kundeId === kundeId) || null;
    setSelectedCustomer(customer);
    setError(null);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      setError('Bitte Firmennamen eingeben');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.createCustomer(newCompanyName.trim(), newParentFolderId.trim() || undefined);
      const created = data?.customer ?? data?.createdCustomer ?? data?.data?.customer ?? null;

      const refreshed = await api.listCustomers();
      const list = refreshed?.customers || [];
      setCustomers(list);

      const createdId = created?.kundeId;
      if (createdId) {
        const customer = list.find((c) => c.kundeId === createdId) || null;
        setSelectedCustomer(customer);
      }

      setNewCompanyName('');
      setNewParentFolderId('');
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!selectedCustomer?.kundeId) {
      setError('Bitte zuerst einen Kunden auswählen');
      return;
    }
    if (!logoFile) {
      setError('Bitte eine Logo-Datei auswählen');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await api.uploadLogo(selectedCustomer.kundeId, event.target.result);

          // Refresh customers to get updated logoUrl
          const refreshed = await api.listCustomers();
          const list = refreshed?.customers || [];
          setCustomers(list);
          const updated = list.find((c) => c.kundeId === selectedCustomer.kundeId) || null;
          setSelectedCustomer(updated);
          setLogoFile(null);
        } catch (err) {
          setError(err?.message || String(err));
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(logoFile);
    } catch (e2) {
      setError(e2?.message || String(e2));
      setLoading(false);
    }
  };

  const customerFolderUrl = selectedCustomer?.folderId
    ? `https://drive.google.com/drive/folders/${selectedCustomer.folderId}`
    : '';

  return (
    <div className="dm-container">
      <div className="dm-header">
        <h1>📁 Dokumentenverwaltung</h1>
        <p>ISO 9001 / BAFA / Firmendaten</p>
      </div>

      {error && <div className="dm-alert dm-alert-error">❌ {error}</div>}

      <div className="dm-card">
        <label className="dm-label">🏢 Kunde auswählen:</label>
        <select
          className="dm-select"
          value={selectedCustomer?.kundeId || ''}
          onChange={(e) => handleSelectCustomer(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Bitte Kunde wählen --</option>
          {customers.map((c) => (
            <option key={c.kundeId} value={c.kundeId}>
              {c.companyName} ({c.kundeId})
            </option>
          ))}
        </select>
      </div>

      {selectedCustomer?.kundeId && (
        <div className="dm-card">
          <h3>Ausgewählter Kunde</h3>
          <div className="dm-row" style={{ alignItems: 'center' }}>
            <div className="dm-field">
              <div className="dm-label">Kunde</div>
              <div>
                <strong>{selectedCustomer.companyName}</strong> ({selectedCustomer.kundeId})
              </div>
              {customerFolderUrl && (
                <div style={{ marginTop: 8 }}>
                  Ordner:{' '}
                  <a href={customerFolderUrl} target="_blank" rel="noopener noreferrer">
                    In Drive öffnen
                  </a>
                </div>
              )}
              {selectedCustomer.logoUrl && (
                <div style={{ marginTop: 8 }}>
                  Logo-URL:{' '}
                  <a href={selectedCustomer.logoUrl} target="_blank" rel="noopener noreferrer">
                    anzeigen
                  </a>
                </div>
              )}
            </div>

            <div className="dm-field">
              <div className="dm-label">Logo hochladen</div>
              <form onSubmit={handleLogoUpload} className="dm-form">
                <input
                  className="dm-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  disabled={loading}
                />
                <button className="dm-btn" type="submit" disabled={loading || !logoFile}>
                  {loading ? 'Wird hochgeladen…' : 'Logo hochladen'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="dm-card">
        <h3>Neuen Kunden anlegen</h3>
        <form onSubmit={handleCreateCustomer} className="dm-form">
          <div className="dm-row">
            <div className="dm-field">
              <label className="dm-label">Firmenname</label>
              <input
                className="dm-input"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="z.B. Muster GmbH"
              />
            </div>
            <div className="dm-field">
              <label className="dm-label">Parent Folder ID (optional)</label>
              <input
                className="dm-input"
                value={newParentFolderId}
                onChange={(e) => setNewParentFolderId(e.target.value)}
                placeholder="Google Drive Folder ID"
              />
            </div>
          </div>

          <button className="dm-btn" type="submit" disabled={loading || !newCompanyName.trim()}>
            {loading ? 'Wird erstellt…' : 'Kunden erstellen'}
          </button>
        </form>
      </div>

      <div className="dm-tabs">
        <button
          type="button"
          className={activeTab === 'iso' ? 'active' : ''}
          onClick={() => setActiveTab('iso')}
        >
          ISO 9001
        </button>
        <button
          type="button"
          className={activeTab === 'bafa' ? 'active' : ''}
          onClick={() => setActiveTab('bafa')}
        >
          BAFA
        </button>
        <button
          type="button"
          className={activeTab === 'firmendaten' ? 'active' : ''}
          onClick={() => setActiveTab('firmendaten')}
        >
          Firmendaten
        </button>
      </div>

      <div className="dm-content">
        {activeTab === 'iso' && (
          <div className="dm-card">
            <h2>ISO 9001</h2>
            <div className="dm-alert">
              ISO-Komponente ist im aktuellen Repo noch nicht enthalten.
              Wenn du mir die ISO-Configs/Komponente gibst, baue ich sie analog zum BAFA-Bereich ein.
            </div>
          </div>
        )}

        {activeTab === 'bafa' && <BAFABereich kunde={selectedCustomer} api={api} />}

        {activeTab === 'firmendaten' && <Firmendaten kunde={selectedCustomer} api={api} />}
      </div>
    </div>
  );
}

export default DokumentManager;
