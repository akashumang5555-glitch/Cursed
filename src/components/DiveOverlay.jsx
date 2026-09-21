import { useEffect, useRef } from 'react'
import { DIVE_MS } from '../game/dive.js'
import { isLow } from '../game/perf.js'

// Glowing embers that stream past the camera, radiating from the portal.
function Embers({ x, y }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const dpr = 1 // thin streaks don't need a retina canvas
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const reach = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 120
    const embers = Array.from({ length: 48 }, () => {
      const angle = Math.random() * Math.PI * 2
      return {
        cos: Math.cos(angle),
        sin: Math.sin(angle),
        start: Math.random() * 0.5, // seconds after the click
        r0: 6 + Math.random() * 55,
        speed: 0.55 + Math.random() * 0.75,
        size: 0.7 + Math.random() * 1.7,
        warm: Math.random() < 0.55,
      }
    })

    const t0 = performance.now()
    const total = DIVE_MS / 1000 + 0.35
    let raf = 0

    function frame(now) {
      const t = (now - t0) / 1000
      ctx.clearRect(0, 0, W, H)
      if (t > total) return
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      for (const e of embers) {
        const u = t - e.start
        if (u <= 0) continue
        const prog = Math.pow(u / 0.85, 2.3) * e.speed
        const r = e.r0 + prog * reach
        const len = Math.min(r - e.r0, 5 + prog * reach * 0.22)
        const alpha = Math.min(1, u * 5) * Math.max(0, 1 - Math.max(0, prog - 0.8) * 4)
        if (alpha <= 0.01) continue
        // soft wide stroke + thin bright core (instead of a costly canvas shadow blur)
        const x0 = x + e.cos * (r - len)
        const y0 = y + e.sin * (r - len)
        const x1 = x + e.cos * r
        const y1 = y + e.sin * r
        const w = e.size * (0.7 + prog * 1.5)
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.lineWidth = w * 3.2
        ctx.strokeStyle = `rgba(255,70,70,${(alpha * 0.18).toFixed(3)})`
        ctx.stroke()
        ctx.lineWidth = w
        ctx.strokeStyle = e.warm ? `rgba(255,232,222,${(alpha * 0.9).toFixed(3)})` : `rgba(255,95,85,${(alpha * 0.9).toFixed(3)})`
        ctx.stroke()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [x, y])

  return <canvas ref={ref} className="absolute inset-0 size-full" />
}

// Everything drawn over the scene while flying into the portal (x / y = portal
// centre in viewport px): edge vignette, a growing bloom, a shockwave ring, a
// cinematic light flare, the embers, and finally the light that swallows the
// screen. It fades away to reveal the game room.
export default function DiveOverlay({ x, y }) {
  return (
    <div aria-hidden="true" className="dive-overlay" style={{ '--ox': `${x}px`, '--oy': `${y}px` }}>
      <div className="dive-vignette" />
      <div className="dive-bloom" />
      {!isLow() && <Embers x={x} y={y} />}
      <div className="dive-ring" />
      <div className="dive-streak" />
      <div className="dive-flash" />
    </div>
  )
}
