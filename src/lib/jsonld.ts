// Strukturierte Daten (schema.org, JSON-LD) für Suchmaschinen.
import { AUTHOR, REPO_URL, SITE_URL } from './site.ts'
import type { Stats } from './stats.ts'

export function softwareAppLd(stats: Stats): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Mietfuchs',
    description: 'Kostenloses Programm für die Nebenkostenabrechnung privater Vermieter, lokal auf dem eigenen Rechner.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Windows, macOS, Linux',
    inLanguage: 'de',
    url: SITE_URL,
    downloadUrl: `${SITE_URL}/herunterladen`,
    softwareVersion: stats.version,
    datePublished: stats.releasedAt,
    license: 'https://www.gnu.org/licenses/agpl-3.0.html',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    author: { '@type': 'Person', name: AUTHOR },
    sameAs: [REPO_URL],
  }
}

export function faqLd(items: { q: string; a: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  }
}

export function breadcrumbLd(trail: { name: string; path: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: new URL(t.path, SITE_URL).href })),
  }
}
