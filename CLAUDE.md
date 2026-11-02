# CLAUDE.md

Website von Mietfuchs (mietfuchs-app.de). Konzept und Plan liegen nur lokal unter `.superpowers/docs/`
(nicht im öffentlichen Repo, weil sie Strategie und andere Anbieter nennen).

## Regeln für jeden Text

- Deutsch, **Sie-Anrede**; Bezeichner im Code englisch, URLs deutsch.
- Kein Geviertstrich (—); stattdessen Doppelpunkt, Komma, Klammer.
- Keine Versprechen wie „rechtssicher“, „garantiert“, „kein Einwand“, „fehlerfrei“.
- Keine erfundenen Zahlen, Bewertungen oder Nutzerstimmen; Zahlen nur aus `getStats()`.
- Rechtliche Aussagen nur mit Quelle (Gesetz → BGH → VDI/DIN → Messdienst-Praxis). Geprüfte
  Grundlage sind die Register in `../mietfuchs/shared/law/` und `../mietfuchs/docs/heizung.md`;
  sie kennen Rechtsänderungen, die ein Modell nicht kennt.
- Keine anderen Anbieter oder fremde Software namentlich nennen, weder auf der Seite noch in Code,
  Kommentaren, Commits oder Doku (das Repo ist öffentlich); Vergleich nur mit Excel.
- Nichts von fremden Servern laden (CSP `default-src 'self'`), keine Cookies.

## Prüfen

`npm run check && npm test` vor jedem Commit (Exit-Status prüfen), bei Änderungen an Seiten
zusätzlich `npm run build && npm run test:pages`.

## Downloadzahl

Die Downloadzahl (`src/lib/stats.ts`) zählt nur Programmdateien, ohne den Bot, der ab v0.14.0 jede Datei
eines Releases einmal lädt, und mit einer festen Korrektur der Praxistest-Downloads an fünf Linux-Archiven
(Stand 02.11.2026).

## Bauen und neue Releases

`.github/workflows/deploy.yml` baut und veröffentlicht bei Push auf main, täglich um 05:00 UTC und von Hand.
Alle 15 Minuten vergleicht der Job „Abgleich“ das neueste Release von Mietfuchs mit `/version.json` der
Website und baut nur bei einem Unterschied. Unabhängig davon fragt `/download/<ziel>` beim Aufruf das neueste
Release ab (fünf Minuten zwischengespeichert, `functions/_lib/download.ts`); fällt GitHub aus, gilt das Ziel
aus dem Bau, zuletzt `APP_VERSION` in `src/lib/site.ts`. Kein Token, kein Ereignis aus dem App-Repo.

## Aufgaben

Als GitHub-Issues in diesem Repo, nicht in Beads. Issues erst nach Rückfrage anlegen.
