import { d1Counter, type D1Like } from '../_lib/counter.ts'
import { handleDownload } from '../_lib/download.ts'

type Context = { request: Request; params: { platform?: string | string[] }; env: { DB: D1Like } }

export const onRequestGet = (ctx: Context): Promise<Response> => {
  const platform = Array.isArray(ctx.params.platform) ? '' : (ctx.params.platform ?? '')
  return handleDownload(ctx.request, platform, d1Counter(ctx.env.DB), new Date())
}
