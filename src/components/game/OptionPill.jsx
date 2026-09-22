import { d } from './GameStage.jsx'

// Text choice: white hand-drawn outline, Lilita One label.
export default function OptionPill({ label, selected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`option-pill group relative outline-none transition-[transform,background-color] duration-150 hover:-translate-y-[2px] focus-visible:ring-2 focus-visible:ring-white/80 active:translate-y-0 ${
        selected ? 'bg-white' : 'hover:bg-white/10'
      }`}
      style={{ height: d(60), paddingInline: d(22), borderRadius: d(94) }}
    >
      <span
        aria-hidden="true"
        className={`pill-outline pointer-events-none absolute inset-0 border transition-colors ${
          selected ? 'border-white' : 'border-white group-hover:border-white'
        }`}
        style={{ borderRadius: d(94) }}
      />
      <span
        className={`relative font-lilita whitespace-nowrap ${selected ? 'text-[#7a0c12]' : 'text-white'}`}
        style={{
          fontSize: d(26),
          lineHeight: d(60),
          textShadow: selected ? 'none' : `0 ${d(4)} 0 rgba(0,0,0,0.25)`,
        }}
      >
        {label}
      </span>
    </button>
  )
}
