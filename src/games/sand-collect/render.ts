import { bucketPose, SandCollector } from './engine'
import type { Bucket } from './engine'
import { BUCKET_ART } from './bucket-art'
import type { ThemeId } from '../../theme'
import { sandPaint } from './colors'

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
  private bucketBody = new Path2D(BUCKET_ART.body)
  private bucketHighlight = new Path2D(BUCKET_ART.highlight)
  private bucketHandle = new Path2D(BUCKET_ART.handle)
  private paint = sandPaint('soft')

  constructor(canvas: HTMLCanvasElement, readonly engine: SandCollector, theme: ThemeId = 'soft') {
    this.setTheme(theme)
    this.context = canvas.getContext('2d')!
    this.sandCanvas.width = engine.level.width; this.sandCanvas.height = engine.level.height
    this.sandContext = this.sandCanvas.getContext('2d')!
    this.pixels = this.sandContext.createImageData(engine.level.width, engine.level.height)
    canvas.width = 720; canvas.height = 800 // Capped backing size; never scales with devicePixelRatio.
  }

  setTheme(theme: ThemeId) {
    this.paint = sandPaint(theme)
    this.revision = -1 // Recolour even when the paused sand grid has not moved.
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
      const color = grid[i]!, rgb = this.paint.palette[color]!.rgb, offset = i * 4
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
    ctx.fillStyle = this.paint.scene; ctx.fillRect(0, 0, 360, 400)
    ctx.fillStyle = this.paint.frame; ctx.beginPath(); ctx.roundRect(14, 4, 332, 287, 18); ctx.fill()
    ctx.fillStyle = this.paint.paper; ctx.beginPath(); ctx.roundRect(20, 10, 320, 275, 12); ctx.fill()
    ctx.save(); ctx.beginPath(); ctx.roundRect(20, 10, 320, 275, 12); ctx.clip()
    ctx.imageSmoothingEnabled = false; ctx.drawImage(this.sandCanvas, 20, 10, 320, 275)
    ctx.restore()
    // Single straight belt, with buckets clipped at its entry and exit.
    ctx.fillStyle = this.paint.beltEdge; ctx.beginPath(); ctx.roundRect(14, 332, 332, 43, 9); ctx.fill()
    ctx.fillStyle = this.paint.belt; ctx.beginPath(); ctx.roundRect(17, 335, 326, 37, 7); ctx.fill()
    ctx.save(); ctx.beginPath(); ctx.roundRect(17, 335, 326, 37, 7); ctx.clip()
    ctx.strokeStyle = this.paint.beltLine; ctx.lineWidth = 2
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
      ctx.fillStyle = this.paint.palette[particle.color]!.hex
      ctx.fillRect(particle.x + (target.x - particle.x) * eased - 1.5, particle.y + (target.mouthY - particle.y) * eased - 1.5, 3, 3)
    }
    this.particles = this.particles.filter(particle => particle.age < .35)
  }

  private drawBucket(color: number, remaining: number, capacity: number, pulse: number) {
    const ctx = this.context, paint = this.paint.palette[color]!
    if (pulse > 0) {
      ctx.strokeStyle = '#f6d77c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -8, 27 + (1 - pulse / .6) * 8, 0, Math.PI * 2); ctx.stroke()
    }
    // Same 80×82 artwork as the queue. Keep the mouth anchored at (0, -19).
    ctx.save(); ctx.translate(0, -19); ctx.scale(.84, .84); ctx.translate(-40, -25)
    ctx.fillStyle = '#4967471a'; ctx.beginPath(); ctx.ellipse(40, 76, 26, 5, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = paint.hex; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
    ctx.fill(this.bucketBody); ctx.stroke(this.bucketBody)
    ctx.fillStyle = '#ffffff2e'; ctx.fill(this.bucketHighlight)
    ctx.strokeStyle = '#46695080'; ctx.lineWidth = 3; ctx.stroke(this.bucketHandle)
    ctx.fillStyle = paint.hex; ctx.strokeStyle = '#ffffff'
    ctx.beginPath(); ctx.ellipse(40, 25, 25, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#243b3838'; ctx.beginPath(); ctx.ellipse(40, 25, 21, 7, 0, 0, Math.PI * 2); ctx.fill()
    if (remaining < capacity) {
      ctx.fillStyle = paint.hex; ctx.beginPath(); ctx.ellipse(40, 27, 10 + 10 * (1 - remaining / capacity), 5, 0, 0, Math.PI * 2); ctx.fill()
    }
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffffe6'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(paint.symbol, 40, 51)
    ctx.fillStyle = '#273f39e0'; ctx.beginPath(); ctx.roundRect(17, 55, 46, 21, 10); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Outfit, sans-serif'; ctx.fillText(String(remaining), 40, 70)
    ctx.restore()
  }
}
