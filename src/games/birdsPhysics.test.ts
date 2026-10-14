import { describe, expect, it } from 'vitest'
import { BIRD_WORLD, BirdsWorld, birdLevels, clampPull, launchVelocity, trajectory } from './birdsPhysics'
describe('slingshot physics', () => {
  it('limits pull distance and launches opposite to the drag', () => { const pull = clampPull({ x: -500, y: 1000 }); expect(Math.hypot(pull.x - BIRD_WORLD.anchor.x, pull.y - BIRD_WORLD.anchor.y)).toBeCloseTo(72); const v = launchVelocity(pull); expect(v.x).toBeGreaterThan(0); expect(v.y).toBeLessThan(0); expect(clampPull({ x: 250, y: 336 }).x).toBe(BIRD_WORLD.anchor.x) })
  it('shows a gravity-curved trajectory within the playable area', () => { const points = trajectory({ x: 32, y: 360 }); expect(points.length).toBeGreaterThan(8); expect(points[0]!.x).toBeGreaterThan(32); expect(points.every(p => p.y < BIRD_WORLD.ground && p.x < BIRD_WORLD.width)).toBe(true); expect(points.at(-1)!.y).toBeGreaterThan(Math.min(...points.map(p => p.y))) })
  it.each([{ x: 32, y: 360 }, { x: 48, y: 308 }, { x: 26, y: 336 }])('starts at the held position and follows every preview point before collision for %j', pull => {
    const world = new BirdsWorld({ name: 'trajectory', birds: 1, blocks: [], pigs: [{ x: 580, y: 416 }] })
    const predicted = trajectory(pull)
    world.launch(pull)
    const start = world.snapshot().bodies.find(body => body.kind === 'bird')!
    expect(start.x).toBeCloseTo(clampPull(pull).x)
    expect(start.y).toBeCloseTo(clampPull(pull).y)
    for (const point of predicted) {
      world.step(); world.step()
      const bird = world.snapshot().bodies.find(body => body.kind === 'bird')!
      expect(bird.x).toBeCloseTo(point.x, 6)
      expect(bird.y).toBeCloseTo(point.y, 6)
    }
    world.dispose()
  })
  it('settles all five layouts without removing targets or granting points', () => { for (const level of birdLevels) { const world = new BirdsWorld(level); const initial = world.snapshot(); expect(initial.pigs).toBe(level.pigs.length); expect(initial.score).toBe(0); expect(initial.bodies.every(b => Number.isFinite(b.x) && Number.isFinite(b.y) && b.y < BIRD_WORLD.ground)).toBe(true); world.dispose() } })
  it('ignores clicks and repeated releases, consumes one bird for a real launch', () => { const world = new BirdsWorld(birdLevels[0]!); expect(world.launch(BIRD_WORLD.anchor)).toBe(false); expect(world.left).toBe(4); expect(world.launch({ x: 32, y: 360 })).toBe(true); expect(world.launch({ x: 32, y: 360 })).toBe(false); expect(world.left).toBe(3); world.dispose() })
  it('collides with destructible structures and ends a flight in bounded time', () => { const world = new BirdsWorld(birdLevels[0]!); world.launch({ x: 32, y: 360 }); for (let i = 0; i < 480; i++) world.step(); const result = world.snapshot(); expect(result.phase).not.toBe('flying'); expect(result.score).toBeGreaterThan(0); expect(result.bodies.every(b => Number.isFinite(b.x) && Number.isFinite(b.y))).toBe(true); world.dispose() })
  it('awards the last target once and gives remaining-bird bonus on victory', () => { const level = { name: 'test', birds: 3, blocks: [], pigs: [{ x: 340, y: 416 }] }; const world = new BirdsWorld(level); world.launch({ x: 35, y: 340 }); for (let i = 0; i < 480; i++) world.step(); expect(world.phase).toBe('won'); expect(world.score).toBe(600); const score = world.score; world.step(); expect(world.score).toBe(score); world.dispose() })
  it('keeps all five levels winnable, including stacks whose supports are destroyed', () => {
    const shots = [[72, -.3], [56, -.3], [72, .34], [56, .74], [72, .02]]
    birdLevels.forEach((level, index) => {
      const [strength, angle] = shots[index]!
      const world = new BirdsWorld(level)
      world.launch({ x: 98 - Math.cos(angle!) * strength!, y: 336 + Math.sin(angle!) * strength! })
      for (let frame = 0; frame < 480; frame++) world.step()
      expect(world.snapshot().pigs, level.name).toBe(0)
      expect(world.phase, level.name).toBe('won')
      world.dispose()
    })
  })
  it('ends the challenge when the final bird misses and prevents extra shots', () => {
    const world = new BirdsWorld({ name: 'miss', birds: 1, blocks: [], pigs: [{ x: 570, y: 416 }] })
    world.launch({ x: 98, y: 408 })
    for (let frame = 0; frame < 480; frame++) world.step()
    expect(world.phase).toBe('lost'); expect(world.left).toBe(0); expect(world.snapshot().pigs).toBe(1)
    expect(world.launch({ x: 32, y: 360 })).toBe(false)
    world.dispose()
  })
})
