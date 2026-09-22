import { d } from './GameStage.jsx'

// Small line icons for the Download / Share buttons (drawn in code, follow the text colour).
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function DownloadIcon({ size = 24 }) {
  return (
    <svg {...base} style={{ width: d(size), height: d(size) }}>
      <path d="M12 3.5v11.5" />
      <path d="M7.5 10.8 12 15.3l4.5-4.5" />
      <path d="M4.5 17v1.6A1.9 1.9 0 0 0 6.4 20.5h11.2a1.9 1.9 0 0 0 1.9-1.9V17" />
    </svg>
  )
}

export function ShareIcon({ size = 24 }) {
  return (
    <svg {...base} style={{ width: d(size), height: d(size) }}>
      <circle cx="18" cy="5.5" r="2.7" />
      <circle cx="6" cy="12" r="2.7" />
      <circle cx="18" cy="18.5" r="2.7" />
      <path d="m8.4 10.7 7.2-3.9M8.4 13.3l7.2 3.9" />
    </svg>
  )
}
