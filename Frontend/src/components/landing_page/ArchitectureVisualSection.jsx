import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import applicationJourney from '../../assets/landing/application-journey.svg'
import followUpNotes from '../../assets/landing/follow-up-notes.svg'

export default function ArchitectureVisualSection() {
  const sectionRef = useRef(null)
  const tile1Ref = useRef(null)
  const tile2Ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const targets = [tile1Ref.current, tile2Ref.current].filter(Boolean)
    const tween = gsap.fromTo(targets, { opacity: 0, y: 18 }, {
      opacity: 1, y: 0, duration: 0.55, stagger: 0.12, ease: 'power2.out', paused: true,
    })
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      tween.play()
      observer.disconnect()
    }, { threshold: 0.15 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => { observer.disconnect(); tween.kill() }
  }, [])

  return (
    <section ref={sectionRef} className="landing-story-section py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="landing-eyebrow mb-4">A search with a sense of direction</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            Make the next step <span className="text-metallic-silver">easy to find.</span>
          </h2>
          <p className="landing-copy text-base sm:text-lg leading-relaxed max-w-xl">
            Keep an opportunity, its history, and your next action connected as your search moves forward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <article ref={tile1Ref} className="landing-story-panel md:col-span-7 overflow-hidden flex flex-col">
            <div className="relative w-full aspect-[1.55] overflow-hidden">
              <img src={applicationJourney} alt="Illustrated path showing an opportunity moving from saved to applied, interview, follow-up, and decision" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-6 border-t landing-divider">
              <p className="landing-eyebrow mb-2">The application journey</p>
              <h3 className="font-display text-lg sm:text-xl font-bold mb-2">See where each opportunity stands</h3>
              <p className="landing-copy text-sm sm:text-base leading-relaxed">A simple stage view turns scattered job-search updates into a sequence you can act on.</p>
            </div>
          </article>

          <article ref={tile2Ref} className="landing-story-panel md:col-span-5 overflow-hidden flex flex-col">
            <div className="relative w-full aspect-[1.38] overflow-hidden">
              <img src={followUpNotes} alt="Illustrated application notes timeline with an interview preparation note, saved role, and follow-up reminder" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-6 border-t landing-divider flex-1">
              <p className="landing-eyebrow mb-2">The useful details</p>
              <h3 className="font-display text-lg sm:text-xl font-bold mb-2">Keep context beside the role</h3>
              <p className="landing-copy text-sm sm:text-base leading-relaxed">Collect notes, contact details, and follow-up reminders where you will look for them again.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
