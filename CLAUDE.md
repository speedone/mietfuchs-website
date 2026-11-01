# CLAUDE.md

Website von Mietfuchs (mietfuchs-app.de). Konzept: `docs/superpowers/specs/2026-11-01-website-design.md`,
Plan: `docs/superpowers/plans/2026-11-01-website.md`.

## Regeln für jeden Text

- Deutsch, **Sie-Anrede**; Bezeichner im Code englisch, URLs deutsch.
- Kein Geviertstrich (—); stattdessen Doppelpunkt, Komma, Klammer.
- Keine Versprechen wie „rechtssicher“, „garantiert“, „kein Einwand“, „fehlerfrei“.
- Keine erfundenen Zahlen, Bewertungen oder Nutzerstimmen; Zahlen nur aus `getStats()`.
- Rechtliche Aussagen nur mit Quelle (Gesetz → BGH → VDI/DIN → Messdienst-Praxis). Geprüfte
  Grundlage sind die Register in `../mietfuchs/shared/law/` und `../mietfuchs/docs/heizung.md`;
  sie kennen Rechtsänderungen, die ein Modell nicht kennt.
- Keine Wettbewerber namentlich nennen (Entscheidung des Nutzers); Vergleich nur mit Excel.
- Nichts von fremden Servern laden (CSP `default-src 'self'`), keine Cookies.

## Prüfen

`npm run check && npm test` vor jedem Commit (Exit-Status prüfen), bei Änderungen an Seiten
zusätzlich `npm run build && npm run test:pages`.

## Aufgaben

Als GitHub-Issues in diesem Repo, nicht in Beads. Issues erst nach Rückfrage anlegen.
