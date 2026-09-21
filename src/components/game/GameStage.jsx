import { createContext, useContext, useEffect, useState } from 'react'
import room from '../../assets/game/room.png'
import cauldron from '../../assets/game/cauldron.png'
import cauldronGlow from '../../assets/game/cauldron-glow.svg'
import CauldronEffects from './CauldronEffects.jsx'
import RoomLights from './RoomLights.jsx'
import CloseButton from './CloseButton.jsx'

/*
 * Shared backdrop for every game screen: the dungeon room, the cauldron and
 * the sizing rules.
 *
 * The Figma frame is 1728 x 1063. Two scales are derived from the viewport:
 *   s  scale of the artwork - "cover", so the room always fills the screen
 *   u  scale of the text/UI - equal to s on desktop (pixel-match with Figma),
 *      a bit larger on phones so text stays readable
 * Sizes inside the UI are written in design px and turned into real px with
 * d(n) = calc(var(--u) * n px).
 */

const FRAME_W = 1728
const FRAME_H = 1063

// design px -> real px (uses the --u variable set by <GameStage>)
export const d = (n) => `calc(var(--u) * ${n}px)`

function measure() {
  const W = window.innerWidth
  const H = window.innerHeight
  const s = Math.max(W / FRAME_W, H / FRAME_H)
  const u = W < 700 ? Math.min(s, Math.max(0.5, (W - 32) / 560)) : s
  return { W, H, s, u }
}

const GameScaleContext = createContext(null)
export const useGameScale = () => useContext(GameScaleContext)

function useViewportScale() {
  const [scale, setScale] = useState(measure)
  useEffect(() => {
    const onResize = () => setScale(measure())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}

// Screen y for a y coordinate of the Figma frame.
export const frameY = ({ H, s }, y) => H / 2 + (y - FRAME_H / 2) * s

// `onClose` adds the X in the top-right corner (leaves the game); `hideClose`
// is for the card screen, which has its own X next to the card.
export default function GameStage({ children, showCauldron = true, dim = 0, intense = false, onClose, hideClose = false }) {
  const scale = useViewportScale()
  const { W, H, s, u } = scale

  return (
    <GameScaleContext.Provider value={scale}>
      <div
        className="game-arrive fixed inset-0 overflow-hidden bg-[#0b0507]"
        style={{ '--u': u, '--s': s }}
      >
        {/* room (Figma "image 38": 1777 x 1085, centred on the frame) */}
        <img
          src={room}
          alt=""
          draggable="false"
          className="pointer-events-none absolute max-w-none select-none"
          style={{
            width: 1777 * s,
            height: 1085 * s,
            left: W / 2 - (1777 * s) / 2,
            top: H / 2 - (1085 * s) / 2,
          }}
        />

        {/* candles, bottle and skull eyes flicker */}
        <RoomLights />

        {/* cauldron + its effects; fades away on the result screen */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{ opacity: showCauldron ? 1 : 0 }}
        >
          {/* cauldron (Figma "image 39") */}
          <img
            src={cauldron}
            alt=""
            draggable="false"
            className="absolute max-w-none select-none"
            style={{
              width: 530 * s,
              height: 579 * s,
              left: W / 2 + 1 * s - (530 * s) / 2,
              top: frameY(scale, 695),
            }}
          />
          {/* glow on the potion */}
          <div
            className="absolute mix-blend-screen"
            style={{
              width: 358 * s,
              height: 130 * s,
              left: W / 2 + (685 - FRAME_W / 2) * s,
              top: frameY(scale, 776),
            }}
          >
            <div className="absolute" style={{ inset: '-37.77% -13.72%' }}>
              <img src={cauldronGlow} alt="" className="block size-full max-w-none" />
            </div>
          </div>
          {/* bubbling, glow, wisps (positioned on the cauldron picture) */}
          <div
            className="absolute"
            style={{
              width: 530 * s,
              height: 579 * s,
              left: W / 2 + 1 * s - (530 * s) / 2,
              top: frameY(scale, 695),
            }}
          >
            <CauldronEffects intense={intense} />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-700"
          style={{ opacity: dim }}
        />

        {/* rough hand-drawn edge used by the option pills */}
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <filter id="pill-wobble" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {children}

        {onClose && !hideClose && (
          <CloseButton
            onClick={onClose}
            label="Close game and go back home"
            className="late-in absolute z-30"
            style={{ right: `max(16px, ${d(40)})`, top: `max(16px, ${d(40)})` }}
          />
        )}
      </div>
    </GameScaleContext.Provider>
  )
}

// Centred column whose top edge sits at `top` (a y of the Figma frame).
export function ScreenContent({ top, width = 900, className = '', children }) {
  const scale = useGameScale()
  return (
    <div
      className={`screen-in absolute left-1/2 flex -translate-x-1/2 flex-col items-center ${className}`}
      style={{ top: frameY(scale, top), width: `min(${d(width)}, ${scale.W - 32}px)` }}
    >
      {children}
    </div>
  )
}
