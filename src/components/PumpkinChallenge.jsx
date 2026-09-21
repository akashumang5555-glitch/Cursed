import { PumpkinGlows } from './Flicker.jsx'

/*
 * The pumpkin on the home page is a button: hover (or keyboard focus) tilts it
 * slightly and shows a small "Take challenge" label on its left; clicking opens
 * the maze game.
 *
 * The pumpkin's flickering eyes and mouth glow live inside the tilting part, so
 * they tilt together with the picture. Sizes come from the Figma frame; text
 * scales with the artwork through the --k variable set on the artwork canvas.
 */
export default function PumpkinChallenge({ src, onChallenge }) {
  return (
    <div className="pumpkin-wrap absolute left-[3.334%] top-[62.575%] z-30 h-[32.998%] w-[28.507%]">
      <span className="pumpkin-label pointer-events-none absolute whitespace-nowrap font-lilita text-white" aria-hidden="true">
        Take challenge
      </span>

      <button
        type="button"
        onClick={onChallenge}
        aria-label="Take challenge"
        className="pumpkin-tilt absolute inset-0 rounded-[48%] bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
      >
        {/* the picture is cropped to the Figma frame (its own box clips it) */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src={src}
            alt=""
            draggable="false"
            className="absolute left-[-7.34%] top-[-3.44%] h-[120.44%] w-[113.81%] max-w-none"
          />
        </span>
        <PumpkinGlows />
      </button>
    </div>
  )
}
