/**
 * Resolves `source` strings like `firmendaten.email` against the loaded firmendaten object.
 * Adds a small alias layer to keep older/newer field names compatible.
 */

const ALIASES = {
  firmenname: ['firmenname', 'companyName', 'name'],
  webpage: ['webpage', 'homepage', 'website', 'webseite'],
  anzahlMitarbeiter: ['anzahlMitarbeiter', 'mitarbeiterAnzahl', 'mitarbeiter', 'mitarbeiterzahl'],
  gruendungsdatum: ['gruendungsdatum', 'gruendungsjahr', 'gruendung'],
  strasse: ['strasse', 'straße', 'street'],
  plz: ['plz', 'zip', 'postleitzahl'],
  ort: ['ort', 'stadt', 'city'],
  email: ['email', 'eMail', 'mail'],
  geschaeftsfuehrer: ['geschaeftsfuehrer', 'geschäftsfuehrer', 'geschaeftsfuehrung'],
  qmb: ['qmb'],
  anwendbarkeit: ['anwendbarkeit', 'anwendbar', 'applicability']
};

function getByAliases(obj, key) {
  if (!obj || typeof obj !== 'object') return undefined;
  const candidates = ALIASES[key] || [key];
  for (const k of candidates) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return obj[k];
    }
  }
  return undefined;
}

export function resolveFirmendatenSource(source, { kunde, firmendaten } = {}) {
  if (!source || typeof source !== 'string') return '';

  if (!source.startsWith('firmendaten.')) return '';

  const key = source.slice('firmendaten.'.length);

  // Direct hit
  if (firmendaten && firmendaten[key] !== undefined && firmendaten[key] !== null) {
    return firmendaten[key];
  }

  // Alias hit
  const aliasValue = getByAliases(firmendaten, key);
  if (aliasValue !== undefined) return aliasValue;

  // Fallback: derive from selected customer
  if (key === 'firmenname' && kunde?.companyName) {
    return kunde.companyName;
  }

  return '';
}
