import { reactive } from 'vue'
import type { GameId } from './data'
import { games } from './data'
interface Saved { favorites: GameId[]; recent: GameId[]; scores: Partial<Record<GameId, number>>; plays: number }
function read(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem('pocket-play-v1') || '{}')
    const ids = games.map(g => g.id)
    const scores = Object.fromEntries(Object.entries(raw.scores && typeof raw.scores === 'object' ? raw.scores : {}).filter(([id, value]) => ids.includes(id as GameId) && typeof value === 'number' && Number.isFinite(value) && value > 0))
    return { favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((id: GameId) => ids.includes(id)) : [], recent: Array.isArray(raw.recent) ? raw.recent.filter((id: GameId) => ids.includes(id)) : [], scores, plays: Number(raw.plays) || 0 }
  } catch { return { favorites: [], recent: [], scores: {}, plays: 0 } }
}
export const saved = reactive(read())
export function persist() { try { localStorage.setItem('pocket-play-v1', JSON.stringify(saved)) } catch { /* Games remain playable if storage is unavailable. */ } }
export function toggleFavorite(id: GameId) { saved.favorites = saved.favorites.includes(id) ? saved.favorites.filter(x => x !== id) : [...saved.favorites, id]; persist() }
export function recordPlay(id: GameId) { saved.recent = [id, ...saved.recent.filter(x => x !== id)].slice(0, 6); saved.plays++; persist() }
export function recordScore(id: GameId, score: number, lower = false) {
  const previous = saved.scores[id]
  if (score > 0 && (previous === undefined || (lower ? score < previous : score > previous))) { saved.scores[id] = score; persist() }
}
