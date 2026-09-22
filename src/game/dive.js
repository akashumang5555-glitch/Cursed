/*
 * Camera move for "flying into the portal".
 *
 * The home scene is one element (`root`). Instead of a flat zoom it gets:
 *   - an accelerating push-in towards the doorway (slow start, fast finish),
 *   - depth: the distant forest (data-dive="bg") moves slower than the gate,
 *     and blurs like an out-of-focus background,
 *   - a slight camera roll,
 *   - the title, tagline and rain (data-dive="fade") dissolve early.
 * Built with the Web Animations API so the exact curve can be controlled.
 *
 * Performance: only `transform` and `opacity` are animated (both run on the
 * GPU compositor). No blur/brightness filters and no blend modes are used on
 * the zoomed scene - on a layer scaled 22x they made every frame very slow.
 */

export const DIVE_MS = 1050

const STAGE_SCALE = 22 // final zoom of the gate / portal
const BG_SCALE = 4 // final zoom of the distant background (smaller = farther away)
const STEPS = 32

// accelerating curve: 0 -> 1, slow at first, fast at the end
const curve = (t) => Math.pow(t, 1.75)

function originAt(el, x, y) {
  const r = el.getBoundingClientRect()
  el.style.transformOrigin = `${x - r.left}px ${y - r.top}px`
}

// x / y: the portal's centre in viewport px
export function playDive(root, { x, y }) {
  if (!root || !root.animate) return

  originAt(root, x, y)
  root.style.willChange = 'transform'
  const scene = []
  const background = []
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS
    const q = curve(t)
    scene.push({
      offset: t,
      transform: `rotate(${(-1.4 * q).toFixed(3)}deg) scale(${Math.pow(STAGE_SCALE, q).toFixed(4)})`,
    })
    background.push({
      offset: t,
      // cancels part of the scene's zoom, so the net zoom of the background is BG_SCALE ** q
      transform: `scale(${Math.pow(BG_SCALE / STAGE_SCALE, q).toFixed(4)})`,
    })
  }
  const opts = { duration: DIVE_MS, easing: 'linear', fill: 'forwards' }
  root.animate(scene, opts)

  const bg = root.querySelector('[data-dive="bg"]')
  if (bg) {
    originAt(bg, x, y)
    bg.style.willChange = 'transform'
    bg.animate(background, opts)
  }

  root.querySelectorAll('[data-dive="fade"]').forEach((el) => {
    el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: DIVE_MS * 0.42,
      easing: 'ease-in',
      fill: 'forwards',
    })
  })
}
