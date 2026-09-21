import closeSquare from '../../assets/game/close-square.svg'
import { d } from './GameStage.jsx'

/*
 * The round X used to leave the game (from the Figma card screen).
 * Pass `style` to place it; sizes are Figma design px (scaled by <GameStage>).
 */
export default function CloseButton({ onClick, label = 'Close', className = '', style }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded-full outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/80 ${className}`}
      style={{ width: d(43.5), height: d(43.5), ...style }}
    >
      <img src={closeSquare} alt="" draggable="false" className="block size-full max-w-none" />
    </button>
  )
}
