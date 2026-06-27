'use client'

import { useEffect, useState } from 'react'

const SCROLLED_OFFSET_PX = 20

export default function LandingHeaderScrollFrame({ children }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const updateScrolledState = () => {
      setIsScrolled(window.scrollY > SCROLLED_OFFSET_PX)
    }

    updateScrolledState()
    window.addEventListener('scroll', updateScrolledState, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrolledState)
    }
  }, [])

  return (
    <header className={isScrolled ? 'landing-header landing-header--scrolled' : 'landing-header'}>
      {children}
    </header>
  )
}
