import { ICONS } from './icons.js'
import { CARD, cardArtUri, titleFontSize } from './cardLayout.js'

// Draws the result card to a PNG (used by Download and Share).
// Mirrors CurseCard.jsx using the same numbers from cardLayout.js.

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

function wrapLines(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function renderCardBlob(curse, colorId, scale = 2) {
  await Promise.all([
    document.fonts.load('37px "Lilita One"'),
    document.fonts.load('16px "Instrument Sans"'),
  ])
  const [art, icon] = await Promise.all([loadImage(cardArtUri(colorId)), loadImage(ICONS[curse.icon])])

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(CARD.width * scale)
  canvas.height = Math.round(CARD.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.beginPath()
  ctx.roundRect(0, 0, CARD.width, CARD.height, CARD.radius)
  ctx.clip()
  ctx.drawImage(art, 0, 0, CARD.width, CARD.height)

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `${titleFontSize(curse.name)}px "Lilita One"`
  ctx.fillText(curse.name, CARD.title.centerX, CARD.title.top + CARD.title.lineHeight / 2)

  ctx.font = `${CARD.text.fontSize}px "Instrument Sans"`
  const lh = CARD.text.fontSize * CARD.text.lineHeight
  const lines = wrapLines(ctx, curse.curse, CARD.text.width)
  lines.forEach((line, i) => {
    ctx.fillText(line, CARD.text.centerX, CARD.text.top + lh * i + lh / 2)
  })
  const iconTop = CARD.text.top + lh * lines.length + CARD.icon.gap

  // icon, fitted inside its box like object-contain
  const box = CARD.icon.size
  const r = Math.min(box / icon.width, box / icon.height)
  const w = icon.width * r
  const h = icon.height * r
  ctx.drawImage(icon, CARD.icon.left + (box - w) / 2, iconTop + (box - h) / 2, w, h)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
