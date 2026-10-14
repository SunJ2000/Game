import { bucketPose, PALETTE, SandCollector } from './engine'
import type { Bucket } from './engine'

interface Particle { x: number; y: number; bucketId: number; color: number; age: number }
export class SandRenderer {
  private context: CanvasRenderingContext2D
  private sandCanvas = document.createElement('canvas')
  private sandContext: CanvasRenderingContext2D
  private pixels: ImageData
  private revision = -1
  private particles: Particle[] = []
  private last = 0
  private pulses = new Map<number, number>()

  constructor(canvas: HTMLCanvasElement, readonly engine: SandCollector) {
    this.context = canvas.getContext('2d')!
    this.sandCanvas.width = engine.level.width; this.sandCanvas.height = engine.level.height
    this.sandContext = this.sandCanvas.getContext('2d')!
    this.pixels = this.sandContext.createImageData(engine.level.width, engine.level.height)
    canvas.width = 720; canvas.height = 800 // Capped backing size; never scales with devicePixelRatio.
  }

  private bucketPosition(bucket: Pick<Bucket, 'progress' | 'capacity'>) {
    // Only the left-to-right collection pass is visible. Return happens offscreen.
    const pose = bucketPose(bucket)
    return { ...pose, x: 20 + pose.x * 320, y: 350, mouthY: 350 - 19 * pose.scale }
  }

  private updatePixels() {
    if (this.revision === this.engine.revision) return
    const data = this.pixels.data, grid = this.engine.grid
    for (let i = 0; i < grid.length; i++) {
      const color = grid[i]!, rgb = PALETTE[color]!.rgb, offset = i * 4
      const shade = ((Math.imul(i ^ (i >>> 8), 0x45d9f3b) >>> 27) % 7 - 3) * 2
      data[offset] = rgb[0] + shade; data[offset + 1] = rgb[1] + shade; data[offset + 2] = rgb[2] + shade
      data[offset + 3] = color ? 255 : 0
    }
    this.sandContext.putImageData(this.pixels, 0, 0)
    this.revision = this.engine.revision
  }

  draw(time: number, animate = true, reducedMotion = false) {
    const dt = this.last && animate ? Math.min(50, time - this.last) / 1000 : 0
    this.last = time
    this.updatePixels()
    const ctx = this.context
    ctx.setTransform(2, 0, 0, 2, 0, 0)
    ctx.clearRect(0, 0, 360, 400)
    ctx.fillStyle = '#e9f1e5'; ctx.fillRect(0, 0, 360, 400)
    ctx.fillStyle = '#d9e6d4'; ctx.beginPath(); ctx.roundRect(14, 4, 332, 287, 18); ctx.fill()
    ctx.fillStyle = '#fffdf1'; ctx.beginPath(); ctx.roundRect(20, 10, 320, 275, 12); ctx.fill()
    ctx.save(); ctx.beginPath(); ctx.roundRect(20, 10, 320, 275, 12); ctx.clip()
    ctx.imageSmoothingEnabled = false; ctx.drawImage(this.sandCanvas, 20, 10, 320, 275)
    ctx.restore()
    // Single straight belt, with buckets clipped at its entry and exit.
    ctx.fillStyle = '#b3c6ad'; ctx.beginPath(); ctx.roundRect(14, 332, 332, 43, 9); ctx.fill()
    ctx.fillStyle = '#c7d7bd'; ctx.beginPath(); ctx.roundRect(17, 335, 326, 37, 7); ctx.fill()
    ctx.save(); ctx.beginPath(); ctx.roundRect(17, 335, 326, 37, 7); ctx.clip()
    ctx.strokeStyle = '#afc3a6'; ctx.lineWidth = 2
    const shift = this.engine.ticks % 16
    for (let x = -20; x < 390; x += 16) {
      ctx.beginPath(); ctx.moveTo(x + shift, 335); ctx.lineTo(x + shift - 12, 372); ctx.stroke()
    }
    ctx.restore()
    const events = this.engine.takeEvents()
    for (const event of events) {
      const bucket = this.engine.buckets.find(b => b.id === event.bucketId)
      if (event.type === 'collect' && bucket && bucketPose(bucket).visible && !reducedMotion) {
        for (let i = 0; i < Math.min(3, event.amount) && this.particles.length < 96; i++) {
          this.particles.push({ x: 20 + (event.x + .5) / this.engine.level.width * 320 + i * 2, y: 10 + (event.y + .5) / this.engine.level.height * 275, bucketId: bucket.id, color: event.color, age: -i * .02 })
        }
      } else if (event.type === 'merge') this.pulses.set(event.bucketId, .6)
    }
    ctx.save(); ctx.beginPath(); ctx.rect(20, 299, 320, 90); ctx.clip()
    for (const bucket of this.engine.buckets) {
      const point = this.bucketPosition(bucket)
      if (!point.visible) continue
      const pulse = this.pulses.get(bucket.id) ?? 0
      const size = point.scale
      ctx.save(); ctx.translate(point.x, point.y); ctx.scale(size, size)
      ctx.globalAlpha = Math.min(1, bucket.progress / .02, (.5 - bucket.progress) / .02)
      this.drawBucket(bucket.color, bucket.remaining, bucket.capacity, pulse)
      ctx.restore()
    }
    ctx.restore()
    for (const [id, age] of this.pulses) { if (age <= 0) this.pulses.delete(id); else this.pulses.set(id, age - dt) }
    // Never leave a stream behind a full, merged-away, or hidden bucket.
    this.particles = this.particles.filter(particle => {
      const bucket = this.engine.buckets.find(bucket => bucket.id === particle.bucketId)
      return bucket && bucketPose(bucket).visible && particle.age < .35
    })
    for (const particle of this.particles) {
      const bucket = this.engine.buckets.find(bucket => bucket.id === particle.bucketId)!
      const target = this.bucketPosition(bucket)
      particle.age += dt
      const progress = Math.max(0, Math.min(1, particle.age / .35)), eased = progress * progress
      ctx.fillStyle = PALETTE[particle.color]!.hex
      ctx.fillRect(particle.x + (target.x - particle.x) * eased - 1.5, particle.y + (target.mouthY - particle.y) * eased - 1.5, 3, 3)
    }
    this.particles = this.particles.filter(particle => particle.age < .35)
  }

  private drawBucket(color: number, remaining: number, capacity: number, pulse: number) {
    const ctx = this.context, paint = PALETTE[color]!
    if (pulse > 0) {
      ctx.strokeStyle = '#f6d77c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -8, 27 + (1 - pulse / .6) * 8, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.fillStyle = '#3f634528'; ctx.beginPath(); ctx.ellipse(0, 16, 23, 5, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = paint.hex; ctx.strokeStyle = '#fffdf1'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(-21, -19); ctx.lineTo(-15, 12); ctx.quadraticCurveTo(0, 24, 15, 12); ctx.lineTo(21, -19); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(0, -19, 21, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#29493d33'; ctx.beginPath(); ctx.ellipse(0, -19, 17, 5, 0, 0, Math.PI * 2); ctx.fill()
    if (remaining < capacity) {
      ctx.fillStyle = paint.hex; ctx.beginPath(); ctx.ellipse(0, -17, 8 + 9 * (1 - remaining / capacity), 4, 0, 0, Math.PI * 2); ctx.fill()
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText(paint.symbol, 0, -2)
    ctx.fillStyle = '#2c443c'; ctx.beginPath(); ctx.roundRect(-22, 2, 44, 17, 8); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText(String(remaining), 0, 14)
  }
}
