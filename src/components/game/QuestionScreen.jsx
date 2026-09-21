import { useEffect, useRef, useState } from 'react'
import { ScreenContent, d } from './GameStage.jsx'
import OptionPill from './OptionPill.jsx'
import ColorOption from './ColorOption.jsx'
import ImageOption from './ImageOption.jsx'
import backArrow from '../../assets/game/back-arrow.svg'

// One question: big faint number, title, and the row of options for its type.
export default function QuestionScreen({ question, canGoBack, onAnswer, onBack }) {
  const [picked, setPicked] = useState(null)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  function choose(id) {
    if (picked) return
    setPicked(id)
    // let the selected state show for a moment, then move on
    timer.current = window.setTimeout(() => onAnswer(id), 380)
  }

  // keys 1-4 pick the matching option
  useEffect(() => {
    const onKey = (e) => {
      const option = question.options[Number(e.key) - 1]
      if (option) choose(option.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const Option = { pills: OptionPill, colors: ColorOption, images: ImageOption }[question.type]
  const gap = question.type === 'colors' ? 30 : question.type === 'images' ? 55 : 55

  return (
    <>
      <ScreenContent top={265}>
        {/* big faint number behind the title */}
        <span
          aria-hidden="true"
          className="font-lilita pointer-events-none absolute left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-center"
          style={{
            top: d(226 - 265),
            fontSize: d(186),
            lineHeight: d(28.607),
            letterSpacing: d(-0.4768),
            color: 'rgba(255,214,230,0.09)',
          }}
        >
          {question.number}
        </span>

        {canGoBack && (
          <button
            type="button"
            aria-label="Previous question"
            onClick={onBack}
            className="absolute rounded outline-none transition-transform duration-150 hover:-translate-x-1 focus-visible:ring-2 focus-visible:ring-white/80"
            style={{
              left: `max(0px, calc(50% - ${d(389)}))`,
              top: d(195 - 265),
              width: d(48),
              height: d(16),
              padding: d(8),
              boxSizing: 'content-box',
              margin: d(-8),
            }}
          >
            <img src={backArrow} alt="" className="block size-full max-w-none" />
          </button>
        )}

        <h2
          className="relative m-0 text-center font-serif-display font-normal text-[#eadada]"
          style={{ fontSize: d(56), lineHeight: 1.46, textWrap: 'balance' }}
        >
          {question.title}
        </h2>

        <div
          className="relative flex flex-wrap items-center justify-center"
          style={{
            marginTop: d(question.type === 'pills' ? 65 : question.type === 'colors' ? 40 : 30),
            columnGap: d(gap),
            rowGap: d(question.type === 'colors' ? 30 : 24),
          }}
        >
          {question.options.map((option) => (
            <Option
              key={option.id}
              {...option}
              selected={picked === option.id}
              onSelect={() => choose(option.id)}
            />
          ))}
        </div>
      </ScreenContent>
    </>
  )
}
