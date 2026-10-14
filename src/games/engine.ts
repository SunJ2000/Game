export type Direction = 'up' | 'down' | 'left' | 'right'
export function move2048(board: number[], direction: Direction) {
  const next = [...board]
  let gained = 0
  for (let line = 0; line < 4; line++) {
    const indexes = Array.from({ length: 4 }, (_, n) => direction === 'left' ? line * 4 + n : direction === 'right' ? line * 4 + 3 - n : direction === 'up' ? n * 4 + line : (3 - n) * 4 + line)
    const values = indexes.map(i => board[i]!).filter(Boolean)
    const result: number[] = []
    for (let n = 0; n < values.length; n++) {
      if (values[n] === values[n + 1]) { const value = values[n]! * 2; result.push(value); gained += value; n++ }
      else result.push(values[n]!)
    }
    indexes.forEach((i, n) => next[i] = result[n] || 0)
  }
  return { board: next, gained, changed: next.some((v, i) => v !== board[i]) }
}
export function addTile(board: number[], rng = Math.random) {
  const empty = board.flatMap((v, i) => v === 0 ? [i] : [])
  if (empty.length) board[empty[Math.floor(rng() * empty.length)]!] = rng() < .9 ? 2 : 4
  return board
}
export function canMove(board: number[]) { return board.includes(0) || (['up', 'down', 'left', 'right'] as Direction[]).some(d => move2048(board, d).changed) }
export function neighbors(index: number, size = 8) {
  const list: number[] = []
  const x = index % size, y = Math.floor(index / size)
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && x + dx >= 0 && x + dx < size && y + dy >= 0 && y + dy < size) list.push((y + dy) * size + x + dx)
  return list
}
export function makeMines(first: number, size = 8, count = 10, rng = Math.random) {
  const safe = new Set([first, ...neighbors(first, size)])
  const candidates = Array.from({ length: size * size }, (_, i) => i).filter(i => !safe.has(i))
  const mines = new Set<number>()
  for (let i = 0; i < count && candidates.length; i++) { const at = Math.floor(rng() * candidates.length); mines.add(candidates.splice(at, 1)[0]!) }
  return Array.from({ length: size * size }, (_, i) => mines.has(i) ? -1 : neighbors(i, size).filter(n => mines.has(n)).length)
}
export function floodReveal(cells: number[], revealed: Set<number>, flags: Set<number>, index: number) {
  const next = new Set(revealed), stack = [index]
  while (stack.length) {
    const n = stack.pop()!
    if (next.has(n) || flags.has(n) || cells[n] === -1) continue
    next.add(n)
    if (cells[n] === 0) stack.push(...neighbors(n))
  }
  return next
}
