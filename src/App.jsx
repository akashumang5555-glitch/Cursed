import { useEffect, useRef, useState } from 'react'
import Hero from './components/Hero.jsx'
import SplashCursor from './components/SplashCursor.jsx'
import GameStage from './components/game/GameStage.jsx'
import DiveOverlay from './components/DiveOverlay.jsx'
import PacmanScreen from './components/pacman/PacmanScreen.jsx'
import { playDive } from './game/dive.js'
import { watchPerformance, preloadGameAssets } from './game/perf.js'
import gameRoom from './assets/game/room.png'
import gameCauldron from './assets/game/cauldron.png'
import IntroScreen from './components/game/IntroScreen.jsx'
import QuestionScreen from './components/game/QuestionScreen.jsx'
import RevealScreen from './components/game/RevealScreen.jsx'
import ResultScreen from './components/game/ResultScreen.jsx'
import { QUESTIONS, QUESTION_COUNT } from './game/questions.js'
import { matchCurse } from './game/matchCurse.js'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/*
 * Flow:  home (portal) -> intro -> question 1..5 -> finding your curse -> result card
 * The pumpkin on the home page opens Pumpkin Chase (a Pac-Man style challenge);
 * its X, like every game screen's, goes back home.
 * Clicking the portal on the home page flies the camera into it (zoom, motion
 * blur, red light) and lands in the game room; the X on the card
 * goes back to the home page. The room and cauldron (GameStage) stay mounted
 * across the game screens so the cauldron keeps bubbling without a break.
 */
export default function App() {
  const [screen, setScreen] = useState('home') // home | intro | quiz | finding | result
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [dive, setDive] = useState(null) // {x, y} of the portal while flying into it
  const [cut, setCut] = useState(false) // dark fade while going to the challenge
  const timers = useRef([])
  const sceneRef = useRef(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // slow machine? drop to the lighter look automatically; and get the game's
  // pictures decoded while the player is still on the home page
  useEffect(() => {
    const stop = watchPerformance()
    const creatures = QUESTIONS.find((q) => q.type === 'images').options.map((o) => o.image)
    preloadGameAssets([gameRoom, gameCauldron, ...creatures])
    return stop
  }, [])

  // "Finding your curse..." lasts a moment, then the card appears
  useEffect(() => {
    if (screen !== 'finding') return undefined
    const t = window.setTimeout(() => setScreen('result'), 3200)
    return () => window.clearTimeout(t)
  }, [screen])

  // no page scrollbars while the scene is scaled up
  useEffect(() => {
    document.documentElement.classList.toggle('diving', Boolean(dive))
    return () => document.documentElement.classList.remove('diving')
  }, [dive])

  // The pumpkin: a quick dark fade into the challenge
  function enterChallenge() {
    if (dive || cut) return
    setCut(true)
    timers.current.push(
      window.setTimeout(() => setScreen('pacman'), reducedMotion() ? 50 : 380),
      window.setTimeout(() => setCut(false), reducedMotion() ? 100 : 900),
    )
  }

  // Fly into the portal: a camera push-in with depth (see game/dive.js), embers,
  // a shockwave and a bloom of light; the room is mounted underneath and
  // emerges from the light.
  function enterPortal(e) {
    if (dive) return
    const r = e.currentTarget.getBoundingClientRect()
    const quick = reducedMotion()
    const point = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    setDive(point)
    if (!quick) playDive(sceneRef.current, point)
    timers.current.push(
      window.setTimeout(() => setScreen('intro'), quick ? 100 : 1000),
      window.setTimeout(() => setDive(null), quick ? 200 : 1950),
    )
  }

  function startQuiz() {
    setAnswers([])
    setStep(0)
    setScreen('quiz')
  }

  function answer(id) {
    const next = [...answers.slice(0, step), id]
    setAnswers(next)
    if (step + 1 < QUESTION_COUNT) setStep(step + 1)
    else setScreen('finding')
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  // Esc also leaves the game
  useEffect(() => {
    if (screen === 'home') return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') goHome()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function goHome() {
    setAnswers([])
    setStep(0)
    setScreen('home')
  }

  let content
  if (screen === 'intro') {
    content = <IntroScreen onStart={startQuiz} />
  } else if (screen === 'quiz') {
    content = (
      <QuestionScreen
        key={step}
        question={QUESTIONS[step]}
        canGoBack={step > 0}
        onAnswer={answer}
        onBack={back}
      />
    )
  } else if (screen === 'finding') {
    content = <RevealScreen />
  } else if (screen === 'result') {
    const { curse } = matchCurse(answers)
    content = <ResultScreen curse={curse} colorId={answers[2]} onClose={goHome} />
  }

  return (
    <main>
      {screen === 'home' ? (
        <div ref={sceneRef}>
          <Hero onEnterPortal={enterPortal} onChallenge={enterChallenge} />
          <SplashCursor RAINBOW_MODE={false} COLOR="#00e5ff" DENSITY_DISSIPATION={6} />
        </div>
      ) : screen === 'pacman' ? (
        <PacmanScreen onClose={goHome} />
      ) : (
        <GameStage
          showCauldron={screen !== 'result'}
          dim={screen === 'result' ? 0.61 : 0}
          intense={screen === 'finding'}
          onClose={goHome}
          hideClose={screen === 'result'}
        >
          {content}
        </GameStage>
      )}
      {dive && <DiveOverlay x={dive.x} y={dive.y} />}
      {cut && <div aria-hidden="true" className="cut-fade" />}
    </main>
  )
}
