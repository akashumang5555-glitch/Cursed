# Design decisions

Notes on the non-obvious choices behind the Cursed site and game — why things are
built this way, not just what they do. File paths point at the code that embodies
each decision.

## Stack

Plain React 19 + Vite + Tailwind v4, no router, no state library. `App.jsx` is a
single state machine (`screen: home | intro | quiz | finding | result | pacman`)
driving which screen mounts. For a one-page experience with five linear screens
and one side game, a router/store would have added indirection without solving
a real problem — `useState` plus a handful of `setTimeout`s is enough, and it
keeps the whole flow readable in one file (`src/App.jsx:29`).

## Figma fidelity via a coordinate system, not pixel-matched CSS

Every hand-placed layer (arch, mist, logo, cauldron, UI text) is positioned from
numbers read directly off the Figma frame (1728×1063 for the hero, its own frame
for the game room), converted to percentages of that frame with `stageBox()` /
`stageBoxCentered()` (`src/components/stageBox.js`). The frame itself is scaled
as one block (`--k`, `--s`, `--u` CSS variables) rather than each element being
given its own responsive breakpoints.

**Why:** this keeps the code a direct transcription of the design file — a
comment above each layer even cites the Figma node id (e.g. `src/components/Hero.jsx:57`,
`Portal.jsx:9-20`) — so updates to the Figma file can be re-applied by copying
numbers, not re-deriving layout logic. It also guarantees every element scales
together and never drifts out of registration with the artwork at any viewport
size.

## Two different responsive strategies for two different screens

- **Hero (`src/hooks/useHeroLayout.js`)**: scales the whole artwork frame
  uniformly, but recentres and *enlarges* it on portrait screens (phones held
  upright) around a different anchor point (`PORTRAIT_CENTER_X`) so the logo,
  arch and tagline stay legible instead of shrinking to fit width. The
  background image is scaled independently (`sb`) so it always covers the
  viewport even when the artwork is anchored oddly.
- **Game room (`src/components/game/GameStage.jsx`)**: uses a `cover` scale
  (`s`) for the artwork so the room always fills the screen, but a *separate*
  UI scale (`u`) for text and buttons — equal to `s` on desktop (pixel-match
  with Figma) but floored/enlarged on narrow screens so text doesn't become
  unreadably small.

**Why:** a single scale factor works for a static background but not for a
readable UI — decoupling "how big is the art" from "how big is the text" was
necessary once phone widths were considered, even though the site is
desktop-only in production (see below); the room UI still needed to survive
narrow desktop windows.

## Desktop-only via non-mount, not CSS hiding

`DesktopOnlyGate` (`src/components/DesktopOnlyGate.jsx`) renders a black notice
screen instead of `children` below a 1024px breakpoint — it does not render the
site and hide it with CSS.

**Why:** the page runs a WebGL portal shader, a WebGL fluid-sim cursor, a rain
canvas, and several `requestAnimationFrame` loops. Mounting all of that on a
phone and then hiding it with `display: none` would still burn battery and
CPU. Not mounting it at all means none of those loops ever start. The gate
only wraps `main.jsx`; `App.jsx` is untouched, so the desktop code path is
never aware the gate exists.

## Auto quality downgrade, one-way only

`watchPerformance()` (`src/game/perf.js`) samples real frame times for a few
seconds after load and, if the median frame is slower than ~28ms (≈35fps) for
three consecutive windows, sets `<html data-quality="low">`. CSS and canvas
code (Rain, Portal, dive overlay) read that flag to drop particle counts,
render at half framerate, or skip blur. The flag never resets.

**Why:** the page leans heavily on glow/particle effects that assume a
reasonably fast GPU. Rather than hand-authoring a "lite mode" toggle, the page
measures itself and degrades automatically — a one-off stutter (another app
stealing a frame) shouldn't downgrade the experience, hence requiring three
bad windows in a row, but once a machine is confirmed slow it should not
flip-flop back to "high" mid-session and cause visible jank.

## Portal: real WebGL shader with a CSS fallback

`Portal.jsx` renders the swirling vortex as a hand-written GLSL fragment
shader (domain-warped fbm noise, polar coordinates for the twist, an SDF for
the arch clipping), not a sprite sheet or CSS animation. If `getContext('webgl')`
fails, it falls back to a rotating conic-gradient `div` clipped to the same
arch shape, so the doorway is never empty.

**Why:** a shader gives continuous, non-repeating motion and lets the vortex
react to the pointer in real time (ripples pull toward the cursor) — effects a
looping sprite can't do cheaply. The fallback exists because WebGL isn't
guaranteed (old browsers, disabled GPU acceleration), and a plain colored hole
would break the scene entirely.

## The "dive into the portal" transition animates only `transform`/`opacity`

`src/game/dive.js` explicitly avoids blur/brightness filters and blend modes
on the zoomed layer, animating only `transform` and `opacity` via the Web
Animations API, with a comment noting that filters "made every frame very
slow" once the layer is scaled 22×.

**Why:** this was a measured performance fix, not a style preference — a
22×-scaled layer with a CSS filter applied forces the browser to repaint the
filter at the enlarged size every frame. Keeping the animated properties to
ones the compositor can run on the GPU (transform/opacity) keeps the transition
smooth regardless of scene complexity. Depth is faked instead by animating the
foreground and background layers at different scale exponents (`STAGE_SCALE`
vs `BG_SCALE`) so the background visibly lags — cheap parallax instead of a
real z-axis.

## The game room stays mounted across quiz screens

`GameStage` (`src/components/game/GameStage.jsx`) wraps every post-portal
screen (intro, quiz, finding, result) and is not remounted between them —
only its `children` and a couple of props (`dim`, `intense`, `showCauldron`)
change. `App.jsx` renders one `<GameStage>` for all four screens rather than
each screen owning its own background.

**Why:** the cauldron bubble/glow/wisp animation (`CauldronEffects.jsx`) would
visibly reset or jump if the room were remounted per screen. Keeping one
persistent backdrop component and swapping only the foreground content keeps
the cauldron animating continuously through the whole quiz, which matters
more here than component-per-screen separation would.

## Curse matching: weighted nearest-neighbor over a fixed set, not procedural generation

Sixteen curses are hand-authored (`src/game/curses.js`), each tied to one exact
combination of the five quiz answers. Since 5 questions × 4 options = 1024
possible answer sets but only 16 are "exact", `matchCurse()`
(`src/game/matchCurse.js`) scores every curse by how many answers it shares
with the player, weighted per question (`color` and `creature` count more than
`trait`/`follow`, `weakness` counts most), and picks the highest score. Ties
are broken by a small FNV-style hash of the answer string, not `Math.random()`.

**Why:** hand-written curses let each one read like a specific, considered
personality rather than a templated mad-lib, while the weighted fallback
guarantees every one of the 1024 possible paths still lands somewhere
sensible instead of erroring or defaulting to curse #1. The hash-based
tie-break was a deliberate choice over randomness so the *same* five answers
always produce the same curse — useful for sharing/reproducing a result, and
for testing.

## Card layout and PNG export share one source of truth

`src/game/cardLayout.js` defines the result card's geometry (title position,
text box, icon placement) once, in Figma design px, and both the on-screen
`CurseCard.jsx` and the downloadable-PNG renderer (`renderCard.js`) read from
it — rather than each maintaining its own copy of the numbers.

**Why:** the two renderers (DOM vs `<canvas>`) would otherwise be near-
impossible to keep visually identical by hand; a shared constants module makes
divergence a build-time impossibility rather than something to catch in
review. Card art color is swapped by string-replacing the purple hex in the
cached SVG source rather than using CSS `currentColor`, since the art is baked
into a raster/PNG export path that has no CSS to inherit from.

## Pumpkin Chase: game rules kept free of rendering

`src/pacman/engine.js` (Pac-Man-style maze chase) is pure logic — tile-grid
positions, ghost mode timers (scatter/chase waves matching the original
arcade game's timing), per-ghost release delays — with no canvas or DOM calls.
`render.js` and `PacmanScreen.jsx` are the only consumers.

**Why:** the file header states this directly — it's structured so the rules
can be tested/reasoned about independently of drawing, and so the renderer
could be swapped without touching game logic. Ghost behavior (scatter/chase
durations, the four ghosts' distinct release delays and home tiles, the
"no-upward-turn" tiles) mirrors the original 1980 arcade timing rather than
inventing new AI, since that behavior is what reads as "correctly Pac-Man" to
a player.

## Asset preloading during the quiz, not before it

`preloadGameAssets()` (`src/game/perf.js`) decodes the game room, cauldron,
and creature images in the background *while the player is still on the home
page* looking at the hero, using `requestIdleCallback` so it never competes
with the hero's own animations for main-thread time.

**Why:** the portal dive transition is ~1s; without preloading, the first
game screen would stall on image decode right as the transition lands. Idle
scheduling means the preload only runs during genuinely spare time, so it
doesn't cost the hero any frames.
