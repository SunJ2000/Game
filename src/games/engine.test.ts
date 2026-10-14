import { describe, expect, it } from 'vitest'
import { canMove, floodReveal, makeMines, move2048, neighbors } from './engine'
describe('2048 rules', () => {
  it('merges a tile only once per turn and awards the merged value', () => { const result = move2048([2, 2, 2, 2, ...Array(12).fill(0)], 'left'); expect(result.board.slice(0, 4)).toEqual([4, 4, 0, 0]); expect(result.gained).toBe(8) })
  it('merges in the correct order for all directions', () => { const input = [2, 2, 4, 0, ...Array(12).fill(0)]; expect(move2048(input, 'right').board.slice(0, 4)).toEqual([0, 0, 4, 4]); const vertical = [2, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0]; expect(move2048(vertical, 'down').board.filter((_, i) => i % 4 === 0)).toEqual([0, 0, 4, 4]); expect(move2048(vertical, 'up').board.filter((_, i) => i % 4 === 0)).toEqual([4, 4, 0, 0]) })
  it('detects a full board with no valid moves', () => { const blocked = Array.from({ length: 16 }, (_, i) => (i + Math.floor(i / 4)) % 2 ? 2 : 4); expect(canMove(blocked)).toBe(false); blocked[0] = 2; expect(canMove(blocked)).toBe(true) })
})
describe('mines rules', () => {
  it('places exactly ten mines outside the first-click safe area', () => { for (const first of [0, 27, 63]) { const cells = makeMines(first, 8, 10, () => .37); expect(cells.filter(v => v === -1)).toHaveLength(10); expect(cells[first]).toBe(0); expect(neighbors(first).every(i => cells[i] !== -1)).toBe(true); for (let i = 0; i < 64; i++) if (cells[i] !== -1) expect(cells[i]).toBe(neighbors(i).filter(n => cells[n] === -1).length) } })
  it('floods safe empty areas while preserving flags and avoiding mines', () => { const cells = makeMines(0, 8, 10, () => .9); const flags = new Set([1]); const revealed = floodReveal(cells, new Set(), flags, 0); expect(revealed.has(0)).toBe(true); expect(revealed.has(1)).toBe(false); expect([...revealed].every(i => cells[i] !== -1)).toBe(true) })
})
