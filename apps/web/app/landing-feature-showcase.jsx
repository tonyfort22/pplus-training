'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'

export default function LandingFeatureShowcase({ features }) {
  const [activeSlug, setActiveSlug] = useState(features[0]?.slug)

  const activeFeature = useMemo(
    () => features.find((feature) => feature.slug === activeSlug) ?? features[0],
    [activeSlug, features],
  )

  return (
    <div className="landing-feature-showcase">
      <div className="landing-feature-list" role="tablist" aria-label="PPLUS Training features">
        {features.map((feature) => {
          const isActive = feature.slug === activeFeature.slug

          return (
            <button
              key={feature.slug}
              id={`feature-${feature.slug}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`feature-panel-${feature.slug}`}
              className="landing-feature-card"
              data-active={isActive ? 'true' : 'false'}
              onClick={() => setActiveSlug(feature.slug)}
            >
              <span className="landing-feature-card-copy">
                <span className="landing-feature-card-title">{feature.title}</span>
                <span className="landing-feature-card-description">{feature.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div
        id={`feature-panel-${activeFeature.slug}`}
        role="tabpanel"
        aria-labelledby={`feature-${activeFeature.slug}`}
        className="landing-feature-phone-shell"
      >
        <div className="landing-feature-phone-glow" aria-hidden="true" />
        <div className="landing-feature-phone-frame">
          <Image
            src={activeFeature.image}
            alt={activeFeature.alt}
            width={412}
            height={824}
            priority
            className="landing-feature-phone-image"
          />
        </div>
      </div>
    </div>
  )
}
