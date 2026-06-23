/* ═══════════════════════════════════════════════════════════════
   AnimatedNumber — Renders a number that animates on change
   Uses countUp from confetti.ts for the actual animation.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react'
import { countUp, glowPulse } from '../confetti'

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
  style?: React.CSSProperties
  pulse?: boolean
}

export default function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 800,
  className = '',
  style = {},
  pulse = true,
}: AnimatedNumberProps) {
  const elRef = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(value)

  useEffect(() => {
    if (!elRef.current) return
    if (value !== prevValue.current) {
      countUp(elRef.current, value, duration, prefix, suffix, decimals)
      if (pulse && value > prevValue.current) {
        glowPulse(elRef.current, 'rgba(0,255,136,.4)', 400)
      }
      prevValue.current = value
    }
  }, [value, duration, prefix, suffix, decimals, pulse])

  return (
    <span
      ref={elRef}
      className={className}
      style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', ...style }}
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  )
}
