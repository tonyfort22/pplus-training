'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'pplus-admin-theme'
const THEMES = ['dark', 'light']

function normalizeTheme(value) {
  return THEMES.includes(value) ? value : 'dark'
}

export default function AdminThemeToggle() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const savedTheme = normalizeTheme(window.localStorage?.getItem(STORAGE_KEY) || document.documentElement.dataset.theme)
    document.documentElement.dataset.theme = savedTheme
    setTheme(savedTheme)
  }, [])

  function applyTheme(nextTheme) {
    nextTheme = normalizeTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
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
      className="admin-theme-toggle"
      aria-label={`Switch admin dashboard to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'light'}
      onClick={toggleTheme}
    >
      <img
        className={theme === 'dark' ? 'admin-theme-toggle-image admin-theme-toggle-image-active' : 'admin-theme-toggle-image'}
        src="/admin/auth_theme_toggle.svg"
        alt=""
        aria-hidden="true"
      />
      <img
        className={theme === 'light' ? 'admin-theme-toggle-image admin-theme-toggle-image-light admin-theme-toggle-image-active' : 'admin-theme-toggle-image admin-theme-toggle-image-light'}
        src="/admin/auth_theme_toggle_light.svg"
        alt=""
        aria-hidden="true"
      />
    </button>
  )
}
