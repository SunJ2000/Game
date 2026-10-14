import { makeSandPainting, paintingCount } from './patterns'
import recipes from './level-recipes.json'

// Queues are generated offline. No solving runs on the player's phone.
export const sandLevels = Array.from({ length: paintingCount }, (_, index) => {
  const level = makeSandPainting(index)
  level.columns = recipes[index]!
  return level
})
