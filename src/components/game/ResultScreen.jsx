import { useEffect, useState } from 'react'
import { d, useGameScale } from './GameStage.jsx'
import GameButton from './GameButton.jsx'
import CurseCard from './CurseCard.jsx'
import { DownloadIcon, ShareIcon } from './ButtonIcons.jsx'
import { CARD_COLORS } from '../../game/curses.js'
import { CARD } from '../../game/cardLayout.js'
import { renderCardBlob } from '../../game/renderCard.js'
import CloseButton from './CloseButton.jsx'

// Final screen: the card, Download / Share, and a close button.
function ResultBody({ curse, colorId, onClose }) {
  const { W, H, s } = useGameScale()
  const [notice, setNotice] = useState('')

  // card + gap + buttons = 854 design px tall; fit it to the screen
  const k = Math.min(s, (H - 32) / 854, (W - 32) / CARD.width)
  const cardWidth = CARD.width * k
  const closeOutside = W >= cardWidth + 2 * (24 + 43.5) * k

  useEffect(() => {
    if (!notice) return undefined
    const t = window.setTimeout(() => setNotice(''), 2400)
    return () => window.clearTimeout(t)
  }, [notice])

  const fileName = `${curse.id}-curse.png`

  async function download() {
    const blob = await renderCardBlob(curse, colorId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function share() {
    const text = `I got ${curse.name}! ${curse.curse}`
    try {
      const blob = await renderCardBlob(curse, colorId)
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Cursed!', text })
        return
      }
      if (navigator.share) {
        await navigator.share({ title: 'Cursed!', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setNotice('Copied to clipboard')
    } catch (err) {
      if (err?.name !== 'AbortError') setNotice('Sharing is not available here')
    }
  }

  return (
    <div className="screen-in absolute inset-0 flex items-center justify-center" style={{ '--u': k }}>
      <div className="relative flex flex-col items-center" style={{ gap: d(19.157) }}>
        <div className="card-in relative">
          {/* one-off burst of light in the card's colour as it appears */}
          <span
            aria-hidden="true"
            className="card-burst pointer-events-none absolute -inset-[8%] rounded-[15%]"
            style={{ background: `radial-gradient(closest-side, ${CARD_COLORS[colorId] ?? '#A81F9D'}, transparent)` }}
          />
          <CurseCard curse={curse} colorId={colorId} width={cardWidth} />

          <CloseButton
            onClick={onClose}
            className="late-in absolute"
            style={
              closeOutside
                ? { left: `calc(100% + ${d(24)})`, top: d(8) }
                : { right: 10, top: 10, width: 38, height: 38 }
            }
          />
        </div>

        <div className="late-in flex items-start" style={{ gap: d(16.283) }}>
          <GameButton variant="outline" icon={<DownloadIcon size={24} />} onClick={download}>
            Download
          </GameButton>
          <GameButton variant="light" icon={<ShareIcon size={22} />} onClick={share}>
            Share
          </GameButton>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          className="absolute bottom-6 rounded-full bg-black/70 px-4 py-2 text-sm text-white"
          style={{ fontFamily: '"Instrument Sans", sans-serif' }}
        >
          {notice}
        </div>
      )}
    </div>
  )
}

export default ResultBody
