import { d } from './GameStage.jsx'

/*
 * Button used across the game screens.
 *   variant "summon"  big green glowing pill (Summon! / Reveal)
 *   variant "outline" white outline pill      (Download)
 *   variant "light"   filled light pill       (Share)
 * The pill variants take an optional `icon` element shown before the label.
 * Sizes are in Figma design px (scaled with --u by <GameStage>).
 */

function Summon({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className="group relative rounded-full outline-none transition-transform duration-150 hover:scale-[1.04] active:translate-y-[2px] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white/80 disabled:pointer-events-none"
    >
      <span
        className="relative flex flex-col items-start overflow-clip rounded-full bg-gradient-to-b from-[#2ebf87] via-[#29ab70] to-[#199a37] transition-shadow duration-200 group-hover:brightness-110"
        style={{
          padding: `${d(9)} ${d(10)}`,
          boxShadow: `0 0 ${d(26)} ${d(4)} rgba(45,246,132,0.6), inset 0 ${d(3)} 0 0 rgba(255,255,255,0.4), inset 0 ${d(-7)} 0 0 rgba(75,188,118,0.4)`,
        }}
      >
        <span
          className="relative flex items-center justify-center rounded-full bg-gradient-to-b from-[#1ac88b] to-[#2e7359]"
          style={{
            padding: `${d(8)} ${d(36)}`,
            boxShadow: `inset 0 ${d(3)} ${d(6)} 0 rgba(150,10,70,0.35)`,
          }}
        >
          <span
            className="font-lilita whitespace-nowrap text-center text-white"
            style={{
              fontSize: d(60),
              lineHeight: d(60),
              letterSpacing: d(-1),
              textShadow: `0 ${d(4)} 0 rgba(0,0,0,0.25)`,
            }}
          >
            {children}
          </span>
        </span>
      </span>
    </button>
  )
}

function Pill({ variant, icon, children, ...props }) {
  const look =
    variant === 'outline'
      ? 'border border-white text-white hover:bg-white/15'
      : 'bg-[#eae0e0] font-medium text-[#101010] hover:bg-white'
  return (
    <button
      type="button"
      {...props}
      className={`flex items-center justify-center whitespace-nowrap rounded-full outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/80 active:translate-y-px disabled:opacity-60 ${look}`}
      style={{
        padding: `${d(4.789)} ${d(30.651)}`,
        fontSize: d(23.946),
        lineHeight: d(40.229),
        letterSpacing: d(-0.4567),
        fontFamily: '"Instrument Sans", sans-serif',
        gap: d(10),
      }}
    >
      {icon}
      {children}
    </button>
  )
}

export default function GameButton({ variant = 'summon', icon, children, ...props }) {
  return variant === 'summon' ? (
    <Summon {...props}>{children}</Summon>
  ) : (
    <Pill variant={variant} icon={icon} {...props}>
      {children}
    </Pill>
  )
}
