'use client'

import { useEffect } from 'react'
import { DEFAULT_LANGUAGE, PUBLIC_LANGUAGES, getLocalizedHref, normalizePublicLanguage } from '../lib/i18n/language'

const languageLabels = {
  en: 'EN',
  fr: 'FR',
}

export default function PublicLanguageSwitcher({ language = DEFAULT_LANGUAGE, currentPath = '/' }) {
  const activeLanguage = normalizePublicLanguage(language)

  function persistLanguageChoice(nextLanguage) {
    localStorage.setItem('pplus-public-language', normalizePublicLanguage(nextLanguage))
  }

  useEffect(() => {
    const savedLanguage = localStorage.getItem('pplus-public-language')
    const hasLanguageParam = new URLSearchParams(window.location.search).has('lang')

    if (!hasLanguageParam && savedLanguage && normalizePublicLanguage(savedLanguage) !== activeLanguage) {
      window.location.href = getLocalizedHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, savedLanguage)
      return
    }

    localStorage.setItem('pplus-public-language', activeLanguage)
  }, [activeLanguage])

  return (
    <nav className="public-language-switcher" aria-label="Language">
      {PUBLIC_LANGUAGES.map((option) => {
        const isActive = option === activeLanguage
        return (
          <a
            key={option}
            href={getLocalizedHref(currentPath, option)}
            className={`public-language-switcher-option${isActive ? ' public-language-switcher-option-active' : ''}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => persistLanguageChoice(option)}
          >
            {languageLabels[option]}
          </a>
        )
      })}
    </nav>
  )
}
