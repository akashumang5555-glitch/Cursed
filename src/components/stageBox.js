// Position/size a layer using Figma design coordinates (px on the 1728 x 1063
// frame), expressed as % so it scales with the artwork canvas.
const FRAME_W = 1728
const FRAME_H = 1063

export function stageBox(x, y, w, h) {
  return {
    left: `${(x / FRAME_W) * 100}%`,
    top: `${(y / FRAME_H) * 100}%`,
    width: `${(w / FRAME_W) * 100}%`,
    height: `${(h / FRAME_H) * 100}%`,
  }
}

// Same, but x/y is the centre of the layer.
export function stageBoxCentered(cx, cy, w, h) {
  return stageBox(cx - w / 2, cy - h / 2, w, h)
}
