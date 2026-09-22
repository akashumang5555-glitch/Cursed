import { useEffect, useRef, useState } from 'react'
import { stageBox, stageBoxCentered } from './stageBox.js'
import portalRim from '../assets/images/portal-rim.png'
import { isLow } from '../game/perf.js'

/*
 * Swirling portal inside the gate (WebGL fragment shader).
 *
 * The shader, colours and animation are the ones from the portal spec. Only the
 * layout numbers are re-measured: they describe the doorway of *this* project's
 * arch image (ruins-arch.png), read off its transparent pixels and converted to
 * Figma design px on the 1728 x 1063 frame.
 *
 *   door centre x ..... 865.7      unit U (door half-width) ..... 72.2
 *   arch top .......... 549.0      spring line (semicircle) ..... 621.3
 *   floor of doorway .. 778.7      vortex centre y .............. 663.9
 *
 * The canvas is 2.36 U wide and 3.35 U tall, centred on the vortex, and sits
 * BEHIND the arch image: the stones hide the seam around the doorway.
 */
const U = 72.2
const DOOR = { cx: 865.7, cy: 663.9, top: 549.0, bottom: 778.7 }
const CANVAS = { w: 2.36 * U, h: 3.35 * U }
const DOOR_W = 2 * U
const DOOR_H = DOOR.bottom - DOOR.top

// Where the visitor's pointer is over the doorway. The invisible hit area writes
// it; the shader loop reads it so the swirl can react to the cursor.
//   x / y are in "door units" (the doorway is 2 wide, the centre of the vortex is 0,0)
const pointer = { over: false, x: 0, y: 0 }

const canvasBox = stageBoxCentered(DOOR.cx, DOOR.cy, CANVAS.w, CANVAS.h)

// Spring line / floor of the doorway in door units, relative to the vortex centre.
const SPRING = ((621.3 - DOOR.cy) / U).toFixed(3) // -0.590
const FLOOR = ((DOOR.bottom - DOOR.cy) / U).toFixed(3) // 1.590

const VERTEX = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAGMENT = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uIgnite;      // 0 -> 1 : portal opens outward from the centre
uniform float uHover;       // 0 -> 1 : how much the pointer is disturbing the portal
uniform vec2  uMouse;       // pointer position, in door units
const float PI = 3.14159265;

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

/* Doorway shape in "door units": half-width 1, round top, flat bottom */
float sdArch(vec2 p){
  float cy = ${SPRING};
  float d = (p.y < cy) ? length(vec2(p.x, p.y - cy)) - 1.0 : abs(p.x) - 1.0;
  return max(d, p.y - ${FLOOR});
}

void main(){
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;   // 0..1, y down
  vec2 p  = (frag - 0.5) * vec2(${(CANVAS.w / U).toFixed(3)}, ${(CANVAS.h / U).toFixed(3)});   // door units, origin = vortex centre
  // hovering disturbs the swirl: ripples spread out from the pointer and the
  // light is pulled a little towards it (the doorway shape itself is not moved)
  vec2  dm   = p - uMouse;
  float md   = length(dm);
  float pull = uHover * exp(-md * md * 1.7);
  vec2  pd   = p - dm * pull * 0.24 + (dm / (md + 0.0001)) * sin(md * 15.0 - uTime * 6.5) * pull * 0.1;
  vec2  q    = vec2(pd.x, pd.y * 0.66);            // squash so vortex fills the tall doorway

  float r = length(q);
  float a = atan(q.y, q.x);
  float t = uTime;

  /* twisting vortex */
  float twist = 3.2 / (r + 0.28);
  vec2  w  = rot(twist - t * 0.8) * q;
  float n1 = fbm(w * 2.6 + vec2(0.0, t * 0.05));
  float n2 = fbm(w * 5.5 + n1 * 2.0 - vec2(t * 0.2, 0.0));

  float arms = 0.5 + 0.5 * sin(a * 3.0 + twist * 1.6 - t * 1.4 + n1 * 4.0);
  arms = pow(arms, 1.6);

  float e = clamp(arms * 0.75 + n2 * 0.55, 0.0, 1.0);
  e = smoothstep(0.15, 0.95, e);

  /* colours */
  vec3 deep = vec3(0.14, 0.00, 0.02);
  vec3 mid  = vec3(0.92, 0.04, 0.08);
  vec3 hi   = vec3(1.00, 0.36, 0.30);

  vec3 col = mix(deep, mid, e);
  col += vec3(1.0, 0.32, 0.28) * pull * 0.26;      // the disturbed light glows a little
  col += hi * pow(e, 3.0) * 0.9;

  /* bright pulsing core */
  float core = exp(-r * r * 5.5);
  col += vec3(1.0, 0.62, 0.55) * core * (0.9 + 0.15 * sin(t * 2.1));

  /* sparks streaming inward */
  vec2 g  = vec2(a / (2.0 * PI) * 16.0, 1.4 / (r + 0.2) - t * 0.5);
  vec2 id = floor(g);
  vec2 f  = fract(g) - 0.5;
  float h = hash(id);
  float sp = smoothstep(0.16, 0.0, length(f * vec2(1.0, 1.6))) * step(0.82, h) * smoothstep(0.1, 0.5, r);
  col += vec3(1.0, 0.78, 0.70) * sp * 1.2;

  /* clip to the arch + darken near the stone for depth */
  float d = sdArch(p);
  float alpha = 1.0 - smoothstep(0.02, 0.10, d);
  col *= mix(0.45, 1.0, smoothstep(0.0, 0.4, -d));
  col += vec3(0.95, 0.10, 0.12) * exp(-abs(d + 0.14) * 16.0) * 0.22;

  /* ignition: reveal from centre outward */
  float reveal = 1.0 - smoothstep(uIgnite * 2.3 - 0.6, uIgnite * 2.3, r);
  alpha *= reveal;

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col * alpha, alpha);   // premultiplied alpha
}
`

function compile(gl, type, src) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'shader compile failed')
  }
  return shader
}

// Starts the shader on `canvas`. Returns a cleanup function, or null if WebGL
// (or the shader) is unavailable.
function startPortal(canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  })
  if (!gl) return null

  let program
  let buffer
  try {
    program = gl.createProgram()
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link failed')
  } catch (err) {
    console.warn('Portal shader unavailable, using CSS fallback.', err)
    return null
  }
  gl.useProgram(program)

  // one big triangle that covers the whole canvas
  buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const uRes = gl.getUniformLocation(program, 'uRes')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const uIgnite = gl.getUniformLocation(program, 'uIgnite')
  const uHover = gl.getUniformLocation(program, 'uHover')
  const uMouse = gl.getUniformLocation(program, 'uMouse')
  gl.clearColor(0, 0, 0, 0)

  let raf = 0
  let start = 0
  let stopped = false

  function draw(t, ignite, hover = 0, mx = 0, my = 0) {
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(uRes, canvas.width, canvas.height)
    gl.uniform1f(uTime, t)
    gl.uniform1f(uIgnite, ignite)
    gl.uniform1f(uHover, hover)
    gl.uniform2f(uMouse, mx, my)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function resize() {
    // the vortex is soft, so it doesn't need a full retina canvas
    const dpr = Math.min(window.devicePixelRatio || 1, isLow() ? 1 : 1.5)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(2, Math.round(rect.width * dpr))
    canvas.height = Math.max(2, Math.round(rect.height * dpr))
    gl.viewport(0, 0, canvas.width, canvas.height)
    if (reduceMotion) draw(2.0, 1) // static, fully open frame
  }

  let lastDraw = 0
  let prevNow = 0
  let hover = 0 // eased 0..1, so the effect fades in and out smoothly
  let spin = 0 // extra rotation gained while hovering (makes the swirl speed up a little)
  let mx = 0
  let my = 0

  function frame(now) {
    if (stopped) return
    // lighter mode: draw every other frame (~30 fps)
    if (isLow() && now - lastDraw < 30) {
      raf = requestAnimationFrame(frame)
      return
    }
    lastDraw = now
    if (!start) start = now
    const t = (now - start) / 1000
    let ig = Math.min(Math.max((t - 0.1) / 1.3, 0), 1) // opens 0.1s -> 1.4s
    ig = ig * ig * (3 - 2 * ig)
    const dt = prevNow ? Math.min((now - prevNow) / 1000, 0.1) : 0.016
    prevNow = now
    hover += ((pointer.over ? 1 : 0) - hover) * Math.min(1, dt * 5)
    mx += (pointer.x - mx) * Math.min(1, dt * 9)
    my += (pointer.y - my) * Math.min(1, dt * 9)
    spin += hover * dt * 1.1
    draw(t + spin, ig, hover, mx, my)
    raf = requestAnimationFrame(frame)
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)

  // wait for the artwork so the portal opens once the scene is visible,
  // but never for longer than ~0.8s
  const decoded = Promise.all(
    Array.from(document.images).map((img) =>
      img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
    ),
  )
  Promise.race([decoded, new Promise((resolve) => setTimeout(resolve, 800))]).then(() => {
    if (stopped) return
    resize()
    if (!reduceMotion) raf = requestAnimationFrame(frame)
  })

  return () => {
    stopped = true
    cancelAnimationFrame(raf)
    observer.disconnect()
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
  }
}

// Behind the arch: light halo + the shader canvas (or a CSS fallback).
export default function Portal() {
  const canvasRef = useRef(null)
  const [webglFailed, setWebglFailed] = useState(false)

  useEffect(() => {
    const stop = startPortal(canvasRef.current)
    if (!stop) {
      setWebglFailed(true)
        return undefined
    }
    return stop
  }, [])

  return (
    <>
      <div
        className="portal-halo pointer-events-none absolute rounded-[50%] mix-blend-screen"
        style={stageBoxCentered(DOOR.cx, DOOR.cy + 0.2 * DOOR_H, 1.33 * DOOR_W, 1.33 * DOOR_W * 1.15)}
      />

      {webglFailed ? (
        // No WebGL: a rotating conic gradient clipped to the arch.
        <div
          className="absolute overflow-hidden rounded-t-[50%_32%]"
          style={stageBox(DOOR.cx - U * 1.05, DOOR.top - 4, U * 2.1, DOOR_H + 8)}
        >
          <div className="portal-fallback-spin absolute left-[-40%] top-[-10%] h-[120%] w-[180%]" />
        </div>
      ) : (
        <canvas ref={canvasRef} className="absolute" style={canvasBox} aria-hidden="true" />
      )}
    </>
  )
}

// In front of the arch: light spilling onto the ground.
export function PortalSpill() {
  return (
    <div
      className="floor-spill pointer-events-none absolute rounded-[50%] mix-blend-screen"
      style={stageBoxCentered(DOOR.cx, DOOR.bottom + 0.066 * DOOR_H, 1.5 * DOOR_W, 0.16 * DOOR_H)}
    />
  )
}

// Invisible button over the doorway: clicking the portal starts the game.
// It has no visual style, so the homepage looks exactly the same.
function trackPointer(e) {
  const r = e.currentTarget.getBoundingClientRect()
  // 0..1 across the doorway -> door units (x: -1..1, y measured from the vortex centre)
  const fx = (e.clientX - r.left) / r.width
  const fy = (e.clientY - r.top) / r.height
  pointer.over = true
  pointer.x = (fx - 0.5) * 2
  pointer.y = (DOOR.top + fy * DOOR_H - DOOR.cy) / U
}

export function PortalHitArea({ onEnter }) {
  return (
    <button
      type="button"
      aria-label="Enter the portal"
      onClick={onEnter}
      onPointerEnter={trackPointer}
      onPointerMove={trackPointer}
      onPointerLeave={() => {
        pointer.over = false
      }}
      className="absolute cursor-pointer rounded-t-[50%_32%] bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
      style={stageBox(DOOR.cx - U, DOOR.top, 2 * U, DOOR_H)}
    />
  )
}

// ---- Light coming out of the portal -----------------------------------------

const ARCH = { x: 623.59, y: 380, size: 486.6 } // the arch picture in the Figma frame

// Drawn in FRONT of the arch (additive), so it reads as light leaving the
// portal: it rims the stones and pools on the ground (the sparks are drawn
// on the rain canvas). It all fades in as the portal opens.
export function PortalLight() {
  return (
    <>
      {/* red light catching the stones around the doorway (a pre-baked picture: cheap to draw) */}
      <img
        src={portalRim}
        alt=""
        draggable="false"
        className="portal-rim pointer-events-none absolute max-w-none mix-blend-screen"
        style={stageBox(ARCH.x, ARCH.y, ARCH.size, ARCH.size)}
      />

      {/* light thrown onto the ground in front of the gate */}
      <div
        className="portal-pool pointer-events-none absolute mix-blend-screen"
        style={{
          ...stageBoxCentered(DOOR.cx, DOOR.bottom + 22, 6.2 * U, 1.05 * U),
          background: 'radial-gradient(closest-side, rgba(255,50,50,.55), rgba(220,20,40,.22) 55%, transparent 100%)',
        }}
      />

    </>
  )
}
