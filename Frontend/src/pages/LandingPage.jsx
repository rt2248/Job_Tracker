import React from 'react'
import NavBar from '../components/landing_page/NavBar'
import Hero from '../components/landing_page/Hero'
import LiveSearchShowcase from '../components/landing_page/LiveSearchShowcase'
import WorkflowStageSection from '../components/landing_page/WorkflowStageSection'
import ArchitectureVisualSection from '../components/landing_page/ArchitectureVisualSection'
import CapabilitiesSection from '../components/landing_page/CapabilitiesSection'
import CreateApplicationCTA from '../components/landing_page/CreateApplicationCTA'
import Footer from '../components/landing_page/Footer'

export default function LandingPage() {
  return (
    <div className="bg-canvas min-h-dvh text-white font-sans selection:bg-white selection:text-black">
      <NavBar />
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
