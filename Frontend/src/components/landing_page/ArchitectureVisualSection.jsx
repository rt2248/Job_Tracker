import React from 'react'

export default function ArchitectureVisualSection() {
  return (
    <section className="py-20 md:py-28 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-12">
          <h2
            data-reveal
            style={{ '--delay': 0 }}
            className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4"
          >
            Engineering discipline for your career.
          </h2>
          <p
            data-reveal
            style={{ '--delay': 1 }}
            className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans"
          >
            Job hunting requires the same rigor as distributed systems: persistent records, verified pipelines, and predictable state transitions.
          </p>
        </div>

        {/* 2-Part Visual Mosaic */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Tile 1: Architectural Network Grid */}
          <div
            data-reveal
            style={{ '--delay': 1, minHeight: '340px' }}
            className="md:col-span-7 rounded-xl overflow-hidden bg-surface-primary"
          >
            <img
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80"
              alt="Data network cables and server infrastructure representing application pipeline integrity"
              className="w-full h-64 sm:h-80 md:h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Tile 2: Motion Video Stream / Visual Fragment */}
          <div
            data-reveal
            style={{ '--delay': 2, minHeight: '340px' }}
            className="md:col-span-5 rounded-xl overflow-hidden bg-surface-primary flex flex-col justify-between"
          >
            <div className="relative w-full h-64 sm:h-72 flex-1 overflow-hidden bg-surface-secondary">
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"
                alt="Digital telemetry screens and server activity monitors"
                className="w-full h-full object-cover opacity-80"
                loading="lazy"
              />
            </div>

            <div className="p-6 bg-surface-primary">
              <h3 className="font-display text-base font-bold text-white mb-1">
                Zero telemetry leakage
              </h3>
              <p className="text-sm text-ink-secondary">
                Your applications, salary notes, and contact histories remain entirely private to your account.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
