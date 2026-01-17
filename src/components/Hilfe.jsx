import React from 'react';

function Hilfe() {
  return (
    <div className="dm-card">
      <h2>Hilfe</h2>

      <div className="dm-alert">
        <strong>Kurzanleitung</strong> für Anwender und Admin (Templates).
      </div>

      <h3>Anwender (Frontend)</h3>
      <ul>
        <li><strong>Kunde auswählen</strong> (oben im Dropdown).</li>
        <li><strong>Firmendaten</strong> pflegen (Reiter „Firmendaten“), dann speichern.</li>
        <li><strong>BAFA</strong> → Dokumenttyp wählen → Pflichtfelder ausfüllen → erstellen.</li>
        <li>
          Wenn nach Erstellung/Update noch <code>{'{{...}}'}</code> Platzhalter im Doc sind, fragt das System:
          <ul>
            <li><strong>OK</strong> = Platzhalter entfernen (Doc „sauber“)</li>
            <li><strong>Abbrechen</strong> = Eingaben später nachtragen (Platzhalter bleiben sichtbar)</li>
          </ul>
        </li>
      </ul>

      <h3>Admin (Templates & Updates)</h3>
      <ul>
        <li>
          Platzhalter im Template: <code>{'{{KEY}}'}</code> (Liste siehe <code>docs/PLATZHALTER.md</code> im Repo).
        </li>
        <li>
          Tabellen: <code>{'{{TABLE_name}}'}</code> (z.B. <code>{'{{TABLE_themen}}'}</code>).
        </li>
      </ul>

      <h3>Update-Zonen (robust nach Wochen)</h3>
      <p>
        Für Dokumente, die später nochmal aktualisiert werden sollen, kannst du im Template Update-Zonen markieren.
        Beim Update synchronisiert das Backend diese Zonen aus dem aktuellen Template in das bestehende Dokument.
      </p>
      <div className="dm-alert">
        <div><strong>Marker (als eigene Zeile/Absatz im Google Doc):</strong></div>
        <div><code>[[BAFA_ZONE:NAME]]</code></div>
        <div><code>[[/BAFA_ZONE:NAME]]</code></div>
      </div>
      <ul>
        <li>Empfehlung: Marker im Template optisch „unsichtbar“ machen (weiß / sehr klein), aber drin lassen.</li>
        <li>Standardmäßig aktiv beim Update für <strong>Managementbewertung</strong> und <strong>Auditbericht</strong>.</li>
      </ul>

      <h3>Freigaben</h3>
      <p>
        Ich brauche nur dann eine Freigabe, wenn ich etwas außerhalb des Repos auslösen soll (z.B. Apps-Script redeploy, Netlify deploy, git push).
      </p>
    </div>
  );
}

export default Hilfe;
