import { d } from './GameStage.jsx'

// Creature picture with a label under it.
export default function ImageOption({ label, image, width, height, selected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group flex flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      style={{ width: d(Math.max(width, 100)), borderRadius: d(20) }}
    >
      <span className="flex items-center justify-center" style={{ height: d(189) }}>
        <img
          src={image}
          alt=""
          draggable="false"
          className="object-contain transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110"
          style={{
            width: d(width),
            height: d(height),
            transform: selected ? 'scale(1.12)' : undefined,
            filter: selected ? 'drop-shadow(0 0 14px rgba(255,255,255,0.75))' : undefined,
          }}
        />
      </span>
      <span
        className="whitespace-nowrap text-white"
        style={{
          fontSize: d(23),
          lineHeight: 1,
          marginTop: d(-12),
          fontFamily: '"Instrument Sans", sans-serif',
          textDecoration: selected ? 'underline' : 'none',
          textUnderlineOffset: 4,
        }}
      >
        {label}
      </span>
    </button>
  )
}
