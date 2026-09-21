// The classic 28 x 31 Pac-Man maze.
//   #  wall        .  dot        o  power pellet
//   -  ghost-house door          (space) empty floor
// Row 14 is the tunnel: it is open at both ends and wraps around.

export const COLS = 28
export const ROWS = 31
export const TUNNEL_ROW = 14

export const MAP = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '     #.##### ## #####.#     ',
  '     #.##          ##.#     ',
  '     #.## ###--### ##.#     ',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '     #.## ######## ##.#     ',
  '     #.##          ##.#     ',
  '     #.## ######## ##.#     ',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......  .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
]

// Directions. Always compare these by identity (===).
export const UP = { x: 0, y: -1 }
export const LEFT = { x: -1, y: 0 }
export const DOWN = { x: 0, y: 1 }
export const RIGHT = { x: 1, y: 0 }
export const STOP = { x: 0, y: 0 }
// order matters: it is the tie-break order when a ghost can't decide (up, left, down, right)
export const DIRS = [UP, LEFT, DOWN, RIGHT]

export function opposite(d) {
  if (d === UP) return DOWN
  if (d === DOWN) return UP
  if (d === LEFT) return RIGHT
  if (d === RIGHT) return LEFT
  return STOP
}
