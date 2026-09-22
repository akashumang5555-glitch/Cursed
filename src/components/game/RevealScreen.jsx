import { ScreenContent, d } from './GameStage.jsx'

// Shown after the fifth answer while the curse is "found" (App moves on by itself).
export default function RevealScreen() {
  return (
    <ScreenContent top={300}>
      <p
        role="status"
        aria-live="polite"
        className="m-0 text-center font-serif-display text-[#eadada]"
        style={{ fontSize: d(56), lineHeight: 1.46, textWrap: 'balance' }}
      >
        We are finding your curse
        <span aria-hidden="true" className="loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </ScreenContent>
  )
}
