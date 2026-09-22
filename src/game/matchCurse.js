import { CURSES } from './curses.js'

// How much each answer counts when nothing matches exactly, in question order
// [trait, follow, color, creature, weakness].
const WEIGHTS = [1, 1, 1.25, 1.5, 1.5]

// Small deterministic hash: the same answers always break a tie the same way.
function hash(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Picks the curse for a set of five answers.
 *
 * - If the answers are exactly one of the 16 combinations, that's the curse.
 * - There are 1024 possible answer sets but only 16 combinations, so otherwise
 *   the curse whose combination shares the most (weighted) answers wins.
 *   Ties are settled by a hash of the answers, so results are repeatable.
 *
 * @param {string[]} answers option ids, in question order
 * @returns {{ curse: object, exact: boolean, matches: number }}
 */
export function matchCurse(answers) {
  const scored = CURSES.map((curse) => {
    let score = 0
    let matches = 0
    curse.combo.forEach((id, i) => {
      if (answers[i] === id) {
        score += WEIGHTS[i]
        matches += 1
      }
    })
    return { curse, score, matches }
  })

  const best = Math.max(...scored.map((s) => s.score))
  const top = scored.filter((s) => s.score === best)
  const pick = top.length === 1 ? top[0] : top[hash(answers.join('|')) % top.length]

  return { curse: pick.curse, exact: pick.matches === answers.length, matches: pick.matches }
}
