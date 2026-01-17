import React, { useEffect, useMemo, useState } from 'react';
import { createBafaApi } from './api/bafaApi';

/**
 * FIRMENDATEN
 * Formular zum Erfassen und Bearbeiten von Firmenstammdaten.
 *
 * Props:
 * - kunde: Kunden-Objekt mit kundeId und companyName
 * - api: optionaler vorkonfigurierter API-Client (empfohlen)
 * - onSaved: Callback wenn Daten gespeichert wurden (optional)
 */
function Firmendaten({ kunde, api: apiProp, onSaved }) {
  const api = useMemo(() => {
    if (apiProp) return apiProp;
    // Fallback to env defaults (VITE_API_URL, optional VITE_API_PASSWORD depending on transport)
    return createBafaApi();
  }, [apiProp]);

  const [formData, setFormData] = useState({
    // Neue/erweiterte Felder (für BAFA Platzhalter-Quellen)
    firmenname: '',
    strasse: '',
    plz: '',
    ort: '',
    email: '',
    webpage: '',
    anzahlMitarbeiter: '',
    gruendungsdatum: '',

    // Legacy Felder (beibehalten für Abwärtskompatibilität)
    adresse: '',
    homepage: '',
    gruendungsjahr: '',
    mitarbeiterAnzahl: '',

    geschaeftsfuehrer: '',
    qmb: '',

    zielgruppe: '',
    zielgebiet: '',

    anwendbarkeit: '',

    unternehmenspolitik: '',
    qualitaetspolitik: '',
    datensicherung: '',

    letzterAuditor: '',
    letztesAuditDatum: '',
    letztesAuditErgebnis: 'KONFORM'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [loadedCount, setLoadedCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!kunde?.kundeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await api.getFirmendaten(kunde.kundeId);

        const loaded =
          data?.firmendaten ??
          data?.data?.firmendaten ??
          (data?.success && typeof data?.firmendaten === 'object' ? data.firmendaten : null) ??
          {};

        if (!cancelled) {
          setFormData((prev) => {
            const merged = {
              ...prev,
              ...(loaded || {})
            };

            // Fallbacks/Sync für Feld-Aliase
            if (!merged.firmenname && kunde?.companyName) merged.firmenname = kunde.companyName;
            if (!merged.webpage && merged.homepage) merged.webpage = merged.homepage;
            if (!merged.homepage && merged.webpage) merged.homepage = merged.webpage;
            if (!merged.anzahlMitarbeiter && merged.mitarbeiterAnzahl) merged.anzahlMitarbeiter = merged.mitarbeiterAnzahl;
            if (!merged.mitarbeiterAnzahl && merged.anzahlMitarbeiter) merged.mitarbeiterAnzahl = merged.anzahlMitarbeiter;
            if (!merged.gruendungsdatum && merged.gruendungsjahr) merged.gruendungsdatum = merged.gruendungsjahr;
            if (!merged.gruendungsjahr && merged.gruendungsdatum) merged.gruendungsjahr = String(merged.gruendungsdatum).slice(0, 4);

            return merged;
          });
          setLoadedCount(loaded && typeof loaded === 'object' ? Object.keys(loaded).length : 0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || String(e));
          setLoadedCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [api, kunde?.kundeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!kunde?.kundeId) {
      setError('Kein Kunde ausgewählt');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const normalized = {
        ...formData,
        firmenname: formData.firmenname || kunde?.companyName || '',
        webpage: formData.webpage || formData.homepage || '',
        homepage: formData.homepage || formData.webpage || '',
        anzahlMitarbeiter: formData.anzahlMitarbeiter || formData.mitarbeiterAnzahl || '',
        mitarbeiterAnzahl: formData.mitarbeiterAnzahl || formData.anzahlMitarbeiter || '',
        gruendungsdatum: formData.gruendungsdatum || formData.gruendungsjahr || '',
        gruendungsjahr: formData.gruendungsjahr || String(formData.gruendungsdatum || '').slice(0, 4)
      };

      // Legacy: wenn adresse leer, aus strasse/plz/ort zusammenbauen
      if (!normalized.adresse && (normalized.strasse || normalized.plz || normalized.ort)) {
        normalized.adresse = [normalized.strasse, [normalized.plz, normalized.ort].filter(Boolean).join(' ')].filter(Boolean).join('\n');
      }

      const data = await api.saveFirmendaten(kunde.kundeId, normalized);
      setLastSaved(new Date());
      if (typeof onSaved === 'function') {
        onSaved(data);
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Firmendaten werden geladen...</p>
      </div>
    );
  }

  if (!kunde?.kundeId) {
    return (
      <div className="firmendaten-container">
        <h2 style={{ marginBottom: 16 }}>🏢 Firmendaten</h2>
        <div style={{ padding: 12, background: '#fff8e1', borderLeft: '4px solid #ffb300', borderRadius: 6 }}>
          Bitte zuerst einen Kunden auswählen.
        </div>
      </div>
    );
  }

  return (
    <div className="firmendaten-container">
      <h2 style={{ marginBottom: 16 }}>🏢 Firmendaten</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Kunde: <strong>{kunde?.companyName}</strong> ({kunde?.kundeId})
      </p>

      {typeof loadedCount === 'number' && (
        <div style={{ marginBottom: 12, color: '#666' }}>
          Geladene Felder: <strong>{loadedCount}</strong>
        </div>
      )}

      {lastSaved && (
        <div className="last-saved">
          Zuletzt gespeichert: {lastSaved.toLocaleString('de-DE')}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#ffebee', borderLeft: '4px solid #e53935', borderRadius: 6 }}>
          <strong>Fehler:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basis</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Firmenname</label>
              <input
                name="firmenname"
                value={formData.firmenname || ''}
                onChange={handleChange}
                placeholder="z.B. Muster GmbH"
              />
            </div>
            <div className="form-group">
              <label>E-Mail</label>
              <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="info@..." />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Straße</label>
              <input name="strasse" value={formData.strasse || ''} onChange={handleChange} placeholder="Straße Nr." />
            </div>
            <div className="form-group">
              <label>PLZ</label>
              <input name="plz" value={formData.plz || ''} onChange={handleChange} placeholder="12345" />
            </div>
            <div className="form-group">
              <label>Ort</label>
              <input name="ort" value={formData.ort || ''} onChange={handleChange} placeholder="Ort" />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <textarea
              name="adresse"
              value={formData.adresse || ''}
              onChange={handleChange}
              placeholder="Straße, PLZ Ort"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Homepage</label>
              <input
                name="homepage"
                value={formData.homepage || ''}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Webseite (Alias)</label>
              <input
                name="webpage"
                value={formData.webpage || ''}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Gründungsjahr</label>
              <input
                name="gruendungsjahr"
                value={formData.gruendungsjahr || ''}
                onChange={handleChange}
                placeholder="z.B. 2018"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gründungsdatum (Alias)</label>
              <input
                name="gruendungsdatum"
                value={formData.gruendungsdatum || ''}
                onChange={handleChange}
                placeholder="z.B. 2018 oder 2018-01-01"
              />
            </div>
            <div className="form-group">
              <label>Mitarbeiter (Alias)</label>
              <input
                name="anzahlMitarbeiter"
                value={formData.anzahlMitarbeiter || ''}
                onChange={handleChange}
                placeholder="z.B. 12"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mitarbeiteranzahl</label>
            <input
              name="mitarbeiterAnzahl"
              value={formData.mitarbeiterAnzahl || ''}
              onChange={handleChange}
              placeholder="z.B. 12"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Ansprechpartner</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Geschäftsführer</label>
              <input
                name="geschaeftsfuehrer"
                value={formData.geschaeftsfuehrer || ''}
                onChange={handleChange}
                placeholder="Name"
              />
            </div>

            <div className="form-group">
              <label>QMB</label>
              <input
                name="qmb"
                value={formData.qmb || ''}
                onChange={handleChange}
                placeholder="Name"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Unternehmen</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Zielgruppe</label>
              <input name="zielgruppe" value={formData.zielgruppe || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Zielgebiet</label>
              <input name="zielgebiet" value={formData.zielgebiet || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Anwendbarkeit</label>
            <textarea
              name="anwendbarkeit"
              value={formData.anwendbarkeit || ''}
              onChange={handleChange}
              placeholder="Optional: Kurze Beschreibung der Anwendbarkeit (für {{Anwendbarkeit}} im Auditbericht)"
            />
          </div>

          <div className="form-group">
            <label>Unternehmenspolitik</label>
            <textarea
              name="unternehmenspolitik"
              value={formData.unternehmenspolitik || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Qualitätspolitik</label>
            <textarea
              name="qualitaetspolitik"
              value={formData.qualitaetspolitik || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>IT / Datenschutz</h3>

          <div className="form-group">
            <label>Datensicherung</label>
            <textarea name="datensicherung" value={formData.datensicherung || ''} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section">
          <h3>Audit</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Letzter Auditor</label>
              <input name="letzterAuditor" value={formData.letzterAuditor || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Letztes Audit-Datum</label>
              <input
                type="date"
                name="letztesAuditDatum"
                value={formData.letztesAuditDatum || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Letztes Audit-Ergebnis</label>
            <select
              name="letztesAuditErgebnis"
              value={formData.letztesAuditErgebnis || 'KONFORM'}
              onChange={handleChange}
            >
              <option value="KONFORM">KONFORM</option>
              <option value="ABWEICHUNG">ABWEICHUNG</option>
              <option value="NICHT_BEWERTET">NICHT_BEWERTET</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Speichert...' : 'Speichern'}
          </button>
        </div>

        <div className="info-box">
          <strong>Hinweis</strong>
          Diese Daten werden pro Kunde gespeichert und können später für Dokumente übernommen werden.
        </div>
      </form>
    </div>
  );
}

export default Firmendaten;
