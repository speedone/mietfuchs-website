# Website von Mietfuchs

Quellcode von [mietfuchs-app.de](https://mietfuchs-app.de), der Website zu
[Mietfuchs](https://github.com/speedone/mietfuchs), dem kostenlosen Programm für die
Nebenkostenabrechnung privater Vermieter.

Statische Seite mit [Astro](https://astro.build), ausgeliefert über Cloudflare Pages. Eine kleine
Pages Function: Download-Weiterleitung mit Zähler (D1, ohne personenbezogene Daten). Die Adresse
kontakt@mietfuchs-app.de ist eine Weiterleitung über Cloudflare Email Routing; Cloudflare
verschleiert sie im ausgelieferten HTML. Keine Cookies, kein Tracking, nichts von fremden Servern.

## Entwickeln

```bash
npm install
npm run dev          # http://localhost:4321
npm run check        # Typprüfung (astro check + tsc)
npm test             # Unit- und Build-Tests (baut dist/, dist-indexable/, dist-testcontent/)
npm run build && npm run test:pages   # jede Seite in Chromium mit der CSP aus public/_headers: axe, Handy/Desktop, hell/dunkel
```

Einmalig für die Seitenprüfung: `npx playwright install chromium`.

## Abhängigkeiten

TypeScript bleibt vorerst bei 6.x: `astro check` unterstützt TypeScript 7.0 nicht (die
experimentelle Prüfung von Astro-Dateien braucht 7.1). Mit TypeScript 7.1 umstellen.

## Inhalte

- Ratgeber liegen als MDX in `src/content/ratgeber/`. Das Schema in `src/lib/guide-schema.ts`
  verlangt Titel (≤ 60 Zeichen), Beschreibung (120 bis 160), Kernantwort, Stand und mindestens
  eine Quelle; ohne Quelle baut die Seite nicht.
- Texte siezen, keine Geviertstriche, keine Versprechen wie „rechtssicher“: `test/build/copy.test.ts`
  prüft jede gebaute Seite.
- Das Muster-PDF erzeugt `node scripts/sample-statement.mjs` aus dem Beispielbestand von Mietfuchs
  (braucht `../mietfuchs` mit gebauter Oberfläche).

## Veröffentlichen

GitHub Actions (`.github/workflows/deploy.yml`) baut bei jedem Push auf `main` und täglich um
5 Uhr UTC neu (für aktuelle Download-Zahlen) und veröffentlicht mit wrangler.

- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Variablen: `IMPRESSUM_ADDRESS` (c/o-Anschrift, Teile durch Komma getrennt) und `SITE_INDEXABLE=1`.
  Erst wenn beide gesetzt sind, dürfen Suchmaschinen die Seite aufnehmen; vorher trägt jede Seite
  `noindex` und `robots.txt` sperrt alles. `SITE_INDEXABLE=force` gibt ausdrücklich auch ohne Adresse
  frei; sobald die Adresse gesetzt ist, wieder auf `1` stellen.

## Lizenz

AGPL-3.0, wie Mietfuchs.
