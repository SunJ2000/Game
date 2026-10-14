import Matter from 'matter-js'
const { Engine, Bodies, Body, Composite, Events, Sleeping } = Matter
export const BIRD_WORLD = { width: 600, height: 500, ground: 436, anchor: { x: 98, y: 336 }, maxPull: 72, gravity: .75 }
export interface Vec { x: number; y: number }
export interface BlockSpec { x: number; y: number; width: number; height: number; material?: 'wood' | 'stone' }
export interface BirdLevel { name: string; birds: number; pigs: Vec[]; blocks: BlockSpec[] }
function tower(x: number, floor = 436, material: 'wood' | 'stone' = 'wood'): BlockSpec[] { return [{ x: x - 30, y: floor - 37, width: 12, height: 74, material }, { x: x + 30, y: floor - 37, width: 12, height: 74, material }, { x, y: floor - 80, width: 84, height: 12, material: 'wood' }] }
export const birdLevels: BirdLevel[] = [
  { name: '草地初试', birds: 4, pigs: [{ x: 375, y: 416 }, { x: 485, y: 416 }], blocks: tower(375) },
  { name: '木架行动', birds: 4, pigs: [{ x: 365, y: 416 }, { x: 470, y: 416 }, { x: 418, y: 328 }], blocks: [...tower(365), ...tower(470), { x: 418, y: 350, width: 148, height: 12 }] },
  { name: '双塔奇袭', birds: 4, pigs: [{ x: 345, y: 416 }, { x: 345, y: 328 }, { x: 485, y: 416 }, { x: 485, y: 328 }], blocks: [...tower(345), ...tower(485)] },
  { name: '石墙挑战', birds: 5, pigs: [{ x: 355, y: 416 }, { x: 470, y: 416 }, { x: 355, y: 328 }, { x: 470, y: 240 }], blocks: [...tower(355, 436, 'stone'), ...tower(470), ...tower(470, 350)] },
  { name: '终极堡垒', birds: 5, pigs: [{ x: 335, y: 416 }, { x: 335, y: 328 }, { x: 470, y: 416 }, { x: 470, y: 328 }, { x: 470, y: 240 }], blocks: [...tower(335), ...tower(470, 436, 'stone'), ...tower(470, 350), { x: 402, y: 348, width: 62, height: 12 }] },
]
export function clampPull(point: Vec): Vec {
  let dx = Math.min(0, point.x - BIRD_WORLD.anchor.x), dy = point.y - BIRD_WORLD.anchor.y
  const length = Math.hypot(dx, dy)
  if (length > BIRD_WORLD.maxPull) { dx *= BIRD_WORLD.maxPull / length; dy *= BIRD_WORLD.maxPull / length }
  return { x: BIRD_WORLD.anchor.x + dx, y: BIRD_WORLD.anchor.y + dy }
}
export function launchVelocity(pull: Vec): Vec { const point = clampPull(pull); return { x: (BIRD_WORLD.anchor.x - point.x) * .205, y: (BIRD_WORLD.anchor.y - point.y) * .205 } }
export function trajectory(pull: Vec): Vec[] { const v = launchVelocity(pull); return Array.from({ length: 18 }, (_, i) => { const t = (i + 1) * 1.5; return { x: BIRD_WORLD.anchor.x + v.x * t, y: BIRD_WORLD.anchor.y + v.y * t + BIRD_WORLD.gravity / 2 * t * t } }).filter(p => p.y < BIRD_WORLD.ground && p.x < BIRD_WORLD.width) }
interface Entity { body: Matter.Body; kind: 'bird' | 'pig' | 'block'; width: number; height: number; radius: number; material: 'wood' | 'stone'; hp: number }
export interface BirdBodyView { id: number; x: number; y: number; angle: number; kind: Entity['kind']; width: number; height: number; radius: number; material: Entity['material']; hp: number }
export interface Burst { id: number; x: number; y: number; text: string; life: number }
export interface BirdSnapshot { bodies: BirdBodyView[]; bursts: Burst[]; trail: Vec[]; score: number; left: number; pigs: number; phase: 'ready' | 'flying' | 'won' | 'lost' }
export class BirdsWorld {
  readonly engine = Engine.create({ enableSleeping: true })
  readonly entities = new Map<number, Entity>()
  score = 0
  left: number
  phase: BirdSnapshot['phase'] = 'ready'
  bursts: Burst[] = []
  trail: Vec[] = []
  private removed = new Set<number>()
  private fired = false
  private ticks = 0
  private quiet = 0
  private bird?: Matter.Body
  private serial = 0
  constructor(readonly level: BirdLevel) {
    this.left = level.birds
    this.engine.gravity.y = BIRD_WORLD.gravity
    // Matter uses milliseconds squared; make gravity match the 60 Hz preview.
    this.engine.gravity.scale = .0036
    const ground = Bodies.rectangle(300, 466, 1600, 60, { isStatic: true, friction: .85, label: 'ground' })
    Composite.add(this.engine.world, ground)
    for (const block of level.blocks) {
      const material = block.material || 'wood'
      const body = Bodies.rectangle(block.x, block.y, block.width, block.height, { density: material === 'stone' ? .0025 : .001, friction: .75, restitution: .05, frictionAir: .006 })
      this.add({ body, kind: 'block', width: block.width, height: block.height, radius: 0, material, hp: material === 'stone' ? 12 : 5 })
    }
    for (const pig of level.pigs) this.add({ body: Bodies.circle(pig.x, pig.y, 18, { density: .0015, friction: .8, restitution: .04, frictionAir: .015 }), kind: 'pig', width: 36, height: 36, radius: 18, material: 'wood', hp: 1 })
    // Settle the initial structures before enabling collision damage.
    for (let i = 0; i < 120; i++) Engine.update(this.engine, 1000 / 60)
    Events.on(this.engine, 'collisionStart', event => {
      if (!this.fired || this.phase === 'won' || this.phase === 'lost') return
      for (const pair of event.pairs) {
        const a = pair.bodyA, b = pair.bodyB
        const impact = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y)
        for (const [body, other] of [[a, b], [b, a]]) {
          const entity = this.entities.get(body!.id)
          if (!entity || entity.kind === 'bird') continue
          if (entity.kind === 'pig' && impact > (other === this.bird ? 1.1 : 1.8)) this.removed.add(body!.id)
          if (entity.kind === 'block' && impact > 2.8) { entity.hp -= impact * (other === this.bird ? 1.25 : .65); if (entity.hp <= 0) this.removed.add(body!.id) }
        }
      }
    })
  }
  private add(entity: Entity) { this.entities.set(entity.body.id, entity); Composite.add(this.engine.world, entity.body) }
  launch(point: Vec) {
    if (this.phase !== 'ready' || this.left <= 0) return false
    const pull = clampPull(point)
    if (Math.hypot(pull.x - BIRD_WORLD.anchor.x, pull.y - BIRD_WORLD.anchor.y) < 8) return false
    if (this.bird) { Composite.remove(this.engine.world, this.bird); this.entities.delete(this.bird.id) }
    this.bird = Bodies.circle(BIRD_WORLD.anchor.x, BIRD_WORLD.anchor.y, 19, { density: .008, friction: .65, frictionAir: .002, restitution: .35 })
    this.add({ body: this.bird, kind: 'bird', width: 38, height: 38, radius: 19, material: 'wood', hp: 1 })
    Body.setVelocity(this.bird, launchVelocity(pull))
    this.left--; this.fired = true; this.ticks = 0; this.quiet = 0; this.trail = []; this.phase = 'flying'
    return true
  }
  step() {
    if (this.phase !== 'flying') { this.bursts = this.bursts.filter(b => --b.life > 0); return }
    Engine.update(this.engine, 1000 / 60); this.ticks++
    if (this.bird && this.ticks % 3 === 0 && this.bird.position.y < BIRD_WORLD.ground) { this.trail.push({ ...this.bird.position }); if (this.trail.length > 36) this.trail.shift() }
    for (const [id, entity] of this.entities) if (entity.body.position.y > BIRD_WORLD.height + 50 || entity.body.position.x > BIRD_WORLD.width + 80 || entity.body.position.x < -100) this.removed.add(id)
    let structureChanged = false
    for (const id of this.removed) {
      const entity = this.entities.get(id)
      if (!entity) continue
      const points = entity.kind === 'pig' ? 300 : entity.kind === 'block' ? 60 : 0
      this.score += points
      if (points) this.bursts.push({ id: ++this.serial, x: entity.body.position.x, y: entity.body.position.y, text: `+${points}`, life: 48 })
      Composite.remove(this.engine.world, entity.body); this.entities.delete(id)
      if (entity.kind !== 'bird') structureChanged = true
    }
    // Removing a support must wake the stack above it so gravity can topple it.
    if (structureChanged) for (const entity of this.entities.values()) Sleeping.set(entity.body, false)
    this.removed.clear(); this.bursts = this.bursts.filter(b => --b.life > 0)
    const pigs = [...this.entities.values()].filter(e => e.kind === 'pig').length
    if (!pigs) { this.phase = 'won'; this.score += this.left * 150; return }
    const still = [...this.entities.values()].every(e => e.body.isSleeping || e.body.speed < .35)
    this.quiet = still ? this.quiet + 1 : 0
    if ((this.ticks > 75 && this.quiet >= 28) || this.ticks >= 480) this.phase = this.left ? 'ready' : 'lost'
  }
  snapshot(): BirdSnapshot {
    return { score: this.score, left: this.left, phase: this.phase, pigs: [...this.entities.values()].filter(e => e.kind === 'pig').length, bursts: this.bursts.map(b => ({ ...b })), trail: [...this.trail], bodies: [...this.entities.values()].map(e => ({ id: e.body.id, x: e.body.position.x, y: e.body.position.y, angle: e.body.angle * 180 / Math.PI, kind: e.kind, width: e.width, height: e.height, radius: e.radius, material: e.material, hp: e.hp })) }
  }
  dispose() { Events.off(this.engine, 'collisionStart'); Composite.clear(this.engine.world, false); Engine.clear(this.engine); this.entities.clear() }
}
