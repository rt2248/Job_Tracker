import React from 'react'
import NavBar from '../components/landing_page/NavBar'
import Hero from '../components/landing_page/Hero'
import LiveSearchShowcase from '../components/landing_page/LiveSearchShowcase'
import WorkflowStageSection from '../components/landing_page/WorkflowStageSection'
import ArchitectureVisualSection from '../components/landing_page/ArchitectureVisualSection'
import CapabilitiesSection from '../components/landing_page/CapabilitiesSection'
import CreateApplicationCTA from '../components/landing_page/CreateApplicationCTA'
import Footer from '../components/landing_page/Footer'
import useAppTheme from '../hooks/useAppTheme'
import './landing-page.css'

export default function LandingPage() {
  const { theme, toggleTheme } = useAppTheme()

  return (
    <div className="landing-page" data-theme={theme}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <LiveSearchShowcase />
        <WorkflowStageSection />
        <ArchitectureVisualSection theme={theme} />
        <CapabilitiesSection theme={theme} />
        <CreateApplicationCTA />
      </main>
      <Footer />
    </div>
  )
}
