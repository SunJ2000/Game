export const MATCH_SIZE = 7
export const ANIMAL_COUNT = 6
export type TargetPower = 'hammer' | 'rocket' | 'rainbow'
export function powerTargets(board: number[], index: number, power: TargetPower, size = MATCH_SIZE) {
  if (index < 0 || index >= board.length) return new Set<number>()
  if (power === 'hammer') return new Set([index])
  if (power === 'rainbow') return new Set(board.flatMap((value, i) => value === board[index] ? [i] : []))
  const row = Math.floor(index / size), column = index % size
  return new Set(Array.from({ length: size }, (_, n) => row * size + n).concat(Array.from({ length: size }, (_, n) => n * size + column)))
}
export function reshuffleBoard(board: number[], rng = Math.random) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const next = [...board]
    for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [next[i], next[j]] = [next[j]!, next[i]!] }
    if (!findMatches(next).size && findHint(next)) return next
  }
  return createMatchBoard(rng)
}
export function findMatches(board: number[], size = MATCH_SIZE) {
  const matches = new Set<number>()
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, value = board[i]!
    if (value < 0) continue
    if (x <= size - 3 && board[i + 1] === value && board[i + 2] === value) {
      let n = x
      while (n < size && board[y * size + n] === value) matches.add(y * size + n++)
    }
    if (y <= size - 3 && board[i + size] === value && board[i + size * 2] === value) {
      let n = y
      while (n < size && board[n * size + x] === value) matches.add(n++ * size + x)
    }
  }
  return matches
}
export function adjacent(a: number, b: number, size = MATCH_SIZE) { return Math.abs(a % size - b % size) + Math.abs(Math.floor(a / size) - Math.floor(b / size)) === 1 }
export function swapTiles(board: number[], a: number, b: number) { const next = [...board]; [next[a], next[b]] = [next[b]!, next[a]!]; return next }
export function findHint(board: number[], size = MATCH_SIZE): [number, number] | undefined {
  for (let i = 0; i < board.length; i++) for (const next of [i + 1, i + size]) {
    if (next < board.length && adjacent(i, next, size) && findMatches(swapTiles(board, i, next), size).size > 0) return [i, next]
  }
}
export function createMatchBoard(rng = Math.random) {
  // Generate without initial matches, then guarantee at least one legal move.
  for (let attempt = 0; attempt < 100; attempt++) {
    const board: number[] = []
    for (let i = 0; i < MATCH_SIZE * MATCH_SIZE; i++) {
      const blocked = new Set<number>()
      if (i % MATCH_SIZE >= 2 && board[i - 1] === board[i - 2]) blocked.add(board[i - 1]!)
      if (i >= MATCH_SIZE * 2 && board[i - MATCH_SIZE] === board[i - MATCH_SIZE * 2]) blocked.add(board[i - MATCH_SIZE]!)
      const choices = Array.from({ length: ANIMAL_COUNT }, (_, n) => n).filter(n => !blocked.has(n))
      board.push(choices[Math.floor(rng() * choices.length)]!)
    }
    if (findHint(board)) return board
  }
  // Deterministic fallback for unusual RNGs: insert a known legal swap.
  const board = Array.from({ length: 49 }, (_, i) => (i % 7 + Math.floor(i / 7) * 2) % 6)
  board[0] = 0; board[1] = 1; board[2] = 0; board[8] = 0
  return board
}
export function collapseBoard(board: number[], cleared: Set<number>, rng = Math.random, size = MATCH_SIZE) {
  const next = [...board]
  for (let x = 0; x < size; x++) {
    const kept = Array.from({ length: size }, (_, y) => y * size + x).filter(i => !cleared.has(i)).map(i => board[i]!)
    const newCount = size - kept.length
    const column = [...Array.from({ length: newCount }, () => Math.floor(rng() * ANIMAL_COUNT)), ...kept]
    column.forEach((v, y) => next[y * size + x] = v)
  }
  return next
}
