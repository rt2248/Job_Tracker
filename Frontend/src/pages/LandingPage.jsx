import React, { useCallback, useEffect, useState } from 'react'
import NavBar from '../components/landing_page/NavBar'
import Hero from '../components/landing_page/Hero'
import LiveSearchShowcase from '../components/landing_page/LiveSearchShowcase'
import WorkflowStageSection from '../components/landing_page/WorkflowStageSection'
import ArchitectureVisualSection from '../components/landing_page/ArchitectureVisualSection'
import CapabilitiesSection from '../components/landing_page/CapabilitiesSection'
import CreateApplicationCTA from '../components/landing_page/CreateApplicationCTA'
import Footer from '../components/landing_page/Footer'
import './landing-page.css'

const THEME_KEY = 'evolexa.landing-theme'

export default function LandingPage() {
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      // The selected theme remains available for this page view.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }, [])

  return (
    <div className="landing-page" data-theme={theme}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <LiveSearchShowcase />
        <WorkflowStageSection />
        <ArchitectureVisualSection />
        <CapabilitiesSection />
        <CreateApplicationCTA />
      </main>
      <Footer />
    </div>
  )
}
