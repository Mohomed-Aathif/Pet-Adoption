import React, { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
    } else if (prefersDark) {
      setIsDark(true)
    }
    setMounted(true)
  }, [])

  // Update localStorage and document class when theme changes
  useEffect(() => {
    if (!mounted) return

    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark, mounted])

  const toggleTheme = () => setIsDark(prev => !prev)

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div className="h-screen bg-white dark:bg-gray-950" />
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
