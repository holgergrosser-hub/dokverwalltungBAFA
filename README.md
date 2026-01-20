# BAFA Dokumente (Frontend)

Vite/React-Frontend für ein Google Apps Script WebApp Backend zur Kundenverwaltung und Dokument-Erstellung.

## Wichtig: So bleibt alles „sauber“ (einfacher Workflow)

**Merksatz:** Arbeite immer im Ordner, der eine **`.git`** enthält (das ist das echte GitHub-Repo).

### 1) Einmalig einrichten

1. Repo in VS Code klonen
   - VS Code → Source Control → **Clone Repository** → GitHub URL auswählen
2. Abhängigkeiten installieren
   - `npm install`
3. Lokal starten
   - `npm run dev`

### 2) Täglicher Ablauf (Änderung → online)

1. Vor dem Start: `git pull`
2. Änderungen machen (z.B. `src/configs/bafa-configs.js`)
3. Prüfen: `npm run build`
4. In VS Code: Source Control → **Commit** → **Push**
5. Netlify deployed automatisch nach dem Push (Deploys im Netlify Dashboard prüfen).

### 3) Wenn du Templates/Platzhalter änderst (Google Docs)

Es gibt **zwei Deploys**:

- **Frontend (Netlify):** automatisch per Git Push
- **Apps Script:** **manuell** in Apps Script → Deploy → *Manage deployments* → *Edit* → *New version* → Deploy

Wenn du neue Tokens ins Template schreibst:

- Token-Syntax ist immer **doppelte Klammern**: `{{TOKEN}}`
- Für Managementbewertung ist das Datum-Feld im Frontend als **Auto-Heute** gesetzt.
  - Template kann z.B. `{{BEWERTUNGSDATUM}}` oder `{{Bewertungsdatum}}` verwenden.

### 4) Häufige Fehler (und schnelle Checks)

- **Falscher Ordner bearbeitet:** Prüfe, ob im Explorer eine `.git` existiert (oder `git status` klappt).
- **Netlify zeigt alte Version:** Im Netlify Dashboard den neuesten Deploy abwarten und Seite hart neu laden.
- **Apps Script wirkt „alt“:** Apps Script Deployment wurde nicht als *New version* veröffentlicht.

## Setup

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Konfiguration (Vite Env)

Lege eine `.env` Datei an (lokal) oder setze die Variablen in Netlify.

- `VITE_API_URL` – **empfohlen**: `/.netlify/functions/bafa` (Proxy, Passwort bleibt serverseitig)
- Optional: `VITE_API_TRANSPORT` – `json` (empfohlen für Proxy) oder `formdata` (für direkten Apps-Script Call)

Direkter Apps-Script Call (nur für lokale Tests / interne Nutzung):
- `VITE_API_URL` – URL deiner Apps Script WebApp (endet auf `/exec`)
- `VITE_API_PASSWORD` – Passwort, das im Apps Script in `ScriptProperties` als `API_PASSWORD` gesetzt ist

Wichtiger Hinweis: Alles mit `VITE_` wird in den Browser-Build eingebettet. Ein Passwort in `VITE_API_PASSWORD` ist daher **nicht geheim**.

Beispiel: siehe `.env.example`.

## Netlify Function Proxy (empfohlen)

Damit das Apps-Script Passwort **nicht** im Frontend landet, wird eine Netlify Function genutzt:

- Frontend → `/.netlify/functions/bafa`
- Function → ruft Apps Script auf und injiziert `BAFA_API_PASSWORD` serverseitig.

Netlify Dashboard → Environment Variables:

- `VITE_API_URL = /.netlify/functions/bafa`
- `VITE_API_TRANSPORT = json`
- `BAFA_API_URL = https://script.google.com/macros/s/DEINE_ID/exec`
- `BAFA_API_PASSWORD = dein-passwort`

## Google Apps Script Backend

Das WebApp-Routing liegt als Referenz in `apps-script/Code.js`.

## Externe Ressourcen und Automation-Tools

Für erweiterte Google Docs Automation-Funktionen kann das folgende externe Toolkit als Referenz dienen:

```bash
git clone https://github.com/xebiafrance/google-docs-automation-kit.git
```

**Hinweis:** Dieses externe Repository bietet zusätzliche Patterns und Best Practices für Google Docs Automation, die als Inspiration für weitere Entwicklungen dienen können.

## Platzhalter (Reminder)

Für Google-Doc-Templates (insb. **Managementbewertung** und **Auditbericht**) ist die Platzhalter-Checkliste hier hinterlegt:

- `docs/PLATZHALTER.md`

## Hilfe (für Anwender)

- `docs/HILFE.md`

Hinweis: Wenn nach der Erstellung noch `{{...}}` Platzhalter im Dokument übrig sind, fragt das Frontend, ob sie entfernt werden sollen oder ob Eingaben nachgetragen werden.

Hinweis: Für robuste Updates (auch nach Wochen) können Templates **Update-Zonen** enthalten (Marker `[[BAFA_ZONE:NAME]]` ... `[[/BAFA_ZONE:NAME]]`). Standardmäßig aktiv beim Update für Managementbewertung und Auditbericht.

## Deploy-Checkliste (Reminder)

Wenn du **Google-Doc-Templates** oder **Platzhalter** änderst (z.B. Managementbewertung/Auditbericht):

1. Platzhalter prüfen/aktualisieren: `docs/PLATZHALTER.md`
2. Frontend (Netlify) aktualisieren:
   - Falls neue Formularfelder/Keys nötig sind: `src/configs/bafa-configs.js` anpassen
   - Deploy auslösen (Netlify) oder lokal: `npm run build`
3. Apps Script aktualisieren:
   - Code aus `apps-script/*.gs` in dein Apps Script Projekt kopieren
   - Deploy → **Manage deployments** → Deployment **Edit** → **New version** → Deploy

Hinweis: Firmendaten-Platzhalter können serverseitig global verfügbar gemacht werden (siehe `mergeStandardPlaceholders_` im BAFA Processor).

Minimaler Deploy-Flow:

1. Google Drive → Neues Apps Script Projekt
2. Code aus `apps-script/Code.js` + die fehlenden Business-Funktionen hinzufügen
3. Einmal `setupPassword()` ausführen (oder `API_PASSWORD` manuell in `ScriptProperties` setzen)
4. Deploy → **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (oder je nach Bedarf)
5. WebApp-URL in `VITE_API_URL` eintragen

## CORS Hinweis

Für Google Apps Script ist `formdata` oft stabiler, weil es CORS-Preflight vermeidet. Das Frontend sendet dann ein `FormData` Feld `data` mit JSON darin (kompatibel mit deinem Backend-Fix).
