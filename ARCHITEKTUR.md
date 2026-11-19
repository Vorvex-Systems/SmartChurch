# Architekturentscheidungen

| Entscheidung | Begründung |
|---|---|
| Custom Integration statt HA-Fork | HA bleibt unverändert und updatefähig; läuft auf HAOS, Container, Core, Supervised |
| ChurchTools-Client ohne HA-Imports | Eigenständig testbar, später austauschbar/erweiterbar |
| Panel als Web Component ohne Build-Schritt und ohne Abhängigkeiten | Keine Node-Toolchain nötig, keine externen Requests, einfach zu pflegen |
| Panel nutzt die HA-WebSocket-Verbindung des angemeldeten Benutzers | Keine zweite Anmeldung, keine Tokens im Browser |
| Token liegt im Config-Entry (serverseitig) und wird nie an das Frontend gesendet | Anforderung „Zugangsdaten niemals im Frontend" |
| Admin-Befehle (`smartchurch/churchtools/test`) mit `require_admin` | Verbindungsverwaltung nur für Administratoren |
| Datenfreigabe als Optionen, Personen/Gruppen standardmäßig aus | Datenschutz by default |
| Alle dynamischen Texte per `textContent` | Schutz vor XSS durch Entitätsnamen |
| Anzeigenamen aus Registry/Zuständen, nicht aus Annahmen über `friendly_name` | HA 2026.11 hat das Namenskonzept geändert |

## Bekannte Grenzen / offene Punkte
- Nicht gegen eine echte HA-Instanz getestet; Python 3.12 im Entwicklungscontainer, HA 2026.11 verlangt neuere Version. Erster Start bei dir ist der echte Test.
- ChurchTools-Endpunkte für Ressourcen/Buchungen werden in Phase 3 gegen die Swagger-Doku deiner Instanz geprüft.
- Das Panel ist für alle HA-Benutzer sichtbar; Rollen wie „Küster" folgen mit der Steuerung.
- Branding von Login-Seite/Browsertitel außerhalb des Panels: Reverse Proxy, separater Baustein.
