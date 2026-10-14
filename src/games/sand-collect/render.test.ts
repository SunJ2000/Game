import { afterEach, describe, expect, it, vi } from 'vitest'
import { bucketPose, SandCollector } from './engine'
import { SandRenderer } from './render'

function scene() {
  const fillRect = vi.fn<(x: number, y: number, width: number, height: number) => void>()
  const ctx = Object.fromEntries(['setTransform', 'clearRect', 'beginPath', 'roundRect', 'fill', 'save', 'restore', 'clip', 'drawImage', 'stroke', 'moveTo', 'lineTo', 'rect', 'translate', 'scale', 'arc', 'ellipse', 'quadraticCurveTo', 'closePath', 'fillText', 'putImageData'].map(name => [name, vi.fn()]))
  Object.assign(ctx, { fillRect, createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }) })
  const canvas = { getContext: () => ctx } as unknown as HTMLCanvasElement
  vi.stubGlobal('document', { createElement: () => canvas })
  const game = new SandCollector({ name: 'flow', hint: '', width: 160, height: 160, sand: new Uint8Array(25600).fill(1), columns: [[{ color: 1, capacity: 2400 }]] })
  game.start(); game.send(0)
  const renderer = new SandRenderer(canvas, game)
  const bucket = game.buckets[0]!
  game.events.push({ type: 'collect', color: 1, x: 32, y: 159, amount: 1, bucketId: bucket.id })
  return { game, bucket, renderer, fillRect }
}
afterEach(() => vi.unstubAllGlobals())

describe('sand stream alignment', () => {
  it('lands on the moving bucket mouth instead of its old position, also for a large bucket', () => {
    const { bucket, renderer, fillRect } = scene()
    bucket.progress = .2
    renderer.draw(1000)
    for (let frame = 1; frame <= 7; frame++) {
      bucket.progress = .2 + frame * .025
      fillRect.mockClear(); renderer.draw(1000 + frame * 50)
    }
    const grain = fillRect.mock.calls.find(call => call[2] === 3 && call[3] === 3)!
    expect(grain).toBeDefined()
    const pose = bucketPose(bucket)
    expect(grain[0] + 1.5).toBeCloseTo(20 + pose.x * 320)
    expect(grain[1] + 1.5).toBeCloseTo(350 - 19 * pose.scale)
  })
  it.each(['hidden', 'removed'] as const)('drops orphan sand when its bucket is %s', state => {
    const { bucket, game, renderer, fillRect } = scene()
    renderer.draw(1000)
    expect(fillRect.mock.calls.some(call => call[2] === 3 && call[3] === 3)).toBe(true)
    if (state === 'hidden') bucket.progress = .6
    else game.buckets = [] // Full buckets and merged-away buckets disappear immediately.
    fillRect.mockClear(); renderer.draw(1050)
    expect(fillRect.mock.calls.some(call => call[2] === 3 && call[3] === 3)).toBe(false)
  })
})
