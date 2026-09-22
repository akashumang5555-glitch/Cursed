import { useEffect, useState } from 'react'
import skull from '../assets/icons/skull.png'

/*
 * Blocks the site on phones and tablets: below DESKTOP_BREAKPOINT it shows a
 * full-screen black notice instead of mounting the site at all. Mounting
 * nothing (rather than mounting the site and covering it) means none of the
 * site's game loops, timers or effects ever start on a small screen.
 *
 * This only wraps the site in main.jsx - it does not touch App.jsx or
 * anything inside it, so the desktop experience is unchanged.
 */

const DESKTOP_BREAKPOINT = 1024 // px; matches Tailwind's `lg` - covers phones and tablets

function useIsBelowDesktop() {
  const query = `(max-width: ${DESKTOP_BREAKPOINT - 1}px)`
  const [below, setBelow] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setBelow(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return below
}

function BlockedScreen() {
  // stop the page (and the notice itself) from scrolling while this is up
  useEffect(() => {
    const { style } = document.documentElement
    const prevOverflow = style.overflow
    const prevHeight = style.height
    style.overflow = 'hidden'
    style.height = '100%'
    return () => {
      style.overflow = prevOverflow
      style.height = prevHeight
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 overscroll-none bg-black px-8 text-center"
      style={{ width: '100vw', height: '100dvh', touchAction: 'none' }}
    >
      <img src={skull} alt="" draggable="false" className="h-20 w-20 select-none opacity-90 sm:h-24 sm:w-24" />
      <div>
        <p className="m-0 max-w-[20ch] font-serif-display text-[30px] leading-tight text-white sm:text-[34px]">
          Your device is too small to enter.
        </p>
        <p
          className="m-0 mt-1.5 text-[18px] text-[#eadada] sm:text-[20px]"
          style={{ fontFamily: '"Instrument Sans", sans-serif' }}
        >
          Come back on a desktop.
        </p>
      </div>
    </div>
  )
}

// Renders `children` on desktop; on phones/tablets it renders the block
// screen instead, so the site underneath is never mounted.
export default function DesktopOnlyGate({ children }) {
  const below = useIsBelowDesktop()
  return below ? <BlockedScreen /> : children
}
