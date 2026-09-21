// Pumpkin Chase - drawing. Everything is drawn on one canvas in "tile" units
// (the context is scaled by tile size), using the website's palette: night
// teal, cursed green, portal red and pumpkin orange.

import { COLS, ROWS, MAP, LEFT } from './maze.js'
import { posOf } from './engine.js'

const FONT = '"Lilita One", "Arial Black", sans-serif'

// wall colour per level (level 1 = the teal of the home page forest)
const PALETTE = ['#3cf0d6', '#2df684', '#ff7a59', '#b78cff']
const WALL_FILL = '#04171c'
const DOT = '#9dffc8'
const PELLET = '#ff4a4a' // the portal red

const PAC_R = 0.8 // radius of the player's face, in tiles
const SPRITE = 1.9 // size of a pumpkin, in tiles

// ---------------------------------------------------------------------------
// The player: a cartoon human face with a chomping mouth
// ---------------------------------------------------------------------------

// face: direction the player looks (one of the maze.js directions), open: 0..1
export function drawFace(ctx, cx, cy, r, face, open, mouthHalfDeg) {
  const ang = Math.atan2(face.y, face.x)
  const half = ((mouthHalfDeg ?? 4 + open * 26) * Math.PI) / 180

  // head, with the mouth cut out of it
  ctx.fillStyle = '#f6c195'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, r, ang + half, ang - half + Math.PI * 2)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(140,70,25,0.45)'
  ctx.lineWidth = r * 0.1
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.95, ang + half, ang - half + Math.PI * 2)
  ctx.stroke()

  // blush
  ctx.fillStyle = 'rgba(255,110,110,0.35)'
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(cx + s * r * 0.58, cy + r * 0.2, r * 0.17, 0, Math.PI * 2)
    ctx.fill()
  }

  // mouth
  ctx.fillStyle = '#4a0f1c'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, r * 0.97, ang - half, ang + half)
  ctx.closePath()
  ctx.fill()
  if (open > 0.3) {
    ctx.fillStyle = '#e8617d'
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(ang) * r * 0.56, cy + Math.sin(ang) * r * 0.56, r * 0.22, r * 0.11, ang, 0, Math.PI * 2)
    ctx.fill()
  }

  // hair: a dome with a wavy fringe and a tuft
  ctx.fillStyle = '#4a2b17'
  ctx.beginPath()
  ctx.ellipse(cx, cy - r * 0.55, r * 0.92, r * 0.55, 0, Math.PI, Math.PI * 2)
  ctx.quadraticCurveTo(cx + r * 0.45, cy - r * 0.3, cx + r * 0.12, cy - r * 0.5)
  ctx.quadraticCurveTo(cx - r * 0.3, cy - r * 0.22, cx - r * 0.92, cy - r * 0.55)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.2, cy - r * 1.02)
  ctx.quadraticCurveTo(cx - r * 0.05, cy - r * 1.5, cx + r * 0.18, cy - r * 1.02)
  ctx.quadraticCurveTo(cx + r * 0.32, cy - r * 1.3, cx + r * 0.42, cy - r * 1.0)
  ctx.closePath()
  ctx.fill()

  // eyes (placed so the open mouth never covers them)
  let ex = r * 0.3
  let ey = -r * 0.27
  if (face.y < 0) {
    ex = r * 0.5
    ey = -r * 0.04
  } else if (face.y > 0) {
    ex = r * 0.34
    ey = -r * 0.3
  }
  const sx = face.x * r * 0.08
  for (const s of [-1, 1]) {
    const x = cx + s * ex + sx
    const y = cy + ey
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.17, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1d1208'
    ctx.beginPath()
    ctx.arc(x + face.x * r * 0.06, y + face.y * r * 0.06, r * 0.085, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x + face.x * r * 0.06 - r * 0.03, y + face.y * r * 0.06 - r * 0.035, r * 0.03, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------------------------------------------------------------------------

export function createRenderer(canvas, pumpkinImg) {
  const ctx = canvas.getContext('2d')
  let T = 20
  let dpr = 1
  let walls = null
  let wallsFlash = null
  let wallsLevel = -1
  let sprites = null

  const isWall = (x, y) => y >= 0 && y < ROWS && x >= 0 && x < COLS && MAP[y][x] === '#'
  // the blank corners either side of the ghost house are just decoration: draw them
  // as solid stone so only the real corridors (and the tunnel) get a neon edge
  const isVoid = (x, y) => MAP[y]?.[x] === ' ' && (x < 5 || x > 22) && ((y >= 10 && y <= 12) || (y >= 16 && y <= 18))
  const solid = (x, y) => isWall(x, y) || isVoid(x, y)

  // ---- walls: neon-outlined dark stone, baked once per size / level ---------
  function bakeWalls(color) {
    const c = document.createElement('canvas')
    c.width = COLS * T * dpr
    c.height = ROWS * T * dpr
    const g = c.getContext('2d')
    g.scale(T * dpr, T * dpr)
    const rim = 0.15 // thickness of the neon edge, in tiles

    // outer layer: every wall tile in neon, with a soft glow around it
    g.fillStyle = color
    g.shadowColor = color
    g.shadowBlur = 0.55 * T * dpr
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) if (solid(x, y)) g.fillRect(x - 0.01, y - 0.01, 1.02, 1.02)
    }
    g.shadowBlur = 0

    // inner layer: dark stone, inset only on the sides that face the corridors
    g.fillStyle = WALL_FILL
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!solid(x, y)) continue
        const t = !solid(x, y - 1) && y > 0
        const b = !solid(x, y + 1) && y < ROWS - 1
        const l = !solid(x - 1, y) && x > 0
        const r = !solid(x + 1, y) && x < COLS - 1
        const x0 = x + (l ? rim : -0.02)
        const y0 = y + (t ? rim : -0.02)
        const x1 = x + 1 - (r ? rim : -0.02)
        const y1 = y + 1 - (b ? rim : -0.02)
        g.fillRect(x0, y0, x1 - x0, y1 - y0)
      }
    }
    // inside corners: keep the neon line unbroken
    g.fillStyle = color
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!solid(x, y)) continue
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          if (solid(x + dx, y) && solid(x, y + dy) && !solid(x + dx, y + dy) && x + dx >= 0 && x + dx < COLS && y + dy >= 0 && y + dy < ROWS) {
            g.fillRect(dx < 0 ? x : x + 1 - rim, dy < 0 ? y : y + 1 - rim, rim, rim)
          }
        }
      }
    }

    // the ghost-house door
    for (let x = 0; x < COLS; x++) {
      if (MAP[12][x] === '-') {
        g.fillStyle = '#ff7ad9'
        g.shadowColor = '#ff7ad9'
        g.shadowBlur = 0.4 * T * dpr
        g.fillRect(x, 12.38, 1, 0.24)
        g.shadowBlur = 0
      }
    }
    return c
  }

  // ---- pumpkins: the home page pumpkin with a coloured aura --------------------
  function bakeSprite(auraColor, tint) {
    const S = Math.ceil(SPRITE * T * dpr)
    const c = document.createElement('canvas')
    c.width = c.height = S
    const g = c.getContext('2d')
    const aura = g.createRadialGradient(S / 2, S / 2, S * 0.18, S / 2, S / 2, S / 2)
    aura.addColorStop(0, auraColor + 'aa')
    aura.addColorStop(1, auraColor + '00')
    g.fillStyle = aura
    g.fillRect(0, 0, S, S)

    // the pumpkin itself (kept in its own layer so a tint only touches the pumpkin)
    const p = document.createElement('canvas')
    p.width = p.height = S
    const pg = p.getContext('2d')
    const fit = (S * 0.84) / Math.max(pumpkinImg.width, pumpkinImg.height)
    const w = pumpkinImg.width * fit
    const h = pumpkinImg.height * fit
    pg.drawImage(pumpkinImg, (S - w) / 2, (S - h) / 2 + S * 0.02, w, h)
    if (tint) {
      pg.globalCompositeOperation = 'source-atop'
      pg.fillStyle = tint
      pg.fillRect(0, 0, S, S)
    }
    g.drawImage(p, 0, 0)
    return c
  }

  function bakeSprites() {
    sprites = {
      normal: {},
      scared: bakeSprite('#3d6bff', 'rgba(60,110,255,0.62)'),
      scaredFlash: bakeSprite('#ffffff', 'rgba(255,255,255,0.7)'),
    }
    for (const [id, color] of [['blinky', '#ff4a4a'], ['pinky', '#ff7ad9'], ['inky', '#3ce6ff'], ['clyde', '#ffa53a']]) {
      sprites.normal[id] = bakeSprite(color, null)
    }
  }

  function resize(tileSize) {
    T = Math.max(6, Math.floor(tileSize))
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = COLS * T * dpr
    canvas.height = (ROWS + 2) * T * dpr
    canvas.style.width = `${COLS * T}px`
    canvas.style.height = `${(ROWS + 2) * T}px`
    walls = wallsFlash = null
    wallsLevel = -1
    bakeSprites()
  }

  // ---- one frame -------------------------------------------------------------------
  function draw(game, time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(T * dpr, 0, 0, T * dpr, 0, 0)

    const level = (game.level - 1) % PALETTE.length
    if (level !== wallsLevel || !walls) {
      walls = bakeWalls(PALETTE[level])
      wallsFlash = bakeWalls('#ffffff')
      wallsLevel = level
    }
    const flashing = game.state === 'clear' && Math.floor(game.timer * 5) % 2 === 0
    ctx.drawImage(flashing ? wallsFlash : walls, 0, 0, COLS, ROWS)

    // dots and power pellets
    ctx.fillStyle = DOT
    for (let y = 0; y < ROWS; y++) {
      const row = game.tiles[y]
      for (let x = 0; x < COLS; x++) {
        const c = row[x]
        if (c === '.') {
          ctx.globalAlpha = 0.25
          ctx.beginPath()
          ctx.arc(x + 0.5, y + 0.5, 0.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(x + 0.5, y + 0.5, 0.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    const pulse = 0.75 + 0.25 * Math.sin(time * 7)
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (game.tiles[y][x] !== 'o') continue
        ctx.fillStyle = 'rgba(255,74,74,0.28)'
        ctx.beginPath()
        ctx.arc(x + 0.5, y + 0.5, 0.8 * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = PELLET
        ctx.beginPath()
        ctx.arc(x + 0.5, y + 0.5, 0.4 * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffd6d0'
        ctx.beginPath()
        ctx.arc(x + 0.4, y + 0.4, 0.12, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const showActors = game.state !== 'clear'
    const pp = posOf(game.pac)

    // pumpkins
    if (showActors && game.state !== 'dying') {
      for (const g of game.ghosts) {
        const pos = game.ghostPos(g)
        const bob = 1 + Math.sin(time * 9 + g.bob) * 0.035
        if (g.state === 'eaten' || g.state === 'reviving') {
          drawEyes(pos.x, pos.y, g.dir)
          continue
        }
        let img = sprites.normal[g.id]
        if (g.state === 'frightened') {
          const ending = game.fright < 2 && Math.floor(game.fright * 5) % 2 === 0
          img = ending ? sprites.scaredFlash : sprites.scared
        }
        const s = SPRITE * bob
        ctx.save()
        ctx.translate(pos.x, pos.y)
        ctx.rotate(g.dir.x * 0.1)
        ctx.drawImage(img, -s / 2, -s / 2, s, s)
        ctx.restore()
      }
    }

    // the player
    if (game.state === 'dying') {
      const p = 1 - Math.max(0, game.timer) / 1.7
      if (p < 0.92) {
        ctx.globalAlpha = p > 0.8 ? 1 - (p - 0.8) / 0.12 : 1
        drawFace(ctx, pp.x, pp.y, PAC_R * (1 - p * 0.2), { x: 0, y: -1 }, 1, 30 + p * 150)
        ctx.globalAlpha = 1
      }
    } else if (showActors) {
      const moving = game.state === 'play' && game.pac.dir.x + game.pac.dir.y !== 0
      const open = moving ? Math.abs(Math.sin(time * 14)) : 0.35
      drawFace(ctx, pp.x, pp.y, PAC_R, game.pac.face || LEFT, open)
    }

    // score pop-ups
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `1.05px ${FONT}`
    for (const p of game.popups) {
      ctx.globalAlpha = 1 - p.t / 1.2
      ctx.fillStyle = '#7dffe8'
      ctx.fillText(p.text, p.x, p.y - p.t * 1.2)
    }
    ctx.globalAlpha = 1

    // "READY!"
    if (game.state === 'ready') {
      ctx.font = `1.5px ${FONT}`
      ctx.fillStyle = '#9dffc8'
      ctx.shadowColor = '#2df684'
      ctx.shadowBlur = 0.6 * T * dpr
      ctx.fillText('READY!', COLS / 2, 17.5)
      ctx.shadowBlur = 0
    }

    // lives and level, under the maze
    for (let i = 0; i < Math.max(0, game.lives - (game.state === 'menu' ? 0 : 0)); i++) {
      drawFace(ctx, 1.6 + i * 1.9, ROWS + 1, 0.7, LEFT, 0.5)
    }
    ctx.font = `1.15px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillStyle = '#9dffc8'
    ctx.fillText(`LEVEL ${game.level}`, COLS - 0.6, ROWS + 1)
  }

  function drawEyes(x, y, dir) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(x + s * 0.3, y - 0.05, 0.22, 0.28, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1b3cff'
      ctx.beginPath()
      ctx.arc(x + s * 0.3 + dir.x * 0.1, y - 0.05 + dir.y * 0.12, 0.11, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return { resize, draw }
}
