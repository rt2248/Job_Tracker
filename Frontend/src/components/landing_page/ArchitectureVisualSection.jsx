import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'

export default function ArchitectureVisualSection() {
  const sectionRef = useRef(null)
  const tile1Ref = useRef(null)
  const tile2Ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (tile1Ref.current) {
              gsap.fromTo(
                tile1Ref.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
              )
            }
            if (tile2Ref.current) {
              gsap.fromTo(
                tile2Ref.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.15 }
              )
            }
            observer.disconnect()
          }
        })
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-14">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            <span>Engineering discipline </span>
            <span className="text-metallic-silver">for your career.</span>
          </h2>
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans max-w-xl">
            Job hunting requires the same rigor as distributed systems: persistent records, verified pipelines, and predictable state transitions.
          </p>
        </div>

        {/* 2-Part Visual Mosaic */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Tile 1: Architectural Precision Monolith */}
          <div
            ref={tile1Ref}
            className="md:col-span-7 rounded-2xl overflow-hidden surface-metallic-panel relative group flex flex-col justify-between bg-[#0a0d14]"
          >
            <div className="relative w-full h-72 sm:h-96 md:h-full min-h-[340px] overflow-hidden">
              <img
                src="/images/pipeline_stage_progression.jpg"
                alt="Sophisticated dark engineering visualization of a job application pipeline with connected stages Wishlist, Applied, Interview, Offer"
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e121a] via-[#0e121a]/15 to-transparent" />
              
              {/* Telemetry Tag Overlay */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-white/10 text-[13px] font-mono text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>PIPELINE_FLOW // DETERMINISTIC STATE MACHINE</span>
              </div>
            </div>

            <div className="p-6 bg-[#0e121a] border-t border-white/[0.08] relative z-10">
              <h3 className="font-display text-base sm:text-lg font-bold text-white mb-1.5">
                Deterministic Stage Progression
              </h3>
              <p className="text-sm sm:text-base text-ink-secondary font-sans leading-relaxed">
                Eliminate ambiguity. Every application advances through mathematically enforced states from wishlist to accepted offer.
              </p>
            </div>
          </div>

          {/* Tile 2: Live Telemetry Stream Video / Visual Fragment */}
          <div
            ref={tile2Ref}
            className="md:col-span-5 rounded-2xl overflow-hidden surface-metallic-panel flex flex-col justify-between bg-[#0a0d14]"
          >
            {/* Real Looping Telemetry Video */}
            <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-black flex items-center justify-center">
              <video
                src="/videos/telemetry_stream.webm"
                poster="/videos/telemetry_poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover opacity-90"
                aria-label="Secure local cryptographic data vault with zero external telemetry leakage"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e121a] via-transparent to-black/30 pointer-events-none" />

              {/* Status Pill in Corner */}
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-black/85 border border-white/10 text-[13px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>VAULT_ENCLAVE: ACTIVE</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 bg-[#0e121a] border-t border-white/[0.08] space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted mb-2">
                  <span>DATA ISOLATION PROTOCOL</span>
                  <span className="text-emerald-400">100% PRIVATE</span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white mb-1.5">
                  Zero telemetry leakage
                </h3>
                <p className="text-sm sm:text-base text-ink-secondary leading-relaxed font-sans">
                  Your applications, salary negotiations, notes, and contact histories remain strictly private to your account.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-white/[0.06] text-[13px] font-mono text-white/70 flex items-center justify-between">
                <span>LOCAL_STORAGE: AES-256</span>
                <span className="text-white/40">NO THIRD-PARTY PIXELS</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
