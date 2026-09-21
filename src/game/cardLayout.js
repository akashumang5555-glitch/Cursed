// Layout of the result card in Figma design px (the card is 472.214 x 782.554).
// Shared by the on-screen card (CurseCard.jsx) and the PNG export (renderCard.js)
// so both always look the same.

import cardArtSvg from '../assets/game/card-art.svg?raw'
import { CARD_COLORS } from './curses.js'

export const CARD = {
  width: 472.214,
  height: 782.554,
  radius: 30.825,
  title: { centerX: 236.107, top: 411.87, lineHeight: 40.229, letterSpacing: -0.4567 },
  text: { centerX: 238.98, top: 463.59, width: 357.273, fontSize: 16.283, lineHeight: 1.34 },
  // The icon sits just below the description, so it follows the text when the
  // description wraps to 3 lines. With 2 lines it lands exactly on Figma's top (529.2).
  icon: { left: 196.63, size: 94.275, gap: 21.96 },
}

// Long names get a smaller font so they stay inside the mouth of the monster.
export function titleFontSize(name) {
  if (name.length <= 11) return 37.356
  if (name.length <= 14) return 33
  return 28
}

// The purple of the Figma card; swapped for the colour the player picked.
const FIGMA_PURPLE = '#A81F9D'
const artCache = {}

export function cardArtUri(colorId) {
  const color = CARD_COLORS[colorId] ?? FIGMA_PURPLE
  if (!artCache[color]) {
    const svg = cardArtSvg.replaceAll(FIGMA_PURPLE, color)
    artCache[color] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }
  return artCache[color]
}
