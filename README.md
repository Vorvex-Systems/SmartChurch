# SmartChurch by Vorvex

Plugin für Home Assistant: Buchungen aus ChurchTools steuern Heizung, Licht und Szenen. Mit eigenem SmartChurch-Panel in der Seitenleiste.

**Stand (Version 0.1.0):** ChurchTools-Verbindung mit Datenauswahl, SmartChurch-Panel mit allen 8 Menüpunkten, Räume und Geräte (lesend). Buchungs-Sync, Automatisierungs-Engine und Gerätesteuerung folgen.

## Installation über den Marketplace (Home Assistant 2026.11 oder neuer)
1. Einstellungen → **Marketplace** → oben rechts **Über Link hinzufügen**.
2. Bei „GitHub-Link" `DEIN-BENUTZERNAME/smartchurch` eintragen und hinzufügen. Falls nach dem Typ gefragt wird: **Integration**.
3. Installieren, dann den angeforderten Neustart über Einstellungen → System → Reparaturen ausführen.
4. Einstellungen → Geräte & Dienste → Integration hinzufügen → **SmartChurch by Vorvex**.
5. ChurchTools-URL und Login-Token eines eigenen Dienstbenutzers mit minimalen Rechten eintragen.

Bei Home Assistant 2026.10 oder älter: HACS installieren und das Repository unter „Benutzerdefinierte Repositories" (Typ Integration) hinzufügen.
Das funktioniert auf HAOS, Container, Core und Supervised gleich.

Datenfreigabe ändern: Integration → Konfigurieren. Personen und Gruppen sind standardmäßig aus.

## Selbst veröffentlichen (einmalig)
1. Auf GitHub ein **öffentliches** Repository `smartchurch` anlegen.
2. Den Inhalt dieses Ordners hochladen (`custom_components/`, `hacs.json`, `README.md`, …).
3. In `custom_components/smartchurch/manifest.json` die URLs bei `documentation` und `issue_tracker` auf dein Repository ändern.
4. Unter „Releases" ein Release mit dem Tag `v0.1.0` erstellen. Neue Versionen: `version` in `manifest.json` und `const.py` erhöhen, neuen Tag anlegen.

## Tests
```
pip install pytest aiohttp
pytest
```
Siehe auch `docs/ARCHITEKTUR.md`.
