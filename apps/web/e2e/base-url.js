export const WEB_BASE_URL_ENV = 'PPLUS_WEB_PREVIEW_ORIGIN'
export const DEFAULT_WEB_BASE_URL = 'http://127.0.0.1:3000'

export function resolveWebBaseUrl(env = process.env) {
  return env[WEB_BASE_URL_ENV] ?? DEFAULT_WEB_BASE_URL
}
