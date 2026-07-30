import { useState, useEffect } from 'react'
import NavBar from './components/landing_page/NavBar'
import Hero from './components/landing_page/Hero'
import StatsSection from './components/landing_page/StatsSection'
import WorkflowSection from './components/landing_page/WorkflowSection'
import FeaturesSection from './components/landing_page/FeaturesSection'
import AutomationCTA from './components/landing_page/AutomationCTA'
import Footer from './components/landing_page/Footer'

export default function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div className="bg-canvas min-h-screen text-ink font-body overflow-x-hidden">
      <div/>
      <NavBar />
      <Hero />
      <StatsSection />
      <WorkflowSection />
      <FeaturesSection />
      <AutomationCTA />
      <Footer />
    </div>
  )
}
