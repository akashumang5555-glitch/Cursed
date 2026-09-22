import { d } from './GameStage.jsx'

// Colour swatch (132 x 132, rounded, white border).
export default function ColorOption({ label, color, selected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      className="border-2 border-white outline-none transition-transform duration-150 hover:-translate-y-1 hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/80 active:scale-100"
      style={{
        width: d(132),
        height: d(132),
        borderRadius: d(40),
        backgroundColor: color,
        boxShadow: selected ? `0 0 ${d(28)} ${d(6)} ${color}` : 'none',
        transform: selected ? 'scale(1.08)' : undefined,
      }}
    />
  )
}
