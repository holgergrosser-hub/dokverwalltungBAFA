/**
 * BAFA DOKUMENTE - 14 TYPEN
 * Basierend auf vorhandenen Google Docs / Sheets.
 *
 * Hinweis: Diese Configs steuern das Frontend-Formular. Ob ein Dokument
 * serverseitig erzeugt werden kann, hängt davon ab, ob dein Apps-Script Backend
 * die configId kennt und die Platzhalter verarbeitet.
 */

export const BAFA_CONFIGS = {
  // ========================================
  // 01 - BERATERBEWERTUNG
  // ========================================
  beraterbewertung: {
    id: 'bafa_01_beraterbewertung',
    name: 'Beraterbewertung',
    docId: '19sHCWql5I8O0VOGNh4n5ylhocj2BUCEgBk9VcRP1gSE',
    description: 'Bewertung des Unternehmensberaters',
    category: 'bafa',

    // TODO: Platzhalter aus Google Doc extrahieren
    placeholders: [
      { key: 'BERATER_NAME', label: 'Name des Beraters', required: true },
      { key: 'BEWERTUNGSDATUM', label: 'Datum der Bewertung', type: 'date', required: true },
      { key: 'BEWERTER', label: 'Bewerter (Name)', required: true },
      { key: 'BEWERTUNG_GESAMT', label: 'Gesamtbewertung', required: false }
    ],

    tables: [
      {
        name: 'bewertungskriterien',
        title: 'Bewertungskriterien',
        inputLabel: 'Bewertungskriterien (ein Kriterium pro Zeile)',
        inputPlaceholder: 'Fachkompetenz | 5\nKommunikation | 4'
      }
    ]
  },

  // ========================================
  // 02 - KUNDENRÜCKMELDUNG
  // ========================================
  kundenrueckmeldung: {
    id: 'bafa_02_kundenrueckmeldung',
    name: 'Kundenrückmeldung',
    docId: '1znLS0aew5TJTMqm0KPvTcGUhCjmB8VBWt8TX-IAy9NY',
    description: 'Feedback und Rückmeldung vom Kunden',
    category: 'bafa',

    placeholders: [
      { key: 'KUNDE_NAME', label: 'Name des Kunden', source: 'firmendaten.firmenname', required: true },
      { key: 'PROJEKT_TITEL', label: 'Projekttitel', required: true },
      { key: 'PROJEKTZEITRAUM', label: 'Projektzeitraum', required: true },
      { key: 'ANSPRECHPARTNER', label: 'Ansprechpartner beim Kunden', required: true }
    ],

    tables: [
      {
        name: 'rueckmeldungen',
        title: 'Kundenrückmeldungen',
        inputLabel: 'Rückmeldungen (eine pro Zeile)',
        inputPlaceholder: 'Bereich | Bewertung | Kommentar'
      }
    ]
  },

  // ========================================
  // 03 - LISTE DER NORMEN UND GESETZE
  // ========================================
  normen_gesetze: {
    id: 'bafa_03_normen_gesetze',
    name: 'Liste der Normen und Gesetze',
    docId: '1SOnoiVsGQKSbzPs7-VKuVuZ-bB4hrkuAnTLFp9ZBMCo',
    description: 'Übersicht relevanter Normen und gesetzlicher Anforderungen',
    category: 'bafa',

    placeholders: [
      { key: 'GELTUNGSBEREICH', label: 'Geltungsbereich', source: 'firmendaten.zielgruppe', required: true },
      { key: 'STAND_DATUM', label: 'Stand (Datum)', type: 'date', required: true }
    ],

    tables: [
      {
        name: 'normen',
        title: 'Normen',
        inputLabel: 'Normen (eine pro Zeile)',
        inputPlaceholder: 'ISO 9001:2015 | Qualitätsmanagement | Anwendbar'
      },
      {
        name: 'gesetze',
        title: 'Gesetze und Verordnungen',
        inputLabel: 'Gesetze (eines pro Zeile)',
        inputPlaceholder: 'DSGVO | Datenschutz | Verpflichtend'
      }
    ]
  },

  // ========================================
  // 04 - MANAGEMENTBEWERTUNG
  // ========================================
  managementbewertung: {
    id: 'bafa_04_managementbewertung',
    name: 'Managementbewertung',
    docId: '1bjcsPKMBu4YbUm64UgwkEgLMDrMxxnGgc1bORYpv_jk',
    description: 'Bewertung durch die Geschäftsführung',
    category: 'bafa',

    placeholders: [
      { key: 'BEWERTUNGSDATUM', label: 'Datum der Bewertung', type: 'date', required: true },
      { key: 'TEILNEHMER', label: 'Teilnehmer', required: true },
      { key: 'BEWERTUNGSZEITRAUM', label: 'Bewertungszeitraum', required: true },
      { key: 'GESAMTBEWERTUNG', label: 'Gesamtbewertung', required: false }
    ],

    tables: [
      {
        name: 'themen',
        title: 'Bewertungsthemen',
        inputLabel: 'Themen (ein Thema pro Zeile)',
        inputPlaceholder: 'Zielerreichung | Konform | Keine Maßnahmen'
      }
    ]
  },

  // ========================================
  // 05 - MASSNAHMENPLAN (Sheet)
  // ========================================
  massnahmenplan: {
    id: 'bafa_05_massnahmenplan',
    name: 'Maßnahmenplan',
    docId: '1-pWJXHqptSCRiKaXwlCQ87w23PU1Eh8tBdt5lijNNeo',
    templateType: 'sheet',
    description: 'Planung und Verfolgung von Maßnahmen',
    category: 'bafa',
    note: 'Achtung: Dies ist ein Google Sheet, kein Doc!',

    placeholders: [
      { key: 'PROJEKTTITEL', label: 'Projekttitel', required: true },
      { key: 'PLANUNGSDATUM', label: 'Planungsdatum', type: 'date', required: true }
    ],

    tables: [
      {
        name: 'massnahmen',
        title: 'Maßnahmen',
        inputLabel: 'Maßnahmen (eine pro Zeile)',
        inputPlaceholder: 'Maßnahme | Verantwortlich | Termin | Status'
      }
    ]
  },

  // ========================================
  // 06 - PROZESS
  // ========================================
  prozess: {
    id: 'bafa_06_prozess',
    name: 'Prozess',
    docId: '',
    description: 'Prozessbeschreibung',
    category: 'bafa',
    note: 'Kein Google Doc vorhanden - muss noch erstellt werden',

    placeholders: [
      { key: 'PROZESSNAME', label: 'Name des Prozesses', required: true },
      { key: 'PROZESSVERANTWORTLICHER', label: 'Prozessverantwortlicher', required: true },
      { key: 'PROZESSZIEL', label: 'Prozessziel', required: true }
    ],

    tables: [
      {
        name: 'prozessschritte',
        title: 'Prozessschritte',
        inputLabel: 'Schritte (ein Schritt pro Zeile)',
        inputPlaceholder: 'Schritt 1 | Beschreibung | Verantwortlich'
      }
    ]
  },

  // ========================================
  // 07 - SCHULUNGSPLAN
  // ========================================
  schulungsplan: {
    id: 'bafa_07_schulungsplan',
    name: 'Schulungsplan',
    docId: '1i1b-WMi4u-mFh9H4p_Og-bwmUAmhVRuKyjk5vqxgHUA',
    description: 'Planung von Schulungen und Weiterbildungen',
    category: 'bafa',

    placeholders: [
      { key: 'PLANUNGSJAHR', label: 'Planungsjahr', required: true },
      { key: 'VERANTWORTLICH_SCHULUNG', label: 'Verantwortlich für Schulungen', required: true }
    ],

    tables: [
      {
        name: 'schulungen',
        title: 'Schulungen',
        inputLabel: 'Schulungen (eine pro Zeile)',
        inputPlaceholder: 'Schulungsthema | Zielgruppe | Termin | Status'
      }
    ]
  },

  // ========================================
  // 08 - ZIELE UND PROZESSKENNZAHLEN
  // ========================================
  ziele_kennzahlen: {
    id: 'bafa_08_ziele_kennzahlen',
    name: 'Ziele und Prozesskennzahlen',
    docId: '1lUwqH5dK7bm-9qdysJpEi4Y34jZl3caOpWEhfcc4TyA',
    description: 'Definition von Zielen und Kennzahlen',
    category: 'bafa',

    placeholders: [
      { key: 'GUELTIG_AB', label: 'Gültig ab', type: 'date', required: true },
      { key: 'ERSTELLT_VON', label: 'Erstellt von', required: true }
    ],

    tables: [
      {
        name: 'ziele',
        title: 'Unternehmensziele',
        inputLabel: 'Ziele (ein Ziel pro Zeile)',
        inputPlaceholder: 'Ziel | Kennzahl | Zielwert | Verantwortlich'
      }
    ]
  },

  // ========================================
  // 09 - UNTERNEHMENSHANDBUCH
  // ========================================
  unternehmenshandbuch: {
    id: 'bafa_09_unternehmenshandbuch',
    name: 'Unternehmenshandbuch',
    docId: '1NNkBv9fkgLN_fmuRXcPdgVie9wydNJONw3ljwdjAxrA',
    description: 'Vollständiges Unternehmenshandbuch',
    category: 'bafa',

    placeholders: [
      { key: 'FIRMENNAME', label: 'Firmenname', source: 'firmendaten.firmenname', required: true },
      { key: 'VERSION', label: 'Version', required: true },
      { key: 'GUELTIG_AB', label: 'Gültig ab', type: 'date', required: true },
      { key: 'ERSTELLT_VON', label: 'Erstellt von', source: 'firmendaten.qmb', required: true },

      // Zusätzliche Inhalte aus Firmendaten (für Template-Platzhalter)
      { key: 'ZIELGRUPPE', label: 'Zielgruppe', source: 'firmendaten.zielgruppe', required: false },
      { key: 'ZIELGEBIET', label: 'Zielgebiet', source: 'firmendaten.zielgebiet', required: false },
      {
        key: 'GESCHAEFTSFUEHRER',
        label: 'Geschäftsführer',
        source: 'firmendaten.geschaeftsfuehrer',
        required: false
      },
      { key: 'QMB', label: 'QMB', source: 'firmendaten.qmb', required: false },
      {
        key: 'UNTERNEHMENSPOLITIK',
        label: 'Unternehmenspolitik',
        source: 'firmendaten.unternehmenspolitik',
        required: false
      },
      {
        key: 'QUALITAETSPOLITIK',
        label: 'Qualitätspolitik',
        source: 'firmendaten.qualitaetspolitik',
        required: false
      },
      {
        key: 'DATENSICHERUNG',
        label: 'Datensicherung (IT/Datenschutz)',
        source: 'firmendaten.datensicherung',
        required: false
      }
    ],

    tables: []
  },

  // ========================================
  // 10 - AUDITBERICHT IA
  // ========================================
  auditbericht: {
    id: 'bafa_10_auditbericht',
    name: 'Auditbericht (Internes Audit)',
    docId: '1B-yXQN2GCMm0-5TtCogWdNG-ODg-AS7Ha6T4PdbvQJ4',
    description: 'Bericht über internes Audit',
    category: 'bafa',

    placeholders: [
      { key: 'AUDITDATUM', label: 'Berichtsdatum / Auditdatum', type: 'date', autoToday: true, required: true },
      { key: 'BERICHTDATUM', label: 'Berichtdatum (falls Template nutzt {{BERICHTDATUM}})', type: 'date', autoToday: true, required: false },
      { key: 'AUDITOR', label: 'Auditor', required: true },
      { key: 'Teilnehmer', label: 'Teilnehmer', source: 'firmendaten.qmb', required: false },
      { key: 'AUDITBEREICH', label: 'Auditbereich', required: true },
      { key: 'GESAMTERGEBNIS', label: 'Gesamtergebnis', required: false },

      // Firmendaten-Variablen, die häufig direkt im Auditbericht-Template genutzt werden
      { key: 'GELTUNGSBEREICH', label: 'Geltungsbereich', source: 'firmendaten.zielgruppe', required: false },
      { key: 'ANWENDBARKEIT', label: 'Anwendbarkeit', source: 'firmendaten.anwendbarkeit', required: false },

      // Freitext (oft länger als ein Einzeiler)
      { key: 'POSITIVE FESTSTELLUNGEN', label: 'Positive Feststellungen', type: 'textarea', required: false }
    ],

    tables: [
      {
        name: 'feststellungen',
        title: 'Feststellungen',
        inputLabel: 'Feststellungen (eine pro Zeile)',
        inputPlaceholder: 'Feststellung | Bewertung | Maßnahme'
      },
      {
        name: 'Eingesehene Nachweise',
        title: 'Eingesehene Nachweise',
        inputLabel: 'Eingesehene Nachweise (eine pro Zeile)',
        inputPlaceholder: 'Nachweis | Quelle/Ort | Bemerkung'
      },
      {
        name: 'Auditierte Themen',
        title: 'Auditierte Themen',
        inputLabel: 'Auditierte Themen (eine pro Zeile)',
        inputPlaceholder: 'Thema | Bereich/Prozess | Ergebnis/Bemerkung'
      }
    ]
  },

  // ========================================
  // 11 - VOLLMACHT
  // ========================================
  vollmacht: {
    id: 'bafa_11_vollmacht',
    name: 'Vollmacht',
    docId: '1NXiTpCPnErWghQJlxcfKU6WXC0unei5t4KTrtqr3ST0',
    description: 'Bevollmächtigung für BAFA-Antrag',
    category: 'bafa',

    placeholders: [
      {
        key: 'VOLLMACHTGEBER',
        label: 'Vollmachtgeber',
        source: 'firmendaten.geschaeftsfuehrer',
        required: true
      },
      { key: 'BEVOLLMAECHTIGTER', label: 'Bevollmächtigter', required: true },
      { key: 'DATUM', label: 'Datum', type: 'date', required: true },
      { key: 'ZWECK', label: 'Zweck der Vollmacht', required: true }
    ],

    tables: []
  },

  // ========================================
  // 12 - FIRMENINFORMATIONEN FÜR FÖRDERGELDANTRAG
  // ========================================
  firmeninformationen: {
    id: 'bafa_12_firmeninformationen',
    name: 'Firmeninformationen für Fördergeldantrag',
    docId: '1xulA8qw2HMKTZ5EblvPgcWxxO-T44Zq3M6U1bE0jnuI',
    description: 'Umfassende Firmendaten für Förderantrag',
    category: 'bafa',

    placeholders: [
      { key: 'FIRMENNAME', label: 'Firmenname', source: 'firmendaten.firmenname', required: true },
      { key: 'STRASSE', label: 'Straße', source: 'firmendaten.strasse', required: true },
      { key: 'PLZ', label: 'PLZ', source: 'firmendaten.plz', required: true },
      { key: 'ORT', label: 'Ort', source: 'firmendaten.ort', required: true },
      { key: 'EMAIL', label: 'E-Mail', source: 'firmendaten.email', required: true },
      { key: 'WEBPAGE', label: 'Webseite', source: 'firmendaten.webpage', required: false },
      {
        key: 'MITARBEITER_ANZAHL',
        label: 'Anzahl Mitarbeiter',
        source: 'firmendaten.anzahlMitarbeiter',
        required: true
      },
      { key: 'GRUENDUNGSJAHR', label: 'Gründungsjahr', source: 'firmendaten.gruendungsdatum', required: true },
      {
        key: 'GESCHAEFTSFUEHRER',
        label: 'Geschäftsführer',
        source: 'firmendaten.geschaeftsfuehrer',
        required: true
      }
    ],

    tables: []
  },

  // ========================================
  // 13 - PROJEKTBERICHT
  // ========================================
  projektbericht: {
    id: 'bafa_13_projektbericht',
    name: 'Projektbericht',
    docId: '1SDMZcBgq53XhyMnvbClwHqxufUXrpH9s-dBcO_FLnto',
    description: 'Abschlussbericht über das Beratungsprojekt',
    category: 'bafa',

    placeholders: [
      { key: 'PROJEKTTITEL', label: 'Projekttitel', required: true },
      { key: 'PROJEKTZEITRAUM', label: 'Projektzeitraum', required: true },
      { key: 'PROJEKTLEITER', label: 'Projektleiter', required: true },
      { key: 'PROJEKTZIEL', label: 'Projektziel', required: true },
      { key: 'PROJEKTERGEBNIS', label: 'Projektergebnis', required: true }
    ],

    tables: [
      {
        name: 'meilensteine',
        title: 'Meilensteine',
        inputLabel: 'Meilensteine (einer pro Zeile)',
        inputPlaceholder: 'Meilenstein | Datum | Status | Ergebnis'
      }
    ]
  },

  // ========================================
  // 14 - AUSFÜLLANLEITUNG
  // ========================================
  ausfuellanleitung: {
    id: 'bafa_14_ausfuellanleitung',
    name: 'Ausfüllanleitung',
    docId: '1lrxkWP1R0li0BotmCb3SgZJeAC9237r5S2LlAOoRS68',
    description: 'Anleitung zum Ausfüllen der BAFA-Dokumente',
    category: 'bafa',

    placeholders: [
      { key: 'VERSION', label: 'Version', required: true },
      { key: 'DATUM', label: 'Stand', type: 'date', required: true },
      { key: 'AUTOR', label: 'Autor', required: true }
    ],

    tables: []
  }
};

export function listBAFAConfigs() {
  return Object.values(BAFA_CONFIGS).map((config) => ({
    id: config.id,
    name: config.name,
    description: config.description,
    docId: config.docId,
    note: config.note || null,
    templateType: config.templateType || 'doc'
  }));
}

export function getBAFAConfig(configId) {
  let config = Object.values(BAFA_CONFIGS).find((c) => c.id === configId);

  if (!config) {
    config = BAFA_CONFIGS[configId];
  }

  if (!config) {
    throw new Error(`BAFA-Config '${configId}' nicht gefunden`);
  }

  return config;
}

export function getDocumentIds() {
  return Object.values(BAFA_CONFIGS)
    .filter((config) => config.docId)
    .map((config) => {
      const templateType = config.templateType || 'doc';
      const url =
        templateType === 'sheet'
          ? `https://docs.google.com/spreadsheets/d/${config.docId}/edit`
          : `https://docs.google.com/document/d/${config.docId}/edit`;
      return {
        name: config.name,
        docId: config.docId,
        url
      };
    });
}
