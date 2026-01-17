# Platzhalter-Referenz (Reminder)

Diese Datei ist die **Checkliste**, bevor du ein Google-Doc-Template baust/änderst.

## Allgemein

- Platzhalter haben das Format: `{{KEY}}`
- **Groß/Klein-/Schreibvarianten** werden serverseitig toleriert (z.B. `{{FIRMENNAME}}`, `{{firmenname}}`, `{{Firmenname}}`).
- **Nicht ersetzte Tokens** wie `{{IRGENDWAS}}` werden **standardmäßig NICHT automatisch entfernt**.
	- Stattdessen meldet das Backend die noch vorhandenen Tokens zurück und das Frontend fragt nach:
		- **Entfernen** (Cleanup) oder
		- **Eingabe nachtragen** (Platzhalter bleiben sichtbar im Doc).

## Standard-Platzhalter (immer verfügbar, aus Firmendaten/Kunde)

Diese Keys werden serverseitig automatisch gemerged (du musst sie nicht im Frontend-Formular definieren):

- `{{Firmenname}}`
- `{{Straße}}`
- `{{PLZ_Ort}}`
- `{{email}}`
- `{{Webpage}}`

Zusätzliche Firmendaten-Keys (optional, aber jetzt ebenfalls **global** verfügbar):

- `{{ZIELGRUPPE}}`
- `{{ZIELGEBIET}}`
- `{{GESCHAEFTSFUEHRER}}`
- `{{QMB}}`
- `{{UNTERNEHMENSPOLITIK}}`
- `{{QUALITAETSPOLITIK}}`
- `{{DATENSICHERUNG}}`

Logo (Bild) – wird durch Inline-Image ersetzt, wenn eine Logo-URL/ID vorhanden ist:

- `{{LOGO}}`, `{{FIRMENLOGO}}`, `{{LOGO_URL}}` (und gängige Varianten)

## Tabellen-Platzhalter

Wenn ein Dokument eine Tabelle hat, kann das Template diesen Platzhalter enthalten:

- `{{TABLE_<name>}}`

Wenn der Platzhalter fehlt, wird die Tabelle als Abschnitt am Ende angehängt.

---

## bafa_04_managementbewertung (Managementbewertung)

Dokument-spezifische Platzhalter (kommen aus dem BAFA-Formular):

- `{{BEWERTUNGSDATUM}}`
- `{{TEILNEHMER}}`
- `{{BEWERTUNGSZEITRAUM}}`
- `{{GESAMTBEWERTUNG}}`

Tabellen:

- `{{TABLE_themen}}` (Zeilenformat im UI: `Thema | Bewertung | Maßnahmen`)

## bafa_10_auditbericht (Auditbericht)

Dokument-spezifische Platzhalter (kommen aus dem BAFA-Formular):

- `{{AUDITDATUM}}`
- `{{AUDITOR}}`
- `{{AUDITBEREICH}}`
- `{{GESAMTERGEBNIS}}`

Tabellen:

- `{{TABLE_feststellungen}}` (Zeilenformat im UI: `Feststellung | Bewertung | Maßnahme`)
