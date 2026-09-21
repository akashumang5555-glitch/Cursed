import { useEffect, useRef } from 'react'
import { GATE_OUTLINE } from '../data/gateOutline.js'
import { isLow } from '../game/perf.js'

/*
 * Rain over the whole viewport, interacting ONLY with the stone gate.
 *
 * - The canvas is fixed to the viewport, so drops fall through the full height
 *   of the screen at any size (and keep falling while the page scrolls).
 * - Same idea as the original snippet: a "front row" and a dimmer, shorter
 *   "back row" of drops with random speeds and lengths.
 * - The only thing the rain touches is the top edge of the gate. That edge is
 *   read from the Figma gate image (src/data/gateOutline.js), so water lands
 *   on the real stones: lintel, capitals, ledges.
 *   The rain is slanted (wind from the left, about 14 degrees), so the hit test
 *   follows each drop's slanted path. A drop that hits it
 *      1. splashes a few tiny droplets,
 *   2. adds to a bead of water that collects (jama) on that spot,
 *   3. and once the bead is heavy enough it sags, breaks off and runs down the
 *      wall until it reaches the base of the gate.
 * - Nothing else is affected: the portal, the pumpkin and the ground are just
 *   rained past.
 */

const FRAME_W = 1728

// The portal doorway (Figma frame px): sparks drift out of it.
const DOOR = { cx: 865.7, cy: 663.9, U: 72.2 }
const RAIN_RGB = '196, 226, 240'
const WATER_RGB = '214, 238, 250'

const { step: STEP, x0: X0, top: TOP, bottom: BOTTOM } = GATE_OUTLINE
const SAMPLES = TOP.length
const SITE = 8 // profile samples per water site (~9 design px of ledge)

// Wind: drops lean to the right as they fall (angle from vertical).
const SLOPE = Math.tan((14 * Math.PI) / 180) // sideways speed per unit of falling speed
const DIR_X = SLOPE / Math.hypot(SLOPE, 1) // unit vector along a drop's path
const DIR_Y = 1 / Math.hypot(SLOPE, 1)

// Overall amount of rain (1 = the original density).
const DENSITY = 0.7

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Stone top edge at profile sample i (design px), or -1 if no usable stone.
const edgeY = (i) => (TOP[i] > 0 && TOP[i] < 700 ? TOP[i] : -1)

function startRain(canvas, getStage) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  let W = 0
  let H = 0
  let s = 1 // size scale for streaks / droplets

  const back = []
  const front = []
  const bits = [] // splash droplets
  const drips = [] // water running down the wall
  const wet = [] // fading wet streaks left behind by drips

  // One water site per stretch of ledge; water collects here before falling.
  const sites = []
  for (let c = 0; c < SAMPLES; c += SITE) {
    const mid = Math.min(SAMPLES - 1, c + (SITE >> 1))
    sites.push({ mid, water: 0, limit: rand(1.0, 1.6) })
  }

  // Where the artwork frame sits on the screen right now.
  function placement() {
    const stage = getStage()
    const k = stage.width / FRAME_W
    return { k, left: stage.left, top: stage.top - window.scrollY }
  }

  // ---- drops --------------------------------------------------------------

  function spawn(d, isFront, initial) {
    d.front = isFront
    d.len = (isFront ? rand(22, 40) : rand(12, 22)) * s
    d.vy = (isFront ? rand(950, 1350) : rand(650, 900)) * s
    d.vx = d.vy * SLOPE
    d.y = initial ? rand(-d.len, H) : -d.len - rand(0, H * 0.25)
    // x where this drop's slanted path crosses the top of the screen; the range
    // is shifted left so the whole width is rained on at every height
    d.x = rand(-SLOPE * H, W) + SLOPE * d.y
  }

  function build() {
    back.length = front.length = 0
    const dens = clamp(H / 900, 0.7, 1.5)
    const nFront = Math.round(clamp(W / 14, 36, 140) * dens * DENSITY * (isLow() ? 0.6 : 1))
    const nBack = Math.round(clamp(W / 11, 44, 170) * dens * DENSITY * (isLow() ? 0.6 : 1))
    for (let i = 0; i < nBack; i++) {
      const d = {}
      spawn(d, false, true)
      back.push(d)
    }
    for (let i = 0; i < nFront; i++) {
      const d = {}
      spawn(d, true, true)
      front.push(d)
    }
  }

  // ---- gate interaction ---------------------------------------------------

  function splash(x, y) {
    if (bits.length > 260) return
    const n = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < n; i++) {
      bits.push({
        x,
        y,
        vx: rand(-60, 120) * s,
        vy: -rand(60, 150) * s,
        t: 0,
        life: rand(0.18, 0.38),
        r: rand(0.6, 1.1) * s,
      })
    }
  }

  function hitGate(idx, x, y) {
    splash(x, y)
    const site = sites[Math.floor(idx / SITE)]
    site.water += rand(0.14, 0.24)
  }

  function releaseDrip(site, p) {
    const i = site.mid
    const x = p.left + (X0 + i * STEP) * p.k
    const y = p.top + edgeY(i) * p.k
    const floor = BOTTOM[i] > 0 ? p.top + BOTTOM[i] * p.k : y + 140 * p.k
    drips.push({
      x,
      y0: y,
      y,
      vy: rand(15, 40) * p.k,
      ay: rand(1300, 1900) * p.k,
      floor,
      r: rand(1.5, 2.3) * Math.max(0.7, p.k),
    })
    site.water = rand(0.04, 0.14) // a little stays behind
    site.limit = rand(1.0, 1.6)
  }

  // ---- simulation / drawing -----------------------------------------------

  function drawStreaks(list, width, alpha) {
    ctx.beginPath()
    for (const d of list) {
      ctx.moveTo(d.x - d.len * DIR_X, d.y - d.len * DIR_Y)
      ctx.lineTo(d.x, d.y)
    }
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.strokeStyle = `rgba(${RAIN_RGB}, ${alpha})`
    ctx.stroke()
  }

  function stepDrops(list, p, dt) {
    for (const d of list) {
      const prevY = d.y
      d.x += d.vx * dt
      d.y += d.vy * dt

      // did this drop just cross the stone's top edge?
      const i = Math.round((((d.x - p.left) / p.k) - X0) / STEP)
      if (i >= 0 && i < SAMPLES) {
        const e = edgeY(i)
        if (e > 0) {
          const edge = p.top + e * p.k
          if (prevY < edge && d.y >= edge) {
            if (d.front) hitGate(i, d.x, edge)
            spawn(d, d.front, false)
            continue
          }
        }
      }

      if (d.y - d.len > H || d.x - d.len * DIR_X > W + 40) spawn(d, d.front, false)
    }
  }

  // Bead of collected water sitting on the ledge; sags before it lets go.
  function drawBead(site, p) {
    if (site.water < 0.06) return
    const i = site.mid
    const ey = edgeY(i)
    if (ey < 0) return
    const cx = p.left + (X0 + i * STEP) * p.k
    const cy = p.top + ey * p.k
    const fill = clamp(site.water / site.limit, 0, 1)
    const w = (2.4 + fill * 6) * p.k
    const h = (0.9 + fill * 2) * p.k
    const sag = fill > 0.75 ? ((fill - 0.75) / 0.25) * 4.5 * p.k : 0

    ctx.fillStyle = `rgba(${WATER_RGB}, ${0.18 + 0.3 * fill})`
    ctx.beginPath()
    ctx.ellipse(cx, cy - h * 0.35, w, h, 0, 0, Math.PI * 2)
    ctx.fill()
    if (sag > 0) {
      ctx.beginPath()
      ctx.ellipse(cx, cy + sag * 0.5, w * 0.36, h * 0.7 + sag * 0.6, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + 0.35 * fill})`
    ctx.beginPath()
    ctx.ellipse(cx - w * 0.25, cy - h * 0.6, w * 0.3, h * 0.28, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // ---- sparks drifting out of the portal -------------------------------------
  // (drawn here, on the canvas that already exists, instead of 16 blended
  // page elements)
  const embers = Array.from({ length: 10 }, () => {
    const dur = rand(2.6, 5.2)
    return {
      x: rand(-0.8, 0.8) * DOOR.U,
      y: rand(-0.3, 1.1) * DOOR.U,
      size: rand(1.6, 3.4),
      rise: rand(70, 190),
      drift: rand(-90, 90),
      dur,
      phase: rand(0, dur),
    }
  })
  const emberStart = performance.now()

  function drawEmbers(now, p) {
    if (isLow()) return
    const sec = now / 1000
    const fadeIn = clamp((now - emberStart) / 1500 - 0.3, 0, 1) // appear as the portal opens
    if (fadeIn <= 0) return
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const e of embers) {
      const u = ((sec + e.phase) % e.dur) / e.dur
      const a = (u < 0.14 ? u / 0.14 : 1 - (u - 0.14) / 0.86) * fadeIn
      if (a <= 0.02) continue
      const x = p.left + (DOOR.cx + e.x + e.drift * u) * p.k
      const y = p.top + (DOOR.cy + e.y - e.rise * u) * p.k
      const r = e.size * p.k * (1 - u * 0.6)
      ctx.fillStyle = `rgba(255,60,60,${(a * 0.35).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(x, y, r * 2.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(255,225,215,${(a * 0.95).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  let last = 0
  let raf = 0
  let stopped = false

  function frame(now) {
    if (stopped) return
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016
    last = now

    // the dive hides the rain; don't spend any GPU/CPU on it meanwhile
    if (document.documentElement.classList.contains('diving')) {
      ctx.clearRect(0, 0, W, H)
      raf = requestAnimationFrame(frame)
      return
    }
    const p = placement()

    stepDrops(back, p, dt)
    stepDrops(front, p, dt)

    // water collects, slowly dries, and eventually breaks off
    for (const site of sites) {
      site.water = Math.max(0, site.water - 0.05 * dt)
      if (site.water >= site.limit && drips.length < 60) releaseDrip(site, p)
    }

    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i]
      d.vy += d.ay * dt
      d.y += d.vy * dt
      if (d.y >= d.floor) {
        wet.push({ x: d.x, y0: d.y0, y1: d.floor, t: 0 })
        splash(d.x, d.floor)
        drips[i] = drips[drips.length - 1]
        drips.pop()
      }
    }

    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i]
      b.t += dt
      if (b.t >= b.life) {
        bits[i] = bits[bits.length - 1]
        bits.pop()
        continue
      }
      b.vy += 1300 * s * dt
      b.x += b.vx * dt
      b.y += b.vy * dt
    }

    for (let i = wet.length - 1; i >= 0; i--) {
      wet[i].t += dt
      if (wet[i].t > 1.4) {
        wet[i] = wet[wet.length - 1]
        wet.pop()
      }
    }

    // --- draw
    ctx.clearRect(0, 0, W, H)
    drawStreaks(back, Math.max(0.8, 1.0 * s), 0.2)
    drawStreaks(front, Math.max(1, 1.5 * s), 0.38)

    // wet streaks left on the wall by water that ran down
    ctx.lineCap = 'round'
    ctx.lineWidth = Math.max(1, 1.4 * p.k)
    for (const w of wet) {
      ctx.strokeStyle = `rgba(${WATER_RGB}, ${0.16 * (1 - w.t / 1.4)})`
      ctx.beginPath()
      ctx.moveTo(w.x, w.y0)
      ctx.lineTo(w.x, w.y1)
      ctx.stroke()
    }

    for (const site of sites) drawBead(site, p)

    // drips: a rounded head with a tail while they run down the wall
    for (const d of drips) {
      const tail = Math.min(d.y - d.y0, 12 * p.k + d.vy * 0.03)
      const g = ctx.createLinearGradient(0, d.y - tail, 0, d.y)
      g.addColorStop(0, `rgba(${WATER_RGB}, 0)`)
      g.addColorStop(1, `rgba(${WATER_RGB}, 0.8)`)
      ctx.strokeStyle = g
      ctx.lineWidth = d.r * 1.1
      ctx.beginPath()
      ctx.moveTo(d.x, d.y - tail)
      ctx.lineTo(d.x, d.y)
      ctx.stroke()
      ctx.fillStyle = `rgba(${WATER_RGB}, 0.95)`
      ctx.beginPath()
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
      ctx.fill()
    }

    drawEmbers(now, p)

    for (const b of bits) {
      ctx.fillStyle = `rgba(${WATER_RGB}, ${1 - b.t / b.life})`
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
    }

    raf = requestAnimationFrame(frame)
  }

  let built = false

  function resize() {
    // thin 1px streaks look the same on a 1x canvas, and it's 2-4x fewer pixels to redraw
    const dpr = 1
    const newW = canvas.clientWidth
    const newH = canvas.clientHeight
    // a small height change (e.g. a phone's address bar sliding away) must not
    // wipe the rain and the water collected on the stones: only resize the canvas
    const minor = built && Math.abs(newW - W) < 2 && Math.abs(newH - H) < Math.max(90, H * 0.12)
    W = newW
    H = newH
    canvas.width = Math.max(2, Math.round(W * dpr))
    canvas.height = Math.max(2, Math.round(H * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (minor) return
    s = clamp(getStage().width / FRAME_W, 0.55, 1.5)
    for (const site of sites) site.water = 0
    drips.length = bits.length = wet.length = 0
    build()
    built = true
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  raf = requestAnimationFrame(frame)

  return () => {
    stopped = true
    cancelAnimationFrame(raf)
    observer.disconnect()
  }
}

// Viewport-sized overlay. `stage` is the artwork frame's current placement (px),
// so the rain knows where the gate's stones are at any screen size.
export default function Rain({ stage }) {
  const canvasRef = useRef(null)
  const stageRef = useRef(stage)
  stageRef.current = stage

  useEffect(() => startRain(canvasRef.current, () => stageRef.current) ?? undefined, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-dive="fade"
      className="pointer-events-none fixed inset-0 size-full"
    />
  )
}
