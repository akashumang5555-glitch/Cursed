import useHeroLayout from '../hooks/useHeroLayout.js'
import Portal, { PortalSpill, PortalHitArea, PortalLight } from './Portal.jsx'
import Flicker from './Flicker.jsx'
import PumpkinChallenge from './PumpkinChallenge.jsx'
import Rain from './Rain.jsx'
import background from '../assets/images/background.jpg'
import ruinsArch from '../assets/images/ruins-arch.png'
import pumpkin from '../assets/images/pumpkin.png'
import treeTopRight from '../assets/images/tree-top-right.png'
import cursedLogo from '../assets/images/cursed-logo.png'
import groundShadow1 from '../assets/svg/ground-shadow-1.svg'
import groundShadow2 from '../assets/svg/ground-shadow-2.svg'
import groundShadow3 from '../assets/svg/ground-shadow-3.svg'
import mistLeft from '../assets/svg/mist-left.svg'
import mistCenter from '../assets/svg/mist-center.svg'
import mistRight from '../assets/svg/mist-right.svg'

// Vector layers are exported with a bleed (blur / stroke), so the <img> is
// inset by a negative margin inside a box that has the layer's design bounds.
function VectorLayer({ src, box, inset, className = '' }) {
  return (
    <div className={`absolute ${box} ${className}`}>
      <div className={`absolute ${inset}`}>
        <img src={src} alt="" className="block size-full max-w-none" />
      </div>
    </div>
  )
}

// Hero: 1728 x 1063 Figma frame "Home page" (node 1:2), positioned in % of the canvas.
export default function Hero({ onEnterPortal, onChallenge }) {
  const { height, stage, bg } = useHeroLayout()

  // The tree bleeds past the top of the Figma frame. When the frame doesn't
  // reach the top of the screen, fade its cut edge instead of showing it.
  const treeFade =
    stage.top > 1
      ? 'linear-gradient(to bottom, transparent 0, #000 30%)'
      : undefined

  return (
    <section className="relative w-full overflow-hidden bg-night" style={{ height }}>
      {/* image 25 — background scene (1:3): covers the whole viewport */}
      <img
        src={background}
        alt=""
        data-dive="bg"
        className="pointer-events-none absolute max-w-none"
        style={bg}
      />

      {/* Artwork canvas: the 1728 x 1063 Figma frame, scaled as a whole */}
      <div className="absolute" style={{ ...stage, '--k': stage.width / 1728 }}>
        {/* WebGL portal + halo, behind the arch so the stones frame it */}
        <Portal />

        {/* Frame 48095485 (1:4): arch, ground shadows, pumpkin */}
        <div className="absolute left-[33.044%] top-[35.749%] h-[46.755%] w-[34.714%]">
          {/* Ellipse 21859 (1:6) */}
          <VectorLayer
            src={groundShadow1}
            box="left-[17.671%] top-[87.726%] h-[12.274%] w-[92.52%]"
            inset="inset-[-47.98%_-5.27%]"
          />
          {/* Ellipse 21861 (1:7) */}
          <VectorLayer
            src={groundShadow2}
            box="left-[-4.046%] top-[91.16%] h-[8.837%] w-[47.204%]"
            inset="inset-[-58.95%_-9.14%]"
          />
          {/* image 29 — ruined arch (1:8) */}
          <div className="absolute left-[8.767%] top-0 h-[97.907%] w-[81.117%]">
            <img
              src={ruinsArch}
              alt=""
              className="pointer-events-none absolute inset-0 size-full max-w-none object-cover"
            />
          </div>
          {/* Ellipse 21860 (1:9) */}
          <VectorLayer
            src={groundShadow3}
            box="left-[-1.156%] top-[91.16%] h-[8.837%] w-[101.157%]"
            inset="inset-[-58.95%_-4.27%]"
          />
          {/* Image — pumpkin (1:10): also the button that opens the Pumpkin Chase challenge */}
          <PumpkinChallenge src={pumpkin} onChallenge={onChallenge} />
        </div>

        {/* Portal light: rim light on the stones, ground glow, sparks */}
        <PortalLight />
        <PortalSpill />

        {/* Clicking the portal starts the game */}
        {onEnterPortal && <PortalHitArea onEnter={onEnterPortal} />}

        {/* Subtle flicker: pumpkin eyes and candle flames */}
        <Flicker />

        {/* Mist ellipses, blend mode: overlay (1:14, 1:15, 1:16) */}
        <VectorLayer
          src={mistRight}
          box="left-[67.072%] top-[67.075%] h-[12.229%] w-[24.421%]"
          inset="inset-[-37.77%_-11.64%]"
          className="mix-blend-overlay mist-drift-a"
        />
        <VectorLayer
          src={mistLeft}
          box="left-[19.213%] top-[67.075%] h-[11.006%] w-[21.991%]"
          inset="inset-[-41.97%_-12.92%]"
          className="mix-blend-overlay mist-drift-b"
        />
        <VectorLayer
          src={mistCenter}
          box="left-[56.424%] top-[74.506%] h-[5.738%] w-[11.343%]"
          inset="inset-[-80.49%_-25.05%]"
          className="mix-blend-overlay mist-drift-c"
        />

        {/* Leaves / branch, top right, mirrored (1:17). It sways in the wind: the whole
            branch swings from its corner, and the leaves flutter a little on top of that. */}
        <div className="leaf-sway pointer-events-none absolute left-[77.488%] top-[-1.881%] h-[37.629%] w-[27.951%]">
          <img
            src={treeTopRight}
            alt=""
            className="leaf-flutter absolute inset-0 size-full max-w-none -scale-x-100 object-cover"
            style={{ WebkitMaskImage: treeFade, maskImage: treeFade }}
          />
        </div>

        {/* image 33 — "Cursed!" logo (1:18) */}
        <h1 data-dive="fade" className="absolute left-[29.109%] top-[3.104%] m-0 h-[32.643%] w-[41.435%]">
          <img
            src={cursedLogo}
            alt="Cursed!"
            className="pointer-events-none absolute inset-0 size-full max-w-none object-cover"
          />
        </h1>
      </div>

      {/* Rain over everything; it splashes on the portal wall inside the gate */}
      <Rain stage={stage} />
    </section>
  )
}
