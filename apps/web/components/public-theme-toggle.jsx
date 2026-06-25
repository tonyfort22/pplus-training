'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pplus-public-theme'
const THEMES = ['dark', 'light']

function normalizeTheme(value) {
  return THEMES.includes(value) ? value : 'dark'
}

function readSavedTheme() {
  return normalizeTheme(window.localStorage?.getItem(STORAGE_KEY))
}

function applyPublicTheme(nextTheme) {
  const normalizedTheme = normalizeTheme(nextTheme)
  document.documentElement.dataset.publicTheme = normalizedTheme
  return normalizedTheme
}

export function PublicThemeHydrator() {
  const pathname = usePathname()

  useEffect(() => {
    applyPublicTheme(readSavedTheme())
  }, [pathname])

  return null
}

export default function PublicThemeToggle() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const savedTheme = applyPublicTheme(readSavedTheme())
    setTheme(savedTheme)
  }, [])

  function applyTheme(nextTheme) {
    nextTheme = applyPublicTheme(nextTheme)
    localStorage.setItem(STORAGE_KEY, nextTheme)
    setTheme(nextTheme)
  }

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className="public-theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'light'}
      onClick={toggleTheme}
    >
      <img
        className={theme === 'dark' ? 'public-theme-toggle-image public-theme-toggle-image-active' : 'public-theme-toggle-image'}
        src="/admin/auth_theme_toggle.svg"
        alt=""
        aria-hidden="true"
      />
      <img
        className={theme === 'light' ? 'public-theme-toggle-image public-theme-toggle-image-light public-theme-toggle-image-active' : 'public-theme-toggle-image public-theme-toggle-image-light'}
        src="/admin/auth_theme_toggle_light.svg"
        alt=""
        aria-hidden="true"
      />
    </button>
  )
}
