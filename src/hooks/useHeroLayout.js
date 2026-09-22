import { useEffect, useState } from 'react'

// Figma frame "Home page" and the background image's bounds inside it.
const FRAME = { w: 1728, h: 1063 }
const BG = { x: -7, w: 1736, h: 1074 }
// Point where the arch meets the ground: the artwork is anchored to the
// background here so it stays "standing" on the scenery at every size.
const ANCHOR = { x: 870, y: 877 }
// Design x that should sit in the middle of the screen on portrait screens
// (centre of logo + arch + tagline).
const PORTRAIT_CENTER_X = 950

function measure() {
  const W = window.innerWidth
  const vh = window.innerHeight
  const portrait = vh > W

  // Artwork scale (screen px per design px): exact 1:1 design at 1728px wide,
  // proportional on other landscape widths, enlarged on portrait screens so
  // the logo, arch and tagline stay readable.
  const sf = portrait ? W / 1000 : W / FRAME.w
  const cx = portrait ? PORTRAIT_CENTER_X : FRAME.w / 2

  // Hero is at least one screen tall, and never shorter than the artwork.
  const H = Math.max(vh, FRAME.h * sf)

  // Background scale: always covers the hero, never smaller than the artwork.
  const sb = Math.max(W / BG.w, H / BG.h, sf)

  // Artwork frame, centred on the screen.
  const stageLeft = W / 2 - cx * sf
  const stageTop = H / 2 - (FRAME.h / 2) * sf

  // Background placed so its ground lines up with the artwork, then clamped so
  // it still covers the whole hero.
  const anchorX = stageLeft + ANCHOR.x * sf
  const anchorY = stageTop + ANCHOR.y * sf
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  const bgW = BG.w * sb
  const bgH = BG.h * sb
  const bgLeft = clamp(anchorX - (ANCHOR.x - BG.x) * sb, W - bgW, 0)
  const bgTop = clamp(anchorY - ANCHOR.y * sb, H - bgH, 0)

  return {
    height: H,
    stage: { left: stageLeft, top: stageTop, width: FRAME.w * sf, height: FRAME.h * sf },
    bg: { left: bgLeft, top: bgTop, width: bgW, height: bgH },
  }
}

export default function useHeroLayout() {
  const [layout, setLayout] = useState(measure)

  useEffect(() => {
    const onResize = () => setLayout(measure())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return layout
}
