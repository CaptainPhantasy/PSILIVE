'use client'

import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

// useLayoutEffect on the client (resets before paint, so no flash), plain
// useEffect during SSR (avoids the React SSR warning).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export default function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  // Initial state is the FINAL value so SSR / no-JS renders the real number.
  const [count, setCount] = useState(end ?? 0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })
  const hasAnimated = useRef(false)

  // Before the first client paint, reset to 0 so that when the counter later
  // enters the viewport the count-up starts cleanly from 0 — instead of the
  // old end → 0 → end flash. Without JS this never runs and the final value
  // stays on the page.
  useIsomorphicLayoutEffect(() => {
    setCount(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (inView && !hasAnimated?.current) {
      hasAnimated.current = true
      const startTime = Date.now()
      const animate = () => {
        const now = Date.now()
        const elapsed = now - startTime
        const progress = Math.min(elapsed / (duration ?? 2000), 1)
        
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(easeOut * (end ?? 0)))

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end ?? 0)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [inView, end, duration])

  return (
    <span ref={ref}>
      {prefix ?? ''}
      {(count ?? 0)?.toFixed?.(decimals ?? 0)}
      {suffix ?? ''}
    </span>
  )
}
