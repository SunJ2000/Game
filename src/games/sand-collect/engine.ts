export interface BucketSpec { color: number; capacity: number }
export interface Bucket extends BucketSpec { id: number; remaining: number; slot: number; progress: number }
export interface SandLevel {
  name: string; hint: string; width: number; height: number
  sand: Uint8Array; columns: BucketSpec[][]; depth?: number; seed?: number
  difficulty?: number
}
export type Phase = 'ready' | 'playing' | 'won' | 'lost'
export interface SandEvent { type: 'collect' | 'merge' | 'complete'; color: number; x: number; y: number; bucketId: number; amount: number; progress?: number }
/** Shared pose for collection and drawing; x is a fraction of the sand container width. */
export function bucketPose(bucket: Pick<Bucket, 'progress' | 'capacity'>) {
  return { x: bucket.progress * 2, visible: bucket.progress < .5, scale: bucket.capacity > 800 ? 1.09 : 1 }
}
export const PALETTE = [
  { name: '空', hex: '#000000', rgb: [0, 0, 0], symbol: '' },
  { name: '薄荷', hex: '#63b998', rgb: [99, 185, 152], symbol: '●' },
  { name: '奶油', hex: '#f2c866', rgb: [242, 200, 102], symbol: '✦' },
  { name: '莓果', hex: '#e58c9f', rgb: [229, 140, 159], symbol: '♥' },
  { name: '天空', hex: '#79b8dd', rgb: [121, 184, 221], symbol: '◆' },
  { name: '葡萄', hex: '#a18ade', rgb: [161, 138, 222], symbol: '★' },
  { name: '蜜橘', hex: '#f19a59', rgb: [241, 154, 89], symbol: '▲' },
  { name: '雪白', hex: '#eee9d9', rgb: [238, 233, 217], symbol: '✿' },
  { name: '墨蓝', hex: '#486080', rgb: [72, 96, 128], symbol: '■' },
] as const

/** All sand lives in typed arrays. Stable rows sleep; removals and moves wake neighbors. */
export class SandCollector {
  readonly grid: Uint8Array
  readonly columns: BucketSpec[][]
  readonly bottom: Int16Array
  readonly total: number
  readonly colorLeft = new Int32Array(PALETTE.length)
  readonly activeRows: Uint8Array
  readonly dirtyColumns: Uint8Array
  buckets: Bucket[] = []
  phase: Phase = 'ready'
  collected = 0
  merges = 0
  completed = 0
  ticks = 0
  revision = 0
  lastVisited = 0
  events: SandEvent[] = []
  private nextId = 1
  private randomState: number
  private idleTicks = 0
  private samplingTurn = 0
  readonly depth: number
  readonly beltLimit = 6
  readonly loopTicks = 180 // 3-second visible pass and 3-second hidden return at 30 Hz.

  constructor(readonly level: SandLevel) {
    this.grid = level.sand.slice()
    this.columns = level.columns.map(column => column.map(bucket => ({ ...bucket })))
    this.depth = level.depth ?? 6
    this.bottom = new Int16Array(level.width); this.bottom.fill(-1)
    this.activeRows = new Uint8Array(level.height)
    this.dirtyColumns = new Uint8Array(level.width); this.dirtyColumns.fill(1)
    this.randomState = (level.seed ?? 73) >>> 0 || 73
    let total = 0
    for (const color of this.grid) if (color) { total++; this.colorLeft[color]++ }
    this.total = total
    this.refreshBottom()
  }

  private random() {
    let n = this.randomState
    n ^= n << 13; n ^= n >>> 17; n ^= n << 5
    this.randomState = n >>> 0
    return this.randomState / 4294967296
  }

  start() { if (this.phase === 'ready') this.phase = this.total ? 'playing' : 'won' }

  send(column: number): 'sent' | 'full' | 'unavailable' {
    if (this.phase !== 'playing' || !this.columns[column]?.length) return 'unavailable'
    if (this.buckets.length >= this.beltLimit) return 'full'
    const spec = this.columns[column]!.shift()!
    const occupied = new Set(this.buckets.map(bucket => bucket.slot))
    let slot = 0
    while (occupied.has(slot)) slot++
    // Start each bucket's own trip at the visible entry, regardless of global time or slot.
    const entry = .035
    let ahead = entry + .078
    for (const bucket of this.buckets.filter(bucket => bucket.progress < .5).sort((a, b) => a.progress - b.progress)) {
      if (bucket.progress >= ahead) break
      bucket.progress = ahead; ahead += .078
    }
    this.buckets.push({ ...spec, id: this.nextId++, remaining: spec.capacity, slot, progress: entry })
    this.mergeBuckets()
    this.idleTicks = 0
    return 'sent'
  }

  private mergeBuckets() {
    for (let color = 1; color < PALETTE.length; color++) {
      let same = this.buckets.filter(bucket => bucket.color === color && bucket.remaining > 0)
      while (same.length >= 3) {
        const group = same.slice(0, 3), keep = group[0]!
        // A merge triggered by a tap must also have a visible result.
        if (!bucketPose(keep).visible) keep.progress = group.find(bucket => bucketPose(bucket).visible)!.progress
        keep.capacity = group.reduce((sum, bucket) => sum + bucket.capacity, 0)
        keep.remaining = group.reduce((sum, bucket) => sum + bucket.remaining, 0)
        const removed = new Set(group.slice(1).map(bucket => bucket.id))
        this.buckets = this.buckets.filter(bucket => !removed.has(bucket.id))
        this.merges++
        this.pushEvent({ type: 'merge', color, x: 0, y: 0, bucketId: keep.id, amount: keep.capacity })
        same = this.buckets.filter(bucket => bucket.color === color && bucket.remaining > 0)
      }
    }
  }

  private pushEvent(event: SandEvent) { if (this.events.length < 64) this.events.push(event) }
  takeEvents() { const events = this.events; this.events = []; return events }

  private wake(x: number, y: number) {
    const { width, height } = this.level
    for (let row = Math.max(0, y - 1); row <= Math.min(height - 1, y + 1); row++) this.activeRows[row] = 1
    this.dirtyColumns[x] = 1
    if (x > 0) this.dirtyColumns[x - 1] = 1
    if (x + 1 < width) this.dirtyColumns[x + 1] = 1
  }

  private refreshBottom() {
    const { width, height } = this.level
    for (let x = 0; x < width; x++) if (this.dirtyColumns[x]) {
      let y = height - 1
      while (y >= 0 && !this.grid[y * width + x]) y--
      this.bottom[x] = y
      this.dirtyColumns[x] = 0
    }
  }

  private gravity() {
    const { width, height } = this.level
    let moves = 0; this.lastVisited = 0
    const reverse = this.ticks % 2 === 0
    for (let y = height - 2; y >= 0; y--) {
      if (!this.activeRows[y]) continue
      this.activeRows[y] = 0
      for (let n = 0; n < width; n++) {
        this.lastVisited++
        const x = reverse ? width - 1 - n : n, i = y * width + x, color = this.grid[i]!
        if (!color) continue
        const down = i + width
        let target = -1, targetX = x
        if (!this.grid[down]) target = down
        else {
          const dx = this.random() < .5 ? -1 : 1
          if (x + dx >= 0 && x + dx < width && !this.grid[down + dx]) { target = down + dx; targetX = x + dx }
          else if (x - dx >= 0 && x - dx < width && !this.grid[down - dx]) { target = down - dx; targetX = x - dx }
        }
        if (target >= 0) {
          this.grid[target] = color; this.grid[i] = 0
          this.wake(x, y); this.wake(targetX, y + 1); moves++
        }
      }
    }
    // Bottom row never falls, so it does not need to stay awake.
    this.activeRows[height - 1] = 0
    return moves
  }

  private collect() {
    const { width } = this.level
    let count = 0
    if (!this.buckets.length) return count
    // Cached bottom remains unchanged during this step: no repeated depth expansion.
    const length = this.buckets.length
    for (let n = 0; n < length; n++) {
      const bucket = this.buckets[(n + this.samplingTurn) % length]!
      const pose = bucketPose(bucket)
      if (!pose.visible) continue // Hidden returning buckets stay occupied and cannot collect.
      // Image pixels are positioned by their centers, exactly as in the renderer.
      const center = Math.round(pose.x * width - .5)
      const radius = Math.floor(width * 17 * pose.scale / 320)
      let budget = 16, gathered = 0, sumX = 0, sumY = 0
      for (let offset = 0; offset < this.depth && budget && bucket.remaining; offset++) {
        for (let dx = 0; dx <= radius * 2 && budget && bucket.remaining; dx++) {
          const x = center - radius + (this.ticks % 2 ? radius * 2 - dx : dx)
          if (x < 0 || x >= width) continue
          const y = this.bottom[x]! - offset
          if (y < 0) continue
          const i = y * width + x
          if (this.grid[i] !== bucket.color) continue
          this.grid[i] = 0; bucket.remaining--; this.colorLeft[bucket.color]--
          count++; gathered++; budget--; sumX += x; sumY += y
          this.wake(x, y)
        }
      }
      if (gathered) this.pushEvent({ type: 'collect', color: bucket.color, x: sumX / gathered, y: sumY / gathered, bucketId: bucket.id, amount: gathered, progress: bucket.progress })
    }
    this.samplingTurn = (this.samplingTurn + 1) % Math.max(1, length)
    for (const bucket of this.buckets) if (!bucket.remaining) {
      this.completed++
      this.pushEvent({ type: 'complete', color: bucket.color, x: 0, y: 0, bucketId: bucket.id, amount: bucket.capacity })
    }
    // Completion releases a slot in this same simulation step.
    this.buckets = this.buckets.filter(bucket => bucket.remaining > 0)
    this.collected += count
    return count
  }

  private canEverCollect() {
    const colors = new Set(this.buckets.map(bucket => bucket.color))
    for (let x = 0; x < this.level.width; x++) for (let offset = 0; offset < this.depth; offset++) {
      const y = this.bottom[x]! - offset
      if (y >= 0 && colors.has(this.grid[y * this.level.width + x]!)) return true
    }
    return false
  }

  step() {
    if (this.phase !== 'playing') return
    this.ticks++
    for (const bucket of this.buckets) {
      const progress = bucket.progress + 1 / this.loopTicks
      // Keep boundary crossings stable despite floating-point accumulation.
      bucket.progress = progress >= 1 - 1e-10 ? Math.max(0, progress - 1) : Math.abs(progress - .5) < 1e-10 ? .5 : progress
    }
    const gathered = this.collect()
    const moves = this.gravity()
    if (gathered || moves) { this.revision++; this.idleTicks = 0 }
    else this.idleTicks++
    this.refreshBottom()
    if (this.collected === this.total) this.phase = 'won'
    else if (this.idleTicks >= 15 && !this.canEverCollect()) {
      const hasQueue = this.columns.some(column => column.length)
      if (this.buckets.length >= this.beltLimit || !hasQueue) this.phase = 'lost'
    }
  }
}
