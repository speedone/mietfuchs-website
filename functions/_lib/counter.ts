// Zähler in Cloudflare D1 (Tabelle aus migrations/0001_downloads.sql). Nur die Teile der D1-API,
// die hier gebraucht werden, damit keine globalen Worker-Typen ins Projekt kommen.
import type { DownloadCounter } from './download.ts'

export interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } }
}

export function d1Counter(db: D1Like): DownloadCounter {
  return {
    async add(day, platform, source) {
      await db
        .prepare('INSERT INTO downloads (day, platform, source, count) VALUES (?, ?, ?, 1) ON CONFLICT (day, platform, source) DO UPDATE SET count = count + 1')
        .bind(day, platform, source)
        .run()
    },
  }
}
