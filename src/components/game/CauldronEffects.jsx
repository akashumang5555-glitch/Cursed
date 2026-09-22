/*
 * Living cauldron: a pulsing green glow, bubbles rising from the liquid and
 * popping, soft wisps drifting up, and the odd spark. Everything is CSS
 * animation, so it keeps moving on its own for as long as the game is open.
 *
 * Coordinates are in design px relative to the cauldron picture (530 x 579);
 * `--s` (set by <GameStage>) turns them into real px.
 */

const ds = (n) => `calc(var(--s) * ${n}px)`

// The liquid's surface (an ellipse) inside the cauldron picture.
const POOL = { cx: 265, cy: 153, rx: 140, ry: 30 }

// tiny seeded random so the layout is the same on every load
function mulberry32(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(2026)
const between = (a, b) => a + rnd() * (b - a)
const inPool = (spread) => ({
  x: POOL.cx + (rnd() * 2 - 1) * POOL.rx * spread,
  y: POOL.cy + (rnd() * 2 - 1) * POOL.ry * spread,
})

const BUBBLES = Array.from({ length: 12 }, () => {
  const dur = between(1.8, 4)
  return { ...inPool(0.85), size: between(5, 15), rise: between(28, 70), drift: between(-12, 12), dur, delay: -rnd() * dur }
})

const WISPS = Array.from({ length: 5 }, () => {
  const dur = between(6, 10.5)
  return { ...inPool(0.8), size: between(70, 130), rise: between(120, 220), sway: between(-40, 40), dur, delay: -rnd() * dur }
})

const SPARKS = Array.from({ length: 5 }, () => {
  const dur = between(1.1, 2.2)
  return { ...inPool(0.7), size: between(2, 3.6), rise: between(50, 110), drift: between(-30, 30), dur, delay: -rnd() * dur * 3 }
})

export default function CauldronEffects({ intense = false }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${intense ? 'cauldron-intense' : ''}`} aria-hidden="true">
      {/* wide, soft light on the wall and floor */}
      <div
        className="cauldron-ambient absolute mix-blend-screen"
        style={{
          left: ds(POOL.cx - 380),
          top: ds(POOL.cy - 300),
          width: ds(760),
          height: ds(460),
          background: 'radial-gradient(closest-side, rgba(60,255,120,.22), rgba(30,200,90,.08) 60%, transparent)',
        }}
      />

      {/* glow sitting on the liquid */}
      <div
        className="cauldron-glow absolute mix-blend-screen"
        style={{
          left: ds(POOL.cx - 210),
          top: ds(POOL.cy - 85),
          width: ds(420),
          height: ds(170),
          background: 'radial-gradient(closest-side, rgba(120,255,140,.75), rgba(50,225,95,.32) 55%, transparent)',
        }}
      />

      {WISPS.map((w, i) => (
        <span
          key={`w${i}`}
          className="cauldron-wisp absolute rounded-full"
          style={{
            left: ds(w.x - w.size / 2),
            top: ds(w.y - w.size / 2),
            width: ds(w.size),
            height: ds(w.size),
            background: 'radial-gradient(closest-side, rgba(120,255,155,.34), rgba(70,230,110,.12) 60%, transparent)',
            '--rise': w.rise,
            '--drift': w.sway,
            animationDuration: `${w.dur}s`,
            animationDelay: `${w.delay}s`,
          }}
        />
      ))}

      {BUBBLES.map((b, i) => (
        <span
          key={`b${i}`}
          className="cauldron-bubble absolute rounded-full"
          style={{
            left: ds(b.x - b.size / 2),
            top: ds(b.y - b.size / 2),
            width: ds(b.size),
            height: ds(b.size),
            '--rise': b.rise,
            '--drift': b.drift,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      {SPARKS.map((p, i) => (
        <span
          key={`s${i}`}
          className="cauldron-spark absolute rounded-full"
          style={{
            left: ds(p.x),
            top: ds(p.y),
            width: ds(p.size),
            height: ds(p.size),
            '--rise': p.rise,
            '--drift': p.drift,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
