// Pumpkin Chase - game rules. Pure logic: no drawing and no DOM, so it can be
// tested on its own. The screen (PacmanScreen.jsx) + renderer (render.js) use it.
//
// Coordinates are in tiles. Tile (i, j) covers x in [i, i+1), y in [j, j+1);
// its centre is (i + 0.5, j + 0.5).

import { COLS, ROWS, MAP, TUNNEL_ROW, UP, LEFT, DOWN, RIGHT, STOP, DIRS, opposite } from './maze.js'

const GHOST_DEFS = [
  // scatter: the corner each pumpkin retreats to; home: its spot inside the house
  { id: 'blinky', color: '#ff4a4a', scatter: { x: 25, y: -3 }, home: null, delay: 0 },
  { id: 'pinky', color: '#ff7ad9', scatter: { x: 2, y: -3 }, home: { x: 14, y: 14.5 }, delay: 1.2 },
  { id: 'inky', color: '#3ce6ff', scatter: { x: 27, y: 33 }, home: { x: 12, y: 14.5 }, delay: 4 },
  { id: 'clyde', color: '#ffa53a', scatter: { x: 0, y: 33 }, home: { x: 16, y: 14.5 }, delay: 7.5 },
]

// scatter / chase waves, in seconds
const MODES = [
  ['scatter', 7],
  ['chase', 20],
  ['scatter', 7],
  ['chase', 20],
  ['scatter', 5],
  ['chase', 20],
  ['scatter', 5],
  ['chase', Infinity],
]

// tiles where ghosts (that are not scared) may not turn upwards - as in the original
const NO_UP = new Set(['12,11', '15,11', '12,23', '15,23'])

const DOOR_X = 14 // x of the ghost-house door (between tiles 13 and 14)
const HOUSE_TOP_Y = 11.5 // y of a ghost standing on the tile above the door

export const posOf = (m) => ({ x: m.tx + 0.5 + m.dir.x * m.off, y: m.ty + 0.5 + m.dir.y * m.off })

// Speeds in tiles per second, getting a little harder every level.
function levelParams(level) {
  const k = Math.min(level - 1, 8)
  const ghost = 6.7 + k * 0.2
  return {
    pac: 7.3 + k * 0.1,
    pacFright: 7.9 + k * 0.1,
    ghost,
    ghostFright: ghost * 0.55,
    ghostTunnel: ghost * 0.5,
    ghostEaten: 14,
    fright: Math.max(1.5, 6.5 - k * 0.65),
  }
}

// Moves `m` (a thing on the tile grid) by `dist` tiles. Whenever it sits exactly
// on a tile centre, decide(m) may change m.dir (or set it to STOP).
function advance(m, dist, decide) {
  let guard = 0
  while (dist > 1e-9 && guard++ < 16) {
    if (m.off === 0) {
      decide(m)
      if (m.dir === STOP) return
    }
    const remain = 1 - m.off
    if (dist < remain) {
      m.off += dist
      return
    }
    dist -= remain
    m.off = 0
    m.tx += m.dir.x
    m.ty += m.dir.y
    // the tunnel: leave one side, come back in on the other
    if (m.tx === -1 && m.dir === LEFT) m.tx = COLS
    else if (m.tx === COLS && m.dir === RIGHT) m.tx = -1
    if (m.onArrive) m.onArrive(m)
  }
}

export class Game {
  constructor() {
    this.high = 0
    this.score = 0
    this.lives = 3
    this.level = 1
    this.state = 'menu' // menu | ready | play | freeze | dying | clear | over
    this.version = 0 // bumps whenever something the interface shows changes
    this.anim = 0 // seconds, for animation
    this.popups = []
    this.want = null
    this.newLevel()
  }

  bump() {
    this.version++
  }

  // ---- setup ------------------------------------------------------------

  start() {
    this.score = 0
    this.lives = 3
    this.level = 1
    this.extraLife = false
    this.newLevel()
    this.state = 'ready'
    this.timer = 2.2
    this.bump()
  }

  newLevel() {
    this.tiles = MAP.map((row) => row.split(''))
    this.dots = MAP.join('').replace(/[^.o]/g, '').length
    this.params = levelParams(this.level)
    this.resetActors()
  }

  resetActors() {
    this.pac = { tx: 14, ty: 23, off: 0.5, dir: LEFT, face: LEFT, onArrive: () => this.eat() }
    this.want = null
    this.fright = 0
    this.chain = 0
    this.modeIdx = 0
    this.globalMode = MODES[0][0]
    this.modeTimer = MODES[0][1]
    this.popups = []
    this.ghosts = GHOST_DEFS.map((def, i) => {
      const g = { ...def, bob: i * 1.7, reverse: false, wait: def.delay }
      g.onArrive = () => this.ghostArrived(g)
      if (def.home) {
        g.state = 'house'
        g.fx = def.home.x
        g.fy = def.home.y
        g.tx = 14
        g.ty = 14
        g.off = 0
        g.dir = LEFT
      } else {
        // Blinky starts outside, above the house, heading left
        g.state = this.globalMode
        g.tx = 14
        g.ty = 11
        g.off = 0.5
        g.dir = LEFT
      }
      return g
    })
  }

  // ---- input --------------------------------------------------------------

  setDir(d) {
    if (this.state === 'menu' || this.state === 'over') return
    this.want = d
    const p = this.pac
    // turning back mid-tile is allowed straight away
    if (p.off > 0 && d === opposite(p.dir)) {
      p.tx += p.dir.x
      p.ty += p.dir.y
      p.off = 1 - p.off
      p.dir = d
      p.face = d
    }
  }

  // ---- map queries --------------------------------------------------------

  tileAt(x, y) {
    if (y < 0 || y >= ROWS) return '#'
    if (x < 0 || x >= COLS) return y === TUNNEL_ROW && (x === -1 || x === COLS) ? ' ' : '#'
    return this.tiles[y][x]
  }

  canWalk(x, y) {
    const c = this.tileAt(x, y)
    return c !== '#' && c !== '-'
  }

  // ---- update -------------------------------------------------------------

  update(dt) {
    this.anim += dt
    for (const p of this.popups) p.t += dt
    this.popups = this.popups.filter((p) => p.t < 1.2)

    switch (this.state) {
      case 'ready':
        this.timer -= dt
        this.bobHouse()
        if (this.timer <= 0) {
          this.state = 'play'
          this.bump()
        }
        break
      case 'play':
        this.updatePlay(dt)
        break
      case 'freeze':
        this.timer -= dt
        if (this.timer <= 0) {
          this.state = 'play'
          this.bump()
        }
        break
      case 'dying':
        this.timer -= dt
        if (this.timer <= 0) this.afterDeath()
        break
      case 'clear':
        this.timer -= dt
        if (this.timer <= 0) {
          this.level++
          this.newLevel()
          this.state = 'ready'
          this.timer = 2
          this.bump()
        }
        break
      default:
        this.bobHouse()
    }
  }

  bobHouse() {
    for (const g of this.ghosts) {
      if (g.state === 'house') g.fy = g.home.y + Math.sin(this.anim * 7 + g.bob) * 0.2
    }
  }

  updatePlay(dt) {
    const fp = this.params

    if (this.fright > 0) {
      this.fright -= dt
      if (this.fright <= 0) this.endFright()
    } else {
      this.modeTimer -= dt
      if (this.modeTimer <= 0) this.nextMode()
    }

    const p = this.pac
    advance(p, (this.fright > 0 ? fp.pacFright : fp.pac) * dt, (m) => this.pacDecide(m))
    if (p.dir !== STOP) p.face = p.dir

    for (const g of this.ghosts) this.moveGhost(g, dt)
    this.collide()

    if (this.state === 'play' && this.dots === 0) {
      this.state = 'clear'
      this.timer = 1.9
      this.bump()
    }
  }

  pacDecide(m) {
    const w = this.want
    if (w && w !== STOP && this.canWalk(m.tx + w.x, m.ty + w.y)) m.dir = w
    else if (!this.canWalk(m.tx + m.dir.x, m.ty + m.dir.y)) m.dir = STOP
  }

  eat() {
    const p = this.pac
    const row = this.tiles[p.ty]
    const c = row && row[p.tx]
    if (c === '.') {
      row[p.tx] = ' '
      this.addScore(10)
      this.dots--
    } else if (c === 'o') {
      row[p.tx] = ' '
      this.addScore(50)
      this.dots--
      this.startFright()
    }
  }

  addScore(n) {
    this.score += n
    if (!this.extraLife && this.score >= 10000) {
      this.extraLife = true
      this.lives++
    }
    if (this.score > this.high) this.high = this.score
    this.bump()
  }

  // ---- ghost modes ----------------------------------------------------------

  startFright() {
    this.chain = 0
    this.fright = this.params.fright
    for (const g of this.ghosts) {
      if (g.state === 'scatter' || g.state === 'chase') {
        g.state = 'frightened'
        g.reverse = true
      }
    }
  }

  endFright() {
    for (const g of this.ghosts) if (g.state === 'frightened') g.state = this.globalMode
  }

  nextMode() {
    this.modeIdx = Math.min(this.modeIdx + 1, MODES.length - 1)
    const [mode, dur] = MODES[this.modeIdx]
    this.globalMode = mode
    this.modeTimer = dur
    for (const g of this.ghosts) {
      if (g.state === 'scatter' || g.state === 'chase') {
        g.state = mode
        g.reverse = true
      }
    }
  }

  // ---- ghost movement ----------------------------------------------------------

  ghostPos(g) {
    return g.state === 'house' || g.state === 'leaving' || g.state === 'reviving' ? { x: g.fx, y: g.fy } : posOf(g)
  }

  moveGhost(g, dt) {
    const fp = this.params
    switch (g.state) {
      case 'house':
        g.wait -= dt
        g.fy = g.home.y + Math.sin(this.anim * 7 + g.bob) * 0.2
        if (g.wait <= 0) g.state = 'leaving'
        return
      case 'leaving': {
        const step = 5 * dt
        if (Math.abs(g.fx - DOOR_X) > 0.02) {
          g.fx += Math.sign(DOOR_X - g.fx) * Math.min(step, Math.abs(DOOR_X - g.fx))
        } else if (g.fy > HOUSE_TOP_Y) {
          g.fx = DOOR_X
          g.fy = Math.max(HOUSE_TOP_Y, g.fy - step)
        } else {
          // out of the house: back on the grid, heading left
          g.tx = 14
          g.ty = 11
          g.off = 0.5
          g.dir = LEFT
          g.reverse = false
          g.state = this.fright > 0 ? 'frightened' : this.globalMode
        }
        return
      }
      case 'reviving': {
        const step = 6 * dt
        if (Math.abs(g.fx - DOOR_X) > 0.02) g.fx += Math.sign(DOOR_X - g.fx) * Math.min(step, Math.abs(DOOR_X - g.fx))
        else if (g.fy < 14.5) g.fy = Math.min(14.5, g.fy + step)
        else {
          g.state = 'leaving'
          g.fx = DOOR_X
        }
        return
      }
      default: {
        let speed = fp.ghost
        if (g.state === 'frightened') speed = fp.ghostFright
        else if (g.state === 'eaten') speed = fp.ghostEaten
        else if (g.ty === TUNNEL_ROW && (g.tx < 6 || g.tx > 21)) speed = fp.ghostTunnel
        advance(g, speed * dt, (m) => this.ghostDecide(m))
      }
    }
  }

  ghostArrived(g) {
    // an eaten pumpkin that reaches the tile above the door floats back into the house
    if (g.state === 'eaten' && g.ty === 11 && (g.tx === 13 || g.tx === 14)) {
      g.state = 'reviving'
      g.fx = g.tx + 0.5
      g.fy = 11.5
    }
  }

  ghostDecide(g) {
    if (g.reverse) {
      g.reverse = false
      const o = opposite(g.dir)
      if (this.canWalk(g.tx + o.x, g.ty + o.y)) {
        g.dir = o
        return
      }
    }
    const back = opposite(g.dir)
    let options = DIRS.filter((d) => d !== back && this.canWalk(g.tx + d.x, g.ty + d.y))
    if (g.state !== 'frightened' && g.state !== 'eaten' && NO_UP.has(`${g.tx},${g.ty}`)) {
      options = options.filter((d) => d !== UP)
    }
    if (options.length === 0) {
      g.dir = this.canWalk(g.tx + back.x, g.ty + back.y) ? back : STOP
      return
    }
    if (g.state === 'frightened') {
      g.dir = options[Math.floor(Math.random() * options.length)]
      return
    }
    const t = g.state === 'eaten' ? { x: 13, y: 11 } : this.target(g)
    let best = options[0]
    let bestD = Infinity
    for (const d of options) {
      const dx = g.tx + d.x - t.x
      const dy = g.ty + d.y - t.y
      const dist = dx * dx + dy * dy
      if (dist < bestD) {
        bestD = dist
        best = d
      }
    }
    g.dir = best
  }

  // where a hunting pumpkin is heading (classic behaviours: each has a personality)
  target(g) {
    if (g.state === 'scatter') return g.scatter
    const pp = posOf(this.pac)
    const px = Math.floor(pp.x)
    const py = Math.floor(pp.y)
    const f = this.pac.face
    switch (g.id) {
      case 'blinky':
        return { x: px, y: py }
      case 'pinky':
        return { x: px + f.x * 4, y: py + f.y * 4 }
      case 'inky': {
        const b = this.ghosts[0]
        const bp = posOf(b)
        const ax = px + f.x * 2
        const ay = py + f.y * 2
        return { x: ax * 2 - Math.floor(bp.x), y: ay * 2 - Math.floor(bp.y) }
      }
      default: {
        // clyde: hunts when far away, gives up when close
        const dx = g.tx - px
        const dy = g.ty - py
        return dx * dx + dy * dy > 64 ? { x: px, y: py } : g.scatter
      }
    }
  }

  // ---- collisions -----------------------------------------------------------------

  collide() {
    const pp = posOf(this.pac)
    for (const g of this.ghosts) {
      if (g.state === 'house' || g.state === 'reviving' || g.state === 'eaten') continue
      const gp = this.ghostPos(g)
      const dx = gp.x - pp.x
      const dy = gp.y - pp.y
      if (dx * dx + dy * dy > 0.5) continue // ~0.7 of a tile
      if (g.state === 'frightened') this.eatGhost(g, gp)
      else {
        this.die()
        return
      }
    }
  }

  eatGhost(g, gp) {
    const pts = 200 * 2 ** Math.min(this.chain, 3)
    this.chain++
    g.state = 'eaten'
    g.reverse = false
    this.addScore(pts)
    this.popups.push({ x: gp.x, y: gp.y, text: String(pts), t: 0 })
    this.state = 'freeze'
    this.timer = 0.6
    this.bump()
  }

  die() {
    this.state = 'dying'
    this.timer = 1.7
    this.fright = 0
    this.bump()
  }

  afterDeath() {
    this.lives--
    if (this.lives <= 0) {
      this.state = 'over'
    } else {
      this.resetActors()
      this.state = 'ready'
      this.timer = 1.8
    }
    this.bump()
  }
}
