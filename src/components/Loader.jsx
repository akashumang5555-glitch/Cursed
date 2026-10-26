import { useEffect, useRef, useState } from 'react'
import { ICONS } from '../game/icons.js'

/*
 * First-visit loading screen: plain black, one thin line in the centre that
 * fills as the site's pictures download. The game's icon set rides the tip
 * of the line, swapping from one creature to the next. Once every picture
 * (and the fonts) is in the browser, the site mounts underneath and the
 * black screen fades away, so nothing pops in half-loaded.
 */

// every picture the site uses; the icons go first so the rider shows up quickly
const ICON_URLS = Object.values(ICONS)
const ALL_URLS = Object.values(
  import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp,gif}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)
const URLS = [...ICON_URLS, ...ALL_URLS.filter((u) => !ICON_URLS.includes(u))]

const SWAP_MS = 160 // how long each icon stays before the next one
const GIVE_UP_MS = 25000 // slow connection: open anyway rather than wait forever
const HOLD_MS = 350 // a beat at 100% before opening
const FADE_MS = 700

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(resolve)
    img.onerror = resolve // a missing picture must not block the site
    img.src = src
  })
}

export default function Loader({ children }) {
  const [progress, setProgress] = useState(0) // 0..1, downloaded share
  const [shown, setShown] = useState(0) // eased value the line draws
  const [phase, setPhase] = useState('loading') // loading | opening | done
  const [icon, setIcon] = useState(0)
  const shownRef = useRef(0)

  // download everything, counting as we go
  useEffect(() => {
    let done = 0
    let cancelled = false
    const total = URLS.length + 1 // + fonts
    const tick = () => !cancelled && setProgress(++done / total)
    const all = Promise.all([
      ...URLS.map((u) => loadImage(u).then(tick)),
      document.fonts.ready.then(tick),
    ])
    const timeout = new Promise((r) => setTimeout(r, GIVE_UP_MS))
    Promise.race([all, timeout]).then(() => !cancelled && setProgress(1))
    return () => {
      cancelled = true
    }
  }, [])

  // ease the drawn line toward the real progress so it glides, not jumps
  useEffect(() => {
    if (phase !== 'loading') return undefined
    let raf
    const step = () => {
      const next = shownRef.current + (progress - shownRef.current) * 0.12
      shownRef.current = progress - next < 0.002 ? progress : next
      setShown(shownRef.current)
      if (shownRef.current >= 1) {
        setTimeout(() => setPhase('opening'), HOLD_MS)
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [progress, phase])

  // cycle through the icon set
  useEffect(() => {
    if (phase === 'done') return undefined
    const t = setInterval(() => setIcon((i) => (i + 1) % ICON_URLS.length), SWAP_MS)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'opening') return undefined
    const t = setTimeout(() => setPhase('done'), FADE_MS)
    return () => clearTimeout(t)
  }, [phase])

  const pct = Math.round(shown * 100)

  return (
    <>
      {phase !== 'loading' && children}
      {phase !== 'done' && (
        <div
          className={`loader${phase === 'opening' ? ' is-opening' : ''}`}
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="loader-track">
            <div className="loader-fill" style={{ transform: `scaleX(${shown})` }} />
            <img
              key={icon}
              className="loader-icon"
              src={ICON_URLS[icon]}
              alt=""
              draggable="false"
              style={{ left: `${shown * 100}%` }}
            />
          </div>
          <p className="loader-pct">{pct}%</p>
        </div>
      )}
    </>
  )
}
