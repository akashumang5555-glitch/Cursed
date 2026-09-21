import { ScreenContent, d } from './GameStage.jsx'
import GameButton from './GameButton.jsx'

// "Know your curse!" - the first screen after the portal.
export default function IntroScreen({ onStart }) {
  return (
    <>
      <ScreenContent top={199}>
        <h1
          className="m-0 text-center font-serif-display font-normal text-[#eadada]"
          style={{ fontSize: d(124), lineHeight: 1.46, textWrap: 'balance' }}
        >
          Know your curse!
        </h1>
        <p
          className="m-0 text-center text-white"
          style={{ fontSize: d(23), lineHeight: 1, fontFamily: '"Instrument Sans", sans-serif' }}
        >
          Five choices. One curse. Let&apos;s see what answers your call.
        </p>
        <div style={{ marginTop: d(56) }}>
          <GameButton onClick={onStart}>Summon!</GameButton>
        </div>
      </ScreenContent>
    </>
  )
}
