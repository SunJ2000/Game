import { describe, expect, it } from 'vitest'
import { bucketPose, PALETTE, SandCollector } from './engine'
import type { BucketSpec, SandLevel } from './engine'
import { sandLevels } from './levels'
import solutions from './solutions.json'

function level(width: number, height: number, sand: number[], columns: BucketSpec[][]): SandLevel {
  return { name: 'test', hint: '', width, height, sand: Uint8Array.from(sand), columns, seed: 9 }
}
const spec = (color: number, capacity = 800) => ({ color, capacity })
function sandCount(game: SandCollector) { return game.grid.reduce((sum, color) => sum + Number(color > 0), 0) }

describe('sand collection rules', () => {
  it('collects all six eligible layers from one snapshot, without reaching the seventh', () => {
    const game = new SandCollector(level(1, 8, Array(8).fill(1), [[spec(1)]]))
    game.start(); game.send(0); game.step()
    expect(game.collected).toBe(6)
    expect(sandCount(game)).toBe(2)
    expect(game.buckets[0]!.remaining).toBe(794)
  })
  it('keeps other colors while allowing matching sand inside the six-layer window', () => {
    const game = new SandCollector(level(1, 8, [1, 1, 1, 1, 1, 1, 2, 1], [[spec(1)]]))
    game.start(); game.send(0); game.step()
    expect(game.collected).toBe(5)
    expect(game.colorLeft[2]).toBe(1)
    expect(game.grid.filter(color => color === 2)).toHaveLength(1)
  })
  it('merges three same-color buckets, preserving capacity and previously collected amounts', () => {
    const game = new SandCollector(level(2, 2, [1, 1, 1, 1], [[spec(1, 400), spec(1, 800), spec(1, 800)]]))
    game.start(); game.send(0); game.send(0)
    game.buckets[0]!.remaining = 300; game.buckets[1]!.remaining = 500
    game.send(0)
    expect(game.buckets).toHaveLength(1)
    expect(game.buckets[0]!.capacity).toBe(2000)
    expect(game.buckets[0]!.remaining).toBe(1600)
    expect(game.merges).toBe(1)
    game.send(0) // Queue is empty: merged buckets never duplicate a queued bucket.
    expect(game.buckets).toHaveLength(1)
  })
  it('allows an already merged bucket to merge again and immediately frees two slots', () => {
    const game = new SandCollector(level(1, 1, [1], [[...Array.from({ length: 5 }, () => spec(1, 400))]]))
    game.start()
    for (let n = 0; n < 5; n++) game.send(0)
    expect(game.buckets).toHaveLength(1)
    expect(game.buckets[0]!.capacity).toBe(2000)
    expect(game.merges).toBe(2)
  })
  it('rejects a seventh bucket without consuming the queue, and advances only the selected column', () => {
    const game = new SandCollector(level(1, 1, [4], [Array(2).fill(spec(1)), Array(2).fill(spec(2)), Array(2).fill(spec(3)), [spec(4)]]))
    game.start()
    for (let i = 0; i < 3; i++) { game.send(i); game.send(i) }
    expect(game.buckets).toHaveLength(6)
    expect(game.send(3)).toBe('full')
    expect(game.columns[3]).toHaveLength(1)
    expect(game.columns[0]).toHaveLength(0)
    expect(game.send(99)).toBe('unavailable')
  })
  it('immediately removes a full bucket, allows a new bucket, and never overfills', () => {
    const game = new SandCollector(level(1, 8, Array(8).fill(1), [[spec(1, 2), spec(1, 6)]]))
    game.start(); game.send(0); game.step()
    expect(game.collected).toBe(2)
    expect(game.buckets).toHaveLength(0)
    expect(game.completed).toBe(1)
    expect(game.send(0)).toBe('sent')
    expect(game.buckets[0]!.remaining).toBe(6)
    expect(game.total).toBe(sandCount(game) + game.collected)
  })
  it('circulates an unfilled bucket without losing its contents or occupied slot', () => {
    const game = new SandCollector(level(1, 8, Array(8).fill(2), [[spec(1)], [spec(2)]]))
    game.start(); game.send(0)
    const id = game.buckets[0]!.id
    for (let i = 0; i < game.loopTicks; i++) game.step()
    expect(game.phase).toBe('playing')
    expect(game.buckets).toHaveLength(1)
    expect(game.buckets[0]!.id).toBe(id)
    expect(game.buckets[0]!.remaining).toBe(800)
    expect(game.buckets[0]!.progress).toBeCloseTo(.035)
  })
  it('keeps a hidden returning bucket occupied without collecting until it reappears', () => {
    const game = new SandCollector(level(1, 8, Array(8).fill(1), [[spec(1)]]))
    game.start(); game.send(0)
    const id = game.buckets[0]!.id
    game.buckets[0]!.progress = .5 - 1 / game.loopTicks
    for (let i = 0; i < game.loopTicks / 2; i++) game.step()
    expect(game.collected).toBe(0)
    expect(game.buckets).toHaveLength(1)
    expect(game.buckets[0]!.id).toBe(id)
    expect(game.buckets[0]!.remaining).toBe(800)
    game.step()
    expect(game.buckets[0]!.progress).toBeCloseTo(0)
    expect(game.collected).toBe(6)
    expect(game.buckets[0]!.remaining).toBe(794)
  })
  it('lets upper grains fall, conserves sand, and sleeps when nothing changes', () => {
    const game = new SandCollector(level(1, 10, Array(10).fill(1), [[spec(1, 1)], [spec(2)]]))
    game.start(); game.send(0); game.step()
    expect(game.grid[9]).toBe(1)
    for (let i = 0; i < 20; i++) game.step()
    expect(game.total).toBe(sandCount(game) + game.collected)
    expect(game.lastVisited).toBe(0)
  })
  it('waits for buckets to reach matching sand before declaring a full belt blocked', () => {
    const game = new SandCollector(level(160, 1, Array(159).fill(0).concat(3), [Array(2).fill(spec(1)), Array(2).fill(spec(2)), Array(2).fill(spec(3))]))
    game.start()
    for (let i = 0; i < 3; i++) { game.send(i); game.send(i) }
    for (let i = 0; i < game.loopTicks / 6; i++) game.step()
    expect(game.phase).toBe('playing')
    for (let i = 0; i < game.loopTicks; i++) game.step()
    expect(game.phase).toBe('won')
  })
  it('detects a genuine deadlock instead of leaving a full conveyor running forever', () => {
    const game = new SandCollector(level(1, 1, [4], [Array(2).fill(spec(1)), Array(2).fill(spec(2)), Array(2).fill(spec(3))]))
    game.start()
    for (let i = 0; i < 3; i++) { game.send(i); game.send(i) }
    for (let i = 0; i < 20; i++) game.step()
    expect(game.phase).toBe('lost')
  })
  it('shows a newly sent bucket immediately even during the global return phase, and separates rapid taps', () => {
    const game = new SandCollector(level(160, 1, Array(160).fill(4), [Array(2).fill(spec(1)), Array(2).fill(spec(2)), Array(2).fill(spec(3))]))
    game.start(); game.ticks = game.loopTicks * 2 + game.loopTicks * .8
    for (let column = 0; column < 3; column++) {
      for (let n = 0; n < 2; n++) {
        expect(game.send(column)).toBe('sent')
        const newest = game.buckets.at(-1)!
        expect(bucketPose(newest).visible).toBe(true)
        expect(newest.progress).toBeCloseTo(.035)
      }
    }
    const positions = game.buckets.map(bucket => bucketPose(bucket).x).sort((a, b) => a - b)
    expect(game.buckets.every(bucket => bucketPose(bucket).visible)).toBe(true)
    for (let i = 1; i < positions.length; i++) expect((positions[i]! - positions[i - 1]!) * 320).toBeGreaterThan(48)
    game.step()
    expect(game.buckets.every(bucket => bucketPose(bucket).visible)).toBe(true)
  })
  it('brings the merged bucket into view if the surviving bucket was returning offscreen', () => {
    const game = new SandCollector(level(1, 1, [2], [[spec(1), spec(1), spec(1)]]))
    game.start(); game.send(0); game.send(0)
    game.buckets[0]!.progress = .7; game.buckets[1]!.progress = .8
    game.send(0)
    expect(game.buckets).toHaveLength(1)
    expect(bucketPose(game.buckets[0]!).visible).toBe(true)
    expect(game.buckets[0]!.remaining).toBe(2400)
  })
  it('collects only inside the visible bucket mouth, including the larger merged mouth', () => {
    for (const capacity of [800, 2400]) {
      const game = new SandCollector(level(160, 1, Array(160).fill(1), [[spec(1, capacity)]]))
      game.start(); game.send(0); game.buckets[0]!.progress = .24
      game.step()
      const pose = bucketPose(game.buckets[0]!)
      const center = 20 + pose.x * 320
      const removed = Array.from(game.grid).flatMap((color, x) => color ? [] : [20 + (x + .5) / 160 * 320])
      expect(removed.length).toBeGreaterThan(0)
      for (const x of removed) expect(Math.abs(x - center)).toBeLessThanOrEqual(17 * pose.scale + 1)
    }
  })
})

describe('playable handcrafted sand levels', () => {
  for (const [index, item] of sandLevels.entries()) it(`${item.name}: exact color capacities and a successful replay`, () => {
    const game = new SandCollector(item)
    for (let color = 1; color < PALETTE.length; color++) {
      const capacity = item.columns.flat().filter(bucket => bucket.color === color).reduce((sum, bucket) => sum + bucket.capacity, 0)
      expect(capacity).toBe(game.colorLeft[color])
    }
    game.start()
    // Replay only legal front-row taps against the shipped queues, without editing them.
    const solution = solutions[index]!
    let next = 0
    for (let tick = 0; tick < 60000 && game.phase === 'playing'; tick++) {
      while (solution[next]?.tick === tick) {
        expect(game.send(solution[next]!.column)).toBe('sent')
        next++
      }
      game.step(); game.takeEvents()
      expect(game.buckets.length).toBeLessThanOrEqual(6)
      if (tick % 500 === 0) expect(game.total).toBe(sandCount(game) + game.collected)
    }
    expect(game.phase).toBe('won')
    expect(game.collected).toBe(game.total)
    expect(game.buckets).toHaveLength(0)
    expect(game.columns.every(column => !column.length)).toBe(true)
    expect(next).toBe(solution.length)
  })
  it('offers mixed queues and colors beyond the six available belt slots in challenge levels', () => {
    for (const item of sandLevels.filter(level => level.difficulty === 2)) {
      expect(new Set(item.sand).size - 1).toBeGreaterThan(6)
      expect(item.columns.every(column => new Set(column.map(bucket => bucket.color)).size > 1)).toBe(true)
      expect(new Set(item.columns.flat().map(bucket => bucket.capacity)).size).toBeGreaterThan(4)
    }
  })
  it('makes blindly filling slots fail in the eight-color challenge, despite its verified solution', () => {
    const game = new SandCollector(sandLevels[7]!)
    game.start()
    for (let tick = 0; tick < 20000 && game.phase === 'playing'; tick++) {
      if (tick % 15 === 0) for (let column = 0; column < 4; column++) game.send(column)
      game.step(); game.takeEvents()
    }
    expect(game.phase).toBe('lost')
    expect(game.collected).toBeLessThan(game.total)
  })
})
