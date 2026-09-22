import { useCallback, useEffect, useRef, useState } from 'react'
import CloseButton from '../game/CloseButton.jsx'
import GameButton from '../game/GameButton.jsx'
import { Game } from '../../pacman/engine.js'
import { createRenderer } from '../../pacman/render.js'
import { COLS, ROWS, UP, DOWN, LEFT, RIGHT } from '../../pacman/maze.js'
import forest from '../../assets/images/background.jpg'
import pumpkinSprite from '../../assets/pacman/pumpkin.png'

/*
 * The maze challenge: the classic Pac-Man style game, in this website's world. You are a
 * cartoon face eating cursed souls; four pumpkins hunt you. Red orbs make the
 * pumpkins scared for a few seconds, so you can eat them.
 *
 * The rules live in src/pacman/engine.js and the drawing in render.js; this
 * screen wires them to the page: canvas, HUD, menus, keyboard / swipe input and
 * the X that goes back home.
 */

const KEYS = {
  ArrowUp: UP, ArrowDown: DOWN, ArrowLeft: LEFT, ArrowRight: RIGHT,
  w: UP, s: DOWN, a: LEFT, d: RIGHT, W: UP, S: DOWN, A: LEFT, D: RIGHT,
}

const HIGH_KEY = 'pumpkin-chase-high'
const loadHigh = () => {
  try {
    return Number(localStorage.getItem(HIGH_KEY)) || 0
  } catch {
    return 0
  }
}
const saveHigh = (n) => {
  try {
    localStorage.setItem(HIGH_KEY, String(n))
  } catch {
    /* private mode: ignore */
  }
}

// the biggest tile size that lets the whole board (and its header) fit the screen
function fitTile() {
  const W = window.innerWidth
  const H = window.innerHeight
  const small = W < 700
  const chrome = (small ? 70 : 92) + (small ? 40 : 50) + 40 // header + hint + panel padding
  const t = Math.min((H - chrome) / (ROWS + 2), (W - 40) / COLS)
  return Math.max(8, Math.min(30, Math.floor(t)))
}

function Stat({ label, value, align = 'left' }) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} leading-none`}>
      <span className="font-lilita text-[11px] tracking-[0.18em] text-emerald-200/70 sm:text-xs">{label}</span>
      <span className="pc-number font-lilita text-2xl text-white sm:text-3xl">{String(value).padStart(5, '0')}</span>
    </div>
  )
}

export default function PacmanScreen({ onClose }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const rendererRef = useRef(null)
  const pausedRef = useRef(false)
  const [tile, setTile] = useState(fitTile)
  const [paused, setPaused] = useState(false)
  const [ui, setUi] = useState({ state: 'menu', score: 0, high: loadHigh(), lives: 3, level: 1 })

  const start = useCallback(() => {
    pausedRef.current = false
    setPaused(false)
    gameRef.current?.start()
  }, [])

  const togglePause = useCallback(() => {
    const g = gameRef.current
    if (!g || !['ready', 'play', 'freeze'].includes(g.state)) return
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }, [])

  // ---- game loop ------------------------------------------------------------
  useEffect(() => {
    const game = new Game()
    game.high = loadHigh()
    gameRef.current = game
    if (import.meta.env.DEV) window.__pumpkinGame = game // handy for testing in the dev server only
    let raf = 0
    let alive = true
    let last = performance.now()
    let seen = -1

    const img = new Image()
    img.src = pumpkinSprite
    img
      .decode()
      .catch(() => {})
      .then(() => {
        if (!alive) return
        rendererRef.current = createRenderer(canvasRef.current, img)
        rendererRef.current.resize(fitTile())
      })

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      if (!pausedRef.current) game.update(dt)
      rendererRef.current?.draw(game, now / 1000)
      if (game.version !== seen) {
        seen = game.version
        if (game.state === 'over') saveHigh(game.high)
        setUi({ state: game.state, score: game.score, high: game.high, lives: game.lives, level: game.level })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onHide = () => {
      if (document.hidden && ['ready', 'play', 'freeze'].includes(game.state)) {
        pausedRef.current = true
        setPaused(true)
      }
    }
    document.addEventListener('visibilitychange', onHide)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onHide)
      saveHigh(game.high)
    }
  }, [])

  // ---- size ---------------------------------------------------------------------
  useEffect(() => {
    const onResize = () => setTile(fitTile())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    rendererRef.current?.resize(tile)
  }, [tile])

  // ---- keyboard --------------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const dir = KEYS[e.key]
      const g = gameRef.current
      if (dir) {
        e.preventDefault()
        if (pausedRef.current) togglePause()
        g?.setDir(dir)
      } else if (e.key === 'p' || e.key === 'P' || (e.key === ' ' && g && g.state !== 'menu' && g.state !== 'over')) {
        e.preventDefault()
        togglePause()
      } else if ((e.key === 'Enter' || e.key === ' ') && g && (g.state === 'menu' || g.state === 'over')) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [start, togglePause])

  // ---- swipe (touch screens) -------------------------------------------------------------
  const touch = useRef(null)
  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchMove = (e) => {
    if (!touch.current) return
    const t = e.touches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return
    gameRef.current?.setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? RIGHT : LEFT) : dy > 0 ? DOWN : UP)
    touch.current = { x: t.clientX, y: t.clientY }
  }

  const boardW = COLS * tile
  const u = window.innerWidth < 700 ? 0.7 : 1
  const showMenu = ui.state === 'menu'
  const showOver = ui.state === 'over'

  return (
    <div className="screen-in fixed inset-0 overflow-hidden bg-[#020b0e]" style={{ '--u': u, touchAction: 'none' }}>
      {/* the forest from the home page, dimmed */}
      <img src={forest} alt="" draggable="false" className="pointer-events-none absolute inset-0 size-full select-none object-cover opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(2,20,24,0.35), rgba(1,7,9,0.92) 75%)' }}
      />

      <CloseButton
        onClick={onClose}
        label="Close game and go back home"
        className="absolute z-30"
        style={{ right: 'max(16px, calc(var(--u) * 40px))', top: 'max(16px, calc(var(--u) * 40px))' }}
      />

      <div
        className="relative z-10 flex h-full flex-col items-center justify-center gap-3"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {/* header */}
        <header className="flex items-end justify-between" style={{ width: boardW + 24 }}>
          <Stat label="SCORE" value={ui.score} />
          <Stat label="BEST" value={ui.high} align="right" />
        </header>

        {/* board */}
        <div
          className="relative rounded-[22px] p-3"
          style={{
            background: 'rgba(2, 14, 17, 0.8)',
            border: '1px solid rgba(60, 240, 214, 0.35)',
            boxShadow: '0 0 40px rgba(60, 240, 214, 0.16), inset 0 0 30px rgba(0, 0, 0, 0.55)',
          }}
        >
          <canvas ref={canvasRef} className="block" style={{ width: boardW, height: (ROWS + 2) * tile }} aria-label="Game board" />

          {showMenu && (
            <Overlay>
              <ul className="m-0 flex list-none flex-col items-center gap-1 p-0 text-center font-sans text-[13px] text-white/80 sm:text-[15px]">
                <li>Arrow keys or WASD to move · swipe on a phone</li>
                <li>
                  <span className="text-[#ff6b6b]">Red orbs</span> scare the pumpkins. Chase them!
                </li>
              </ul>
              <GameButton onClick={start}>Play</GameButton>
            </Overlay>
          )}

          {showOver && (
            <Overlay>
              <h2 className="m-0 text-center font-serif-display text-[46px] leading-none text-[#eadada] sm:text-[64px]">Game over</h2>
              <p className="m-0 text-center font-lilita text-[24px] text-emerald-200">
                Score <span className="pc-number text-white">{ui.score}</span>
              </p>
              {ui.score > 0 && ui.score >= ui.high && (
                <p className="m-0 text-center font-lilita text-[18px] tracking-wide text-[#ffd86a]">New best!</p>
              )}
              <GameButton onClick={start}>Play again</GameButton>
              <button type="button" onClick={onClose} className="font-sans text-[15px] text-white/75 underline underline-offset-4 hover:text-white">
                Back home
              </button>
            </Overlay>
          )}

          {paused && !showMenu && !showOver && (
            <Overlay>
              <h2 className="m-0 text-center font-serif-display text-[44px] leading-none text-[#eadada]">Paused</h2>
              <GameButton onClick={togglePause}>Resume</GameButton>
            </Overlay>
          )}
        </div>

        <p className="m-0 select-none text-center font-sans text-[12px] text-white/55 sm:text-[13px]">
          Arrow keys / WASD to move · P to pause · Esc to leave
        </p>
      </div>
    </div>
  )
}

function Overlay({ children }) {
  return (
    <div
      className="screen-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-[22px] px-4"
      style={{ background: 'rgba(2, 12, 15, 0.9)' }}
    >
      {children}
    </div>
  )
}
