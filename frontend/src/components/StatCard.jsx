import { useEffect, useRef } from 'react'
import { formatNumber } from '../utils/formatNumber'

export default function StatCard({ label, value, subtitle, icon: Icon, color = 'blue' }) {
  const valueRef = useRef(null)

  useEffect(() => {
    if (valueRef.current && typeof value === 'number') {
      animateCounter(valueRef.current, value)
    }
  }, [value])

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon">
          {Icon && <Icon style={{ color: `var(--accent-${color})` }} />}
        </div>
      </div>
      <div className="stat-value" ref={valueRef}>
        {typeof value === 'number' ? '0' : value}
      </div>
      {subtitle && <div className="stat-change">{subtitle}</div>}
    </div>
  )
}

function animateCounter(element, target, duration = 1500) {
  const startTime = performance.now()

  function update(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = Math.round(target * eased)
    element.textContent = formatNumber(current)
    if (progress < 1) requestAnimationFrame(update)
  }

  requestAnimationFrame(update)
}
