export const PUBLIC_LANGUAGES = ['en', 'fr']
export const DEFAULT_LANGUAGE = 'en'

export function normalizePublicLanguage(language) {
  return PUBLIC_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE
}

export function getLocalizedHref(href, language = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizePublicLanguage(language)
  const [pathWithQuery, hash = ''] = href.split('#')
  const [pathname = '/', query = ''] = pathWithQuery.split('?')
  const params = new URLSearchParams(query)

  if (normalizedLanguage === DEFAULT_LANGUAGE) {
    params.delete('lang')
  } else {
    params.set('lang', normalizedLanguage)
  }

  const queryString = params.toString()
  return `${pathname || '/'}${queryString ? `?${queryString}` : ''}${hash ? `#${hash}` : ''}`
}
