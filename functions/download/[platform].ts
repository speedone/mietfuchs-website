import { d1Counter, type D1Like } from '../_lib/counter.ts'
import { handleDownload, loadTargets, type AssetsLike } from '../_lib/download.ts'

type Context = { request: Request; params: { platform?: string | string[] }; env: { DB: D1Like; ASSETS?: AssetsLike } }

export const onRequestGet = async (ctx: Context): Promise<Response> => {
  const platform = Array.isArray(ctx.params.platform) ? '' : (ctx.params.platform ?? '')
  const targets = await loadTargets(ctx.env.ASSETS, ctx.request.url)
  return handleDownload(ctx.request, platform, d1Counter(ctx.env.DB), new Date(), targets)
}
