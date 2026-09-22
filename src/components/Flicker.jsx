import { stageBoxCentered } from './stageBox.js'

// Warm light layers laid over the pumpkin's eyes/mouth and the candle flames.
// Each one breathes on its own slightly irregular cycle, kept small on purpose.
const WARM =
  'radial-gradient(closest-side, rgba(255,214,96,1), rgba(255,150,40,.55) 50%, transparent 100%)'
const HALO =
  'radial-gradient(closest-side, rgba(255,170,60,.4), rgba(255,130,30,.16) 55%, transparent 100%)'

// cx/cy: centre in design px, w/h: size in design px, cls: flicker variant.
// Pumpkin: eyes + mouth. They are drawn by <PumpkinGlows/> inside the pumpkin
// button (so they tilt with it); positions are relative to the pumpkin's box.
const PUMPKIN_BOX = { x: 591, y: 691, w: 171, h: 164 }
const PUMPKIN_GLOWS = [
  { cx: 682, cy: 758, w: 64, h: 50, bg: WARM, cls: 'flicker-a', delay: 0 },
  { cx: 739, cy: 760, w: 54, h: 44, bg: WARM, cls: 'flicker-b', delay: -0.83 },
  { cx: 699, cy: 806, w: 132, h: 48, bg: WARM, cls: 'flicker-c soft', delay: -1.66 },
]

const GLOWS = [
  // candles on the left
  { cx: 165, cy: 880, w: 30, h: 46, bg: WARM, cls: 'flicker-b' },
  { cx: 190, cy: 899, w: 28, h: 42, bg: WARM, cls: 'flicker-a' },
  { cx: 178, cy: 900, w: 130, h: 110, bg: HALO, cls: 'flicker-c' },
  // candles on the right
  { cx: 1544, cy: 952, w: 28, h: 42, bg: WARM, cls: 'flicker-a' },
  { cx: 1564, cy: 937, w: 30, h: 46, bg: WARM, cls: 'flicker-b' },
  { cx: 1554, cy: 950, w: 130, h: 110, bg: HALO, cls: 'flicker-c' },
]

export function PumpkinGlows() {
  const { x, y, w: bw, h: bh } = PUMPKIN_BOX
  return PUMPKIN_GLOWS.map(({ cx, cy, w, h, bg, cls, delay }, i) => (
    <span
      key={i}
      aria-hidden="true"
      className={`flicker ${cls} pointer-events-none absolute mix-blend-screen`}
      style={{
        left: `${((cx - w / 2 - x) / bw) * 100}%`,
        top: `${((cy - h / 2 - y) / bh) * 100}%`,
        width: `${(w / bw) * 100}%`,
        height: `${(h / bh) * 100}%`,
        background: bg,
        animationDelay: `${delay}s`,
      }}
    />
  ))
}

export default function Flicker() {
  return GLOWS.map(({ cx, cy, w, h, bg, cls }, i) => (
    <div
      key={i}
      aria-hidden="true"
      className={`flicker ${cls} pointer-events-none absolute mix-blend-screen`}
      style={{
        ...stageBoxCentered(cx, cy, w, h),
        background: bg,
        animationDelay: `${-((i + 3) * 0.83).toFixed(2)}s`,
      }}
    />
  ))
}
