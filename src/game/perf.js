/*
 * Automatic quality control.
 *
 * The page has a lot of glow, light and particle effects. On a fast computer
 * all of it runs at 60 fps; on slower machines (integrated graphics, big
 * screens) that is too much. So we watch the real frame rate for a few
 * seconds after load and, if it is too low, switch to a lighter look:
 *
 *   <html data-quality="low">
 *
 * CSS (index.css) and the canvas code (Rain, Portal, dive) read that flag.
 * It only ever goes down, never back up, so the page can't flip-flop.
 */

const isLow = () => document.documentElement.dataset.quality === 'low'
export { isLow }

export function watchPerformance() {
  const html = document.documentElement
  if (html.dataset.quality) return () => {}

  const WINDOW = 60 // frames per sample (about 1-2 seconds)
  const START_AFTER = 3000 // ms: skip load-time hitches (decoding, first paint)
  const GIVE_UP_AFTER = 40000
  const t0 = performance.now()
  let raf = 0
  let last = 0
  let frames = []
  let bad = 0

  function frame(now) {
    if (isLow() || now - t0 > GIVE_UP_AFTER) return
    if (document.visibilityState === 'hidden') {
      last = 0
      frames = []
      raf = requestAnimationFrame(frame)
      return
    }
    if (last && now - t0 > START_AFTER) {
      frames.push(now - last)
      if (frames.length >= WINDOW) {
        frames.sort((a, b) => a - b)
        const median = frames[frames.length >> 1]
        // median frame slower than ~35 fps for THREE samples in a row -> go light
        // (one-off hiccups from other programs must not downgrade the page)
        bad = median > 28 ? bad + 1 : 0
        frames = []
        if (bad >= 3) {
          html.dataset.quality = 'low'
          return
        }
      }
    }
    last = now
    raf = requestAnimationFrame(frame)
  }

  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}

// Decode the game's pictures while the player is still on the home page, so
// the first game screen doesn't stall on image decoding.
export function preloadGameAssets(urls) {
  const run = () =>
    urls.forEach((src) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = src
      img.decode?.().catch(() => {})
    })
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 1500)
}
