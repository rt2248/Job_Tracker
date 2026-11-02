import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'evolexa.theme'
const LEGACY_THEME_KEY = 'evolexa.landing-theme'
const THEME_CHANGE_EVENT = 'evolexa:theme-change'

function readTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_KEY)
      ?? window.localStorage.getItem(LEGACY_THEME_KEY)
    return savedTheme === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function applyDocumentTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export default function useAppTheme() {
  const [theme, setThemeState] = useState(readTheme)

  useEffect(() => {
    applyDocumentTheme(theme)

    const handleThemeChange = (event) => {
      const nextTheme = event.detail
      if (nextTheme === 'light' || nextTheme === 'dark') {
        setThemeState(nextTheme)
        applyDocumentTheme(nextTheme)
      } else {
        const fallback = readTheme()
        setThemeState(fallback)
        applyDocumentTheme(fallback)
      }
    }

    const handleStorageChange = (event) => {
      if (event.key === THEME_KEY || event.key === LEGACY_THEME_KEY) {
        const updated = readTheme()
        setThemeState(updated)
        applyDocumentTheme(updated)
      }
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [theme])

  const setTheme = useCallback((newTheme) => {
    const next = typeof newTheme === 'function' ? newTheme(readTheme()) : newTheme
    const validated = next === 'light' ? 'light' : 'dark'

    try {
      window.localStorage.setItem(THEME_KEY, validated)
    } catch {
      // Storage unavailable
    }

    applyDocumentTheme(validated)
    setThemeState(validated)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: validated }))
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}
