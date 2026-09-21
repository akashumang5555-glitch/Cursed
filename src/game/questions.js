// The five questions, in order. `type` picks the option component:
//   pills  -> <OptionPill>   (text choices)
//   colors -> <ColorOption>  (colour swatches)
//   images -> <ImageOption>  (creature pictures)
//
// Each option `id` is what the curse combinations in curses.js refer to.

import ghost from '../assets/game/creature-ghost.png'
import witch from '../assets/game/creature-witch-hat.png'
import bat from '../assets/game/creature-bat.png'
import vampire from '../assets/game/creature-vampire.png'

export const QUESTIONS = [
  {
    id: 'trait',
    number: '01',
    title: 'How would you describe yourself?',
    type: 'pills',
    options: [
      { id: 'curious', label: 'CURIOUS' },
      { id: 'calm', label: 'CALM' },
      { id: 'chaotic', label: 'CHAOTIC' },
      { id: 'fearless', label: 'FEARLESS' },
    ],
  },
  {
    id: 'follow',
    number: '02',
    title: 'WHAT DO YOU FOLLOW?',
    type: 'pills',
    options: [
      { id: 'logic', label: 'LOGIC' },
      { id: 'instinct', label: 'INSTINCT' },
      { id: 'luck', label: 'LUCK' },
      { id: 'people', label: 'PEOPLE' },
    ],
  },
  {
    id: 'color',
    number: '03',
    // The Figma frame repeats "WHAT DO YOU FOLLOW?" here; this is a placeholder title.
    title: 'WHICH COLOR CALLS YOU?',
    type: 'colors',
    options: [
      { id: 'red', label: 'Red', color: '#de2525' },
      { id: 'purple', label: 'Purple', color: '#6625de' },
      { id: 'green', label: 'Green', color: '#24c400' },
      { id: 'black', label: 'Black', color: '#131313' },
    ],
  },
  {
    id: 'creature',
    number: '04',
    title: 'Which one would you choose?',
    type: 'images',
    // width/height = the picture's size in Figma design px
    options: [
      { id: 'ghost', label: 'Ghost', image: ghost, width: 127, height: 163 },
      { id: 'witch', label: 'Witch', image: witch, width: 156, height: 136 },
      { id: 'bat', label: 'Bat', image: bat, width: 172, height: 144 },
      { id: 'vampire', label: 'Vampire', image: vampire, width: 148, height: 189 },
    ],
  },
  {
    id: 'weakness',
    number: '05',
    title: 'WHAT CAN BREAK YOU?',
    type: 'pills',
    options: [
      { id: 'overthinking', label: 'OVERTHINKING' },
      { id: 'anger', label: 'ANGER' },
      { id: 'fear', label: 'FEAR' },
      { id: 'curiosity', label: 'CURIOSITY' },
    ],
  },
]

export const QUESTION_COUNT = QUESTIONS.length
