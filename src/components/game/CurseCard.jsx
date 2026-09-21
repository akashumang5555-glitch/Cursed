import { ICONS } from '../../game/icons.js'
import { CARD, cardArtUri, titleFontSize } from '../../game/cardLayout.js'

/*
 * The card the player receives. The artwork is an image (exported from Figma);
 * the name, description and icon are live, so any curse can be shown:
 *
 *   <CurseCard curse={curse} colorId="purple" width={472} />
 *
 * `colorId` is the colour answer, which tints the top of the card.
 */
export default function CurseCard({ curse, colorId, width = CARD.width, className = '' }) {
  const k = width / CARD.width

  return (
    <div className={`relative ${className}`} style={{ width, height: CARD.height * k }}>
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden text-white"
        style={{
          width: CARD.width,
          height: CARD.height,
          borderRadius: CARD.radius,
          transform: `scale(${k})`,
        }}
      >
        <img
          src={cardArtUri(colorId)}
          alt=""
          draggable="false"
          className="absolute inset-0 size-full select-none"
        />

        <h3
          className="font-lilita absolute m-0 whitespace-nowrap text-center"
          style={{
            left: CARD.title.centerX,
            top: CARD.title.top,
            transform: 'translateX(-50%)',
            fontSize: titleFontSize(curse.name),
            lineHeight: `${CARD.title.lineHeight}px`,
            letterSpacing: CARD.title.letterSpacing,
            fontWeight: 400,
          }}
        >
          {curse.name}
        </h3>

        {/* description, with the icon flowing right under it */}
        <div
          className="absolute"
          style={{
            left: CARD.text.centerX - CARD.text.width / 2,
            top: CARD.text.top,
            width: CARD.text.width,
          }}
        >
          <p
            className="m-0 text-center"
            style={{
              fontSize: CARD.text.fontSize,
              lineHeight: CARD.text.lineHeight,
              fontFamily: '"Instrument Sans", sans-serif',
            }}
          >
            {curse.curse}
          </p>
          <img
            src={ICONS[curse.icon]}
            alt={curse.name}
            draggable="false"
            className="block object-contain"
            style={{
              marginLeft: CARD.icon.left - (CARD.text.centerX - CARD.text.width / 2),
              marginTop: CARD.icon.gap,
              width: CARD.icon.size,
              height: CARD.icon.size,
            }}
          />
        </div>
      </div>
    </div>
  )
}
