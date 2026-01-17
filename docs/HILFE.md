# Hilfe – Dokumentenverwaltung (BAFA)

Diese Datei ist eine kurze Anleitung **für dich (Admin)** und **für Anwender** im Frontend.

---

## Für Anwender (Frontend)

### 1) Kunde auswählen
- Oben einen Kunden auswählen.
- Optional: Logo hochladen (wird in Vorlagen über `{{LOGO}}` / `{{LOGO_URL}}` eingefügt, wenn vorhanden).

### 2) Firmendaten pflegen
- Reiter **Firmendaten** öffnen.
- Stammdaten ausfüllen (Adresse, E-Mail, Webseite, QMB, Zielgruppe, etc.).
- Speichern.

Warum: Viele BAFA-Dokumente ziehen Werte automatisch aus Firmendaten.

### 3) BAFA-Dokument erstellen
- Reiter **BAFA** öffnen.
- Dokumenttyp wählen.
- Pflichtfelder ausfüllen.
- „BAFA-Dokument erstellen“.

Wenn nach der Erstellung noch `{{...}}` Platzhalter im Dokument übrig sind:
- Das System fragt nach:
  - **Platzhalter entfernen** (Dokument wird „sauber“), oder
  - **Eingaben nachtragen** (Platzhalter bleiben sichtbar und können später gefüllt werden).

### 4) Bestehende Dokumente aktualisieren
- In der Dokumentliste auf **Bearbeiten**.
- Felder anpassen.
- „BAFA-Dokument aktualisieren“.

---

## Für dich (Admin / Template-Pflege)

### Platzhalter
- Platzhalter im Template haben das Format `{{KEY}}`.
- Die Liste der unterstützten Platzhalter steht in `docs/PLATZHALTER.md`.

### Tabellen
- Tabellen werden über `{{TABLE_<name>}}` eingesetzt.
- Beispiel: `{{TABLE_themen}}` oder `{{TABLE_feststellungen}}`.

### Update-Zonen (robust nach Wochen)

Problem: Wenn du ein Dokument erstellst und nach Wochen Inhalte ändern willst, reicht „einmal Platzhalter ersetzen“ oft nicht.

Lösung: **Update-Zonen** im Template.

Marker im Google Doc (muss als eigener Absatz/Zeile stehen):
- Start: `[[BAFA_ZONE:NAME]]`
- Ende:  `[[/BAFA_ZONE:NAME]]`

Alles zwischen den Markern ist die Zone.

Was passiert beim Update:
- Vor dem Ersetzen von Platzhaltern/Tables synchronisiert das Backend die Zonen aus dem aktuellen Template in das bestehende Dokument.
- Danach werden Platzhalter und Tabellen normal ersetzt.

Empfehlung:
- Marker im Template optisch „unsichtbar“ machen (z.B. Schriftfarbe Weiß oder sehr klein), aber im Text belassen.

Default:
- Update-Zonen sind beim Update serverseitig standardmäßig aktiv für:
  - `bafa_04_managementbewertung`
  - `bafa_10_auditbericht`

---

## Rollout / Freigaben

Für Code-Änderungen im Repo brauche ich keine Freigabe.

Eine Freigabe/Bestätigung brauche ich nur, wenn ich etwas „extern“ auslösen soll, z.B.:
- Apps Script Deployment „New version“ klicken
- Netlify Deploy triggern
- Git Commit/Push ausführen (wenn du das möchtest)
