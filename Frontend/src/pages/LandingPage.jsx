import React from 'react'
import NavBar from '../components/landing_page/NavBar'
import Hero from '../components/landing_page/Hero'
import WorkflowSection from '../components/landing_page/WorkflowSection'
import ProductShowcase from '../components/landing_page/ProductShowcase'
import CapabilitiesSection from '../components/landing_page/CapabilitiesSection'
import AutomationCTA from '../components/landing_page/AutomationCTA'
import Footer from '../components/landing_page/Footer'

const LandingPage = () => {
  return (
    <div className="bg-canvas min-h-screen text-ink font-sans overflow-x-hidden selection:bg-white selection:text-black">
      <NavBar />
      <main>
        <Hero />
        <WorkflowSection />
        <ProductShowcase />
        <CapabilitiesSection />
        <AutomationCTA />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
