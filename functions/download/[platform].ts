import { d1Counter, type D1Like } from '../_lib/counter.ts'
import { handleDownload, liveTargets, loadTargets, type AssetsLike, type CacheLike } from '../_lib/download.ts'

type Context = { request: Request; params: { platform?: string | string[] }; env: { DB: D1Like; ASSETS?: AssetsLike } }

// Ziele aus dem Bau, überschrieben von denen des neuesten Release (live, fünf Minuten zwischengespeichert).
// caches.default gibt es nur bei Cloudflare; ohne ihn wird jedes Mal gefragt.
const defaultCache = (): CacheLike | undefined => (globalThis as { caches?: { default?: CacheLike } }).caches?.default

export const onRequestGet = async (ctx: Context): Promise<Response> => {
  const platform = Array.isArray(ctx.params.platform) ? '' : (ctx.params.platform ?? '')
  const [built, live] = await Promise.all([
    loadTargets(ctx.env.ASSETS, ctx.request.url),
    platform === 'windows' ? Promise.resolve({}) : liveTargets(fetch, defaultCache()),
  ])
  return handleDownload(ctx.request, platform, d1Counter(ctx.env.DB), new Date(), { ...built, ...live })
}

export const onRequestHead = onRequestGet
