import { useGameScale, frameY } from './GameStage.jsx'

/*
 * Flickering light for the lit things in the game room: the two candles on the
 * left, the glowing bottle, and the eyes of the skull on the frame. Each light
 * flickers on its own cycle (the .flicker-* animations in index.css) and is
 * drawn additively over the room picture.
 *
 * Positions are in Figma frame px (1728 x 1063), measured on the room picture.
 */

const WARM = 'radial-gradient(closest-side, rgba(255,226,140,1), rgba(255,150,40,.6) 45%, transparent 100%)'
const WALL = 'radial-gradient(closest-side, rgba(255,150,60,.34), rgba(255,110,30,.14) 55%, transparent 100%)'
const GREEN = 'radial-gradient(closest-side, rgba(150,255,150,.8), rgba(60,220,90,.3) 55%, transparent 100%)'
const EYE = 'radial-gradient(closest-side, rgba(255,240,210,1), rgba(255,170,90,.55) 50%, transparent 100%)'

// [centre x, centre y, width, height, background, animation class]
const LIGHTS = [
  // candle on the shelf (with the skull and raven)
  [124, 152, 300, 300, WALL, 'flicker-c'],
  [124, 146, 34, 56, WARM, 'flicker-a'],
  // candle on the desk
  [31, 552, 300, 300, WALL, 'flicker-c'],
  [31, 546, 34, 56, WARM, 'flicker-b'],
  // potion bottle on the desk
  [208, 614, 90, 90, GREEN, 'flicker-c'],
  // eyes of the skull on the frame
  [851, 103, 28, 20, EYE, 'flicker-b'],
  [881, 103, 28, 20, EYE, 'flicker-a'],
]

export default function RoomLights() {
  const scale = useGameScale()
  const { W, s } = scale

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {LIGHTS.map(([cx, cy, w, h, bg, cls], i) => (
        <div
          key={i}
          className={`flicker ${cls} absolute mix-blend-screen ${bg === WALL ? 'wall-glow' : ''}`}
          style={{
            left: W / 2 + (cx - 864 - w / 2) * s,
            top: frameY(scale, cy - h / 2),
            width: w * s,
            height: h * s,
            background: bg,
            animationDelay: `${-(i * 0.71).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}
