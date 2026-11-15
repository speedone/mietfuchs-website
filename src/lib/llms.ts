// /llms.txt nach dem Vorschlag von llmstxt.org: eine Kurzfassung in Markdown für KI-Werkzeuge. Die
// Ratgeber kommen aus der Sammlung, damit ein neuer Ratgeber ohne weiteres Zutun darin steht.
import { REPO_URL, SITE_URL, STORE_URL } from './site.ts'
import { FEATURE_GROUPS } from '../data/features.ts'

export type LlmsGuide = { slug: string; title: string; description: string }

const PAGES: { path: string; name: string; text: string }[] = [
  { path: '', name: 'Startseite', text: 'Überblick: was Mietfuchs rechnet, für wen es gedacht ist, häufige Fragen' },
  { path: '/funktionen', name: 'Funktionen', text: 'Verteilung, Heizkosten nach HeizkostenV, mehrere Häuser, WG-Zimmer, Haupt- und Zwischenzähler, Mietkonto, Kontoauszug, Kaution, Anlage V, Belege, Hinweise mit Rechtsgrundlage' },
  { path: '/herunterladen', name: 'Herunterladen', text: 'Eigenes Programm für Windows (Microsoft Store oder Installer) und macOS, Pakete und Archiv für Linux, Docker-Abbild für NAS und Heimserver' },
  { path: '/ratgeber', name: 'Ratgeber', text: 'alle Ratgeber zur Nebenkostenabrechnung im Überblick' },
  { path: '/ueber', name: 'Über Mietfuchs', text: 'Projekt, Lizenz (AGPL-3.0), Mitmachen und Unterstützen' },
]

const link = (name: string, url: string, text: string): string => `- [${name}](${url}): ${text}`

// Vor den Linklisten erlaubt das Format freien Text, aber keine Überschriften; die Gruppen stehen
// deshalb als Absatz über ihrer Liste.
const features = (): string[] =>
  FEATURE_GROUPS.flatMap((g) => [`${g.title}: ${g.lead}`, '', ...g.items.map((f) => `- ${f.title}: ${f.text}`), ''])

export function buildLlmsTxt(guides: LlmsGuide[]): string {
  return [
    '# Mietfuchs',
    '',
    '> Mietfuchs ist ein kostenloses Open-Source-Programm für die Nebenkostenabrechnung privater Vermieter in Deutschland. Es läuft auf dem eigenen Rechner (Windows, macOS, Linux oder als Docker-Abbild), ohne Konto und ohne Cloud, und erstellt je Mieter eine Abrechnung mit nachvollziehbarem Rechenweg.',
    '',
    'Mietfuchs ersetzt keine Rechts- oder Steuerberatung. Die Ratgeber nennen für rechtliche Aussagen ihre Quellen (Gesetz, Rechtsprechung) und den Stand.',
    '',
    'Was Mietfuchs kann:',
    '',
    ...features(),
    '## Programm',
    '',
    ...PAGES.map((p) => link(p.name, `${SITE_URL}${p.path}`, p.text)),
    '',
    '## Ratgeber',
    '',
    ...guides.map((g) => link(g.title, `${SITE_URL}/${g.slug}`, g.description)),
    '',
    '## Optional',
    '',
    link('Quellcode auf GitHub', REPO_URL, 'Quellcode, Releases, Änderungsprotokoll und Fehlermeldungen'),
    link('Microsoft Store', STORE_URL, 'Mietfuchs für Windows im Microsoft Store'),
    '',
  ].join('\n')
}
