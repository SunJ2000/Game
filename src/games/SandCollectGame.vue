<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { ArrowLeft, Pause, Play, RotateCcw, HelpCircle, ChevronRight, Lock, Sparkles, Check, X } from 'lucide-vue-next'
import SandBucket from '../components/SandBucket.vue'
import { PALETTE, SandCollector } from './sand-collect/engine'
import { sandLevels } from './sand-collect/levels'
import { SandRenderer } from './sand-collect/render'
import { recordScore } from '../store'

const emit = defineEmits<{ back: [] }>()
const canvas = ref<HTMLCanvasElement>()
const levelIndex = ref(0), paused = ref(false), sheet = ref<'help' | 'restart' | 'levels' | null>(null)
const message = ref(sandLevels[0]!.hint)
const version = ref(0)
let engine = new SandCollector(sandLevels[0]!), renderer: SandRenderer | undefined
const view = shallowRef(snapshot())
let frame = 0, last = 0, accumulator = 0, previousMerges = 0
let messageTicks = 0, lastScore = 0
let needsDraw = true
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const level = computed(() => sandLevels[levelIndex.value]!)
const percent = computed(() => Math.round(view.value.collected / Math.max(1, view.value.total) * 100))
const blocked = computed(() => view.value.phase !== 'playing' || paused.value || sheet.value !== null)
const displayedColumns = computed(() => { void version.value; return engine.columns.map(column => column.slice(0, 3)) })
const hasMoreBuckets = computed(() => { void version.value; return engine.columns.some(column => column.length > 3) })
const modal = ref<HTMLDivElement>()
let returnFocus: HTMLElement | null = null

function snapshot() { return { phase: engine.phase, collected: engine.collected, total: engine.total, merges: engine.merges, completed: engine.completed, buckets: engine.buckets.map(b => ({ ...b })) } }
function refresh() { view.value = snapshot(); needsDraw = true }
function flash(text: string) { message.value = text; messageTicks = 100 }
function choose(column: number) {
  if (blocked.value) return
  const result = engine.send(column)
  if (result === 'full') flash('传送带已满，等桶装满或合成后再放')
  else if (result === 'sent') {
    version.value++
    flash(engine.merges > previousMerges ? '三个同色桶合成啦！腾出了两个位置' : '桶子出发！只会收集底部附近的同色沙子')
    previousMerges = engine.merges
  }
  refresh()
}
function start() { engine.start(); flash(level.value.hint); refresh(); resetClock() }
function resetClock() { last = 0; accumulator = 0 }
function togglePause() { if (engine.phase !== 'playing') return; paused.value = !paused.value; resetClock(); refresh() }
function load(index: number) {
  if (index < 0 || index >= sandLevels.length) return
  levelIndex.value = index; engine = new SandCollector(sandLevels[index]!); renderer = new SandRenderer(canvas.value!, engine)
  version.value++
  previousMerges = 0; lastScore = 0; messageTicks = 0
  paused.value = false; closeSheet(); resetClock(); message.value = level.value.hint; refresh(); renderer.draw(performance.now())
}
function openSheet(kind: 'help' | 'restart' | 'levels') {
  returnFocus = document.activeElement as HTMLElement
  sheet.value = kind; resetClock()
  requestAnimationFrame(() => modal.value?.focus())
}
function closeSheet() { sheet.value = null; resetClock(); returnFocus?.focus(); returnFocus = null }
function hidden() { if (document.hidden && engine.phase === 'playing') { paused.value = true; resetClock() } }
function blur() { if (engine.phase === 'playing') { paused.value = true; resetClock() } }
function keyboard(event: KeyboardEvent) {
  if (event.key === 'Escape') { if (sheet.value) closeSheet(); else togglePause(); return }
  if (event.key === 'Tab' && sheet.value && modal.value) {
    const buttons = [...modal.value.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const first = buttons[0], end = buttons.at(-1)
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal.value)) { event.preventDefault(); end?.focus() }
    else if (!event.shiftKey && document.activeElement === end) { event.preventDefault(); first?.focus() }
  }
}
function loop(time: number) {
  if (!blocked.value) {
    if (last) accumulator += Math.min(100, time - last)
    while (accumulator >= 1000 / 30) {
      engine.step(); accumulator -= 1000 / 30
      if (messageTicks > 0) messageTicks--
      if (!messageTicks) message.value = engine.buckets.length === 6 ? '六个位置都用上了，等等沙子流下来' : level.value.hint
      const score = engine.collected + engine.merges * 100
      if (score >= lastScore + 400 || engine.phase === 'won') { recordScore('sand', score); lastScore = score }
      refresh()
      if (engine.phase !== 'playing') { accumulator = 0; break }
    }
  }
  last = time
  if (!document.hidden && (needsDraw || (!blocked.value && engine.phase === 'playing'))) {
    renderer?.draw(time, !paused.value && !sheet.value, reducedMotion.matches)
    needsDraw = false
  }
  frame = requestAnimationFrame(loop)
}
onMounted(() => {
  document.body.classList.add('sand-playing')
  renderer = new SandRenderer(canvas.value!, engine); renderer.draw(performance.now())
  frame = requestAnimationFrame(loop)
  document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', blur); window.addEventListener('keydown', keyboard)
})
onUnmounted(() => {
  cancelAnimationFrame(frame); document.body.classList.remove('sand-playing')
  document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', blur); window.removeEventListener('keydown', keyboard)
})
</script>

<template>
  <div class="sand-shell">
    <header class="sand-header">
      <button class="sand-icon-button" aria-label="返回游乐场" @click="emit('back')"><ArrowLeft :size="21" /></button>
      <button class="sand-level-select" aria-label="选择沙画关卡" @click="openSheet('levels')"><small>沙画消消</small><strong>第 {{ levelIndex + 1 }} 关 · {{ level.name }}<ChevronRight :size="14" /></strong></button>
      <button class="sand-icon-button" aria-label="玩法说明" @click="openSheet('help')"><HelpCircle :size="21" /></button>
      <button class="sand-icon-button" :aria-label="paused ? '继续游戏' : '暂停游戏'" :disabled="view.phase !== 'playing'" @click="togglePause"><Play v-if="paused" :size="20" /><Pause v-else :size="20" /></button>
    </header>
    <div class="sand-progress"><div><span>把小快乐装进桶里</span><strong>{{ percent }}<small>%</small></strong></div><div class="sand-progress-track" role="progressbar" aria-label="沙画收集进度" :aria-valuenow="percent" :aria-valuemin="0" :aria-valuemax="100"><i :style="{ width: `${percent}%` }" /></div></div>
    <div class="sand-scene">
      <canvas ref="canvas" aria-label="沙画和横向传送带，桶从左向右收集同色沙子" />
      <ul class="sand-screen-reader" aria-label="传送带上的桶子"><li v-for="bucket in view.buckets" :key="bucket.id">{{ PALETTE[bucket.color]?.name }}桶：剩余容量 {{ bucket.remaining }}，总容量 {{ bucket.capacity }}</li></ul>
      <div v-if="view.phase !== 'playing' || paused" class="sand-scene-overlay">
        <div class="sand-start-card" :class="{ 'sand-finish-card': ['won', 'lost'].includes(view.phase) }">
          <span class="sand-card-spark"><Sparkles v-if="view.phase !== 'lost'" :size="30" /><RotateCcw v-else :size="28" /></span>
          <h2>{{ view.phase === 'won' ? '小快乐，收集完成！' : view.phase === 'lost' ? '桶子有点堵住啦' : paused ? '歇一会儿，沙子等你' : '一桶一桶，装走烦恼' }}</h2>
          <p v-if="view.phase === 'ready'">点前排桶收集同色沙子<br />三个同色桶合成大桶，腾出位置</p>
          <p v-else-if="view.phase === 'won'">收集 {{ view.collected.toLocaleString() }} 颗沙子<br />完成 {{ view.completed }} 桶 · 合成 {{ view.merges }} 次</p>
          <p v-else-if="view.phase === 'lost'">{{ view.buckets.length >= 6 ? '六个位置已满，桶子收不到需要的颜色' : '桶子已经用完，剩下的颜色收不到了' }}<br />再试试，给底部的颜色留个桶</p>
          <p v-else>当前进度 {{ percent }}%，回来就能继续</p>
          <button v-if="view.phase === 'ready'" class="sand-primary" @click="start">开始收集 <Play :size="16" /></button>
          <button v-else-if="paused && view.phase === 'playing'" class="sand-primary" @click="togglePause">继续收集 <Play :size="16" /></button>
          <button v-else-if="view.phase === 'won' && levelIndex < sandLevels.length - 1" class="sand-primary" @click="load(levelIndex + 1); start()">下一幅沙画 <ChevronRight :size="17" /></button>
          <button v-else class="sand-primary" @click="load(levelIndex); start()">{{ view.phase === 'won' ? '再收集一次' : '重新试试' }} <RotateCcw :size="16" /></button>
        </div>
      </div>
    </div>
    <div class="sand-belt-status"><span><i :class="{ full: view.buckets.length === 6 }" />传送带 <strong>{{ view.buckets.length }}/6</strong></span><div class="sand-slots" aria-label="传送带占位"><span v-for="n in 6" :key="n" :style="{ background: view.buckets[n - 1] ? PALETTE[view.buckets[n - 1]!.color]?.hex : undefined }">{{ view.buckets[n - 1] ? PALETTE[view.buckets[n - 1]!.color]?.symbol : '·' }}</span></div><span class="sand-merge-label">3 同色 → 1 大桶</span></div>
    <p class="sand-tip" role="status">{{ message }}</p>
    <section class="sand-tray" aria-label="待选沙桶，只有每列第一排可以选择">
      <div class="sand-tray-heading"><strong>选个桶，出发吧</strong><span>只可选第一排 ↓</span></div>
      <div class="sand-queue-grid">
        <div v-for="(column, x) in displayedColumns" :key="x" class="sand-queue-column">
          <template v-for="row in 3" :key="row">
            <button v-if="row === 1 && column[0]" class="sand-queue-front" :disabled="blocked" :aria-label="`第${x + 1}列${PALETTE[column[0].color]?.name}桶，容量${column[0].capacity}，送上传送带`" @click="choose(x)"><SandBucket :color="column[0].color" :capacity="column[0].capacity" /><span>点我上带</span></button>
            <div v-else-if="column[row - 1]" class="sand-queue-back" :aria-label="`第${x + 1}列后排${PALETTE[column[row - 1]!.color]?.name}桶，暂不可选`"><SandBucket :color="column[row - 1]!.color" :capacity="column[row - 1]!.capacity" muted /><Lock :size="11" /></div>
            <div v-else class="sand-queue-empty"><Check v-if="row === 1" :size="18" /><span v-if="row === 1">已出发</span></div>
          </template>
        </div>
      </div>
      <span class="sand-more-queue">{{ hasMoreBuckets ? '取走前排后，下一桶自动向前补位' : '后排桶会自动向前补位' }}</span>
    </section>
    <footer class="sand-bottom"><span><Sparkles :size="14" />满桶自动消失 · 未满再次上带</span><button :disabled="view.phase === 'ready'" @click="openSheet('restart')"><RotateCcw :size="16" />重来</button></footer>
    <div v-if="sheet" class="sand-sheet-backdrop" @click.self="closeSheet">
      <div ref="modal" class="sand-sheet" role="dialog" aria-modal="true" :aria-label="sheet === 'help' ? '玩法说明' : sheet === 'restart' ? '重新开始' : '选择关卡'" tabindex="-1">
        <button class="sand-sheet-close sand-icon-button" aria-label="关闭弹窗" @click="closeSheet"><X :size="20" /></button>
        <template v-if="sheet === 'help'"><small>HOW TO PLAY</small><h2>一眼看颜色，一点就出发</h2><ol><li>只有每列最前面的桶可以点，取走后后桶补位。</li><li>桶从左向右移动，只收集底部附近的同色沙子。到右侧消失，未满桶会从左侧再次出现，期间仍占一个位置。</li><li>传送带最多六桶。三个同色桶自动合成一个，腾出两个位置。</li><li>桶上数字是剩余容量，装满立即消失。收完沙画就通关！</li></ol><p>颜色也有独立符号，选桶时可以一起辨认。</p><button class="sand-primary" @click="closeSheet">知道啦 <Check :size="17" /></button></template>
        <template v-else-if="sheet === 'restart'"><small>A FRESH START</small><h2>重新收集这幅沙画？</h2><p>本局桶子和沙子会恢复，所有关卡都可随时选择。</p><button class="sand-primary" @click="load(levelIndex); start()">重新开始 <RotateCcw :size="16" /></button><button class="sand-secondary" @click="closeSheet">继续这一局</button></template>
        <template v-else><small>YOUR LITTLE COLLECTION</small><h2>选一幅沙画，挑战一下</h2><button v-for="(item, i) in sandLevels" :key="item.name" class="sand-level-option" @click="load(i)"><span>{{ String(i + 1).padStart(2, '0') }}</span><strong>{{ item.name }}<small>{{ ['轻松', '进阶', '挑战'][item.difficulty ?? 0] }} · {{ new Set(item.sand).size - 1 }} 色</small></strong><ChevronRight :size="18" /></button></template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sand-shell{--sand-ink:#365643;--sand-muted:#84947b;color:var(--sand-ink);max-width:440px;margin:auto;background:#f4f7eb;border:1px solid #e1e9d9;border-radius:22px;padding:15px;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden}.sand-header{display:flex;align-items:center;gap:7px;min-height:44px}.sand-icon-button{width:44px;height:44px;display:grid;place-items:center;background:#e8eede;border-radius:14px;color:#63805a;padding:0;flex-shrink:0}.sand-level-select{background:none;text-align:left;flex:1;padding:0;min-width:0}.sand-level-select small{font-size:11px;letter-spacing:2px;color:#94a585;display:block;margin-bottom:3px}.sand-level-select strong{display:block;overflow:hidden;text-overflow:ellipsis;font-size:13px;white-space:nowrap}.sand-level-select strong svg{vertical-align:middle}.sand-progress{padding:0 5px}.sand-progress>div:first-child{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}.sand-progress span{font-size:11px;color:#90a17f}.sand-progress strong{font-size:20px;line-height:1}.sand-progress small{font-size:11px;margin-left:2px;color:#8a9c7a}.sand-progress-track{height:6px;border-radius:5px;background:#e1e9d7;overflow:hidden}.sand-progress-track i{display:block;height:100%;background:linear-gradient(90deg,#aac77e,#6eaa85);transition:width .2s;border-radius:5px}.sand-scene{position:relative;width:100%;aspect-ratio:360/400;min-height:180px;border-radius:18px;overflow:hidden}.sand-scene canvas{display:block;width:100%;height:100%;object-fit:fill}.sand-scene-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:15px;background:#eff5e645;backdrop-filter:blur(3px)}.sand-start-card{background:#fffef5ef;box-shadow:0 10px 40px #3454361a;padding:22px 16px;border:1px solid white;border-radius:20px;width:100%;max-width:320px;text-align:center}.sand-card-spark{height:49px;width:49px;border-radius:17px;background:#f8e9bf;color:#c4a258;display:grid;place-items:center;margin:0 auto 14px;transform:rotate(-7deg)}.sand-start-card h2{font-size:19px;letter-spacing:-.4px;margin:0 0 10px}.sand-start-card p{font-size:12px;color:#8c9a80;line-height:1.9;margin:0 0 18px}.sand-primary{min-height:46px;background:#426f50;color:#fffef2;border-radius:12px;padding:12px 22px;display:inline-flex;align-items:center;justify-content:center;gap:16px;font-size:13px;font-weight:600}.sand-primary:hover{background:#335d40}.sand-belt-status{display:flex;align-items:center;justify-content:space-between;gap:7px;font-size:11px;min-height:25px}.sand-belt-status>span:first-child{display:flex;align-items:center;gap:5px;white-space:nowrap}.sand-belt-status i{width:6px;height:6px;border-radius:50%;background:#81b48a}.sand-belt-status i.full{background:#de9f75}.sand-belt-status strong{font-size:14px}.sand-slots{display:flex;gap:3px}.sand-slots span{width:17px;height:17px;background:#e2e9d8;border-radius:5px;display:grid;place-items:center;font-size:10px;color:#fff}.sand-merge-label{font-size:10px;color:#92a27f;white-space:nowrap}.sand-tip{font-size:11px;text-align:center;line-height:1.6;min-height:18px;margin:0;color:#7a926d}.sand-tray{border-radius:16px;background:#eaf0df;padding:10px 10px 6px}.sand-tray-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}.sand-tray-heading strong{font-size:12px;font-weight:500}.sand-tray-heading>span{font-size:10px;color:#92a17f}.sand-queue-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.sand-queue-column{display:flex;flex-direction:column;gap:4px;min-width:0}.sand-queue-front{width:100%;height:91px;padding:3px 4px 4px;background:#fffdf1;border:1px solid #d7e4c5;border-radius:13px;display:flex;align-items:center;flex-direction:column;box-shadow:0 3px 0 #dce5ce}.sand-queue-front .sand-bucket-art{height:69px;width:68px;max-width:100%}.sand-queue-front>span{font-size:9px;color:#80a16b}.sand-queue-front:disabled{opacity:.55}.sand-queue-front:active:not(:disabled){transform:translateY(2px);box-shadow:none;background:#f7f9e6}.sand-queue-back{height:42px;position:relative;display:flex;justify-content:center;opacity:.48}.sand-queue-back .sand-bucket-art{width:43px;height:44px}.sand-queue-back>svg:not(.sand-bucket-art){position:absolute;right:6px;bottom:5px;color:#819172}.sand-queue-empty{height:42px;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#b0bea0;font-size:9px;gap:3px}.sand-queue-empty:first-child{height:91px;border:1px dashed #cedcc1;border-radius:13px}.sand-more-queue{display:block;font-size:9px;color:#9cab8a;text-align:center;margin-top:5px}.sand-bottom{display:flex;align-items:center;justify-content:space-between;gap:5px;min-height:44px}.sand-bottom>span{display:flex;align-items:center;gap:5px;color:#93a383;font-size:10px}.sand-bottom>button{display:flex;align-items:center;justify-content:center;gap:5px;border-radius:12px;background:#e8eede;color:#79936a;min-height:44px;min-width:70px;font-size:12px}.sand-sheet-backdrop{position:fixed;inset:0;z-index:100;background:#233d3459;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(4px)}.sand-sheet{width:100%;max-width:390px;border-radius:24px;background:#fffef5;padding:30px 24px 24px;position:relative;max-height:85dvh;overflow:auto;outline:none}.sand-sheet-close{position:absolute;right:12px;top:12px;width:36px;height:36px}.sand-sheet>small{font-size:9px;letter-spacing:1.7px;color:#a4b291}.sand-sheet h2{font-size:20px;margin:14px 0;color:#42654a}.sand-sheet li{font-size:13px;line-height:1.9;margin:10px 0;color:#7d9173}.sand-sheet ol{padding-left:20px}.sand-sheet p{font-size:12px;line-height:1.9;color:#92a282;margin:16px 0 20px}.sand-sheet .sand-primary{width:100%;margin-top:8px}.sand-secondary{width:100%;min-height:44px;margin-top:10px;border-radius:12px;background:#edf2e4;font-size:13px;color:#7b9669}.sand-level-option{display:flex;align-items:center;gap:12px;width:100%;min-height:62px;border-radius:13px;background:#edf2e4;padding:12px;margin-top:10px}.sand-level-option>span{color:#91aa7b;font-size:21px}.sand-level-option strong{font-size:13px;text-align:left;flex:1}.sand-level-option strong small{display:block;font-size:10px;color:#8a9e7b;font-weight:400;margin-top:5px}.sand-level-option>svg{color:#88a275}
@media(max-width:760px) and (orientation:portrait){.sand-shell{border:0;border-radius:0;max-width:460px;width:100%;height:100svh;height:100dvh;padding:calc(9px + env(safe-area-inset-top)) 13px calc(5px + env(safe-area-inset-bottom));gap:6px;margin:auto}.sand-scene{aspect-ratio:auto;flex:1;min-height:160px}.sand-header{gap:5px}.sand-queue-front{height:80px}.sand-queue-front .sand-bucket-art{height:60px}.sand-queue-empty:first-child{height:80px}.sand-tray{padding-top:8px}.sand-queue-back{height:35px}.sand-queue-back .sand-bucket-art{height:37px;width:37px}.sand-shell>.sand-progress{flex-shrink:0}.sand-tray,.sand-bottom,.sand-header,.sand-belt-status,.sand-tip{flex-shrink:0}.sand-sheet-backdrop{align-items:flex-end;padding:0}.sand-sheet{max-width:460px;border-radius:24px 24px 0 0;padding-bottom:calc(24px + env(safe-area-inset-bottom))}.sand-start-card{max-width:295px;padding:20px 14px}}
@media(max-width:360px){.sand-level-select strong{font-size:11px}.sand-icon-button{width:40px;height:42px}.sand-merge-label{font-size:9px}.sand-slots span{width:15px;height:15px}.sand-queue-grid{gap:6px}.sand-tip{font-size:10px}}
@media(max-height:700px) and (orientation:portrait){.sand-shell{gap:4px}.sand-header{min-height:40px}.sand-progress strong{font-size:17px}.sand-queue-front{height:70px}.sand-queue-front .sand-bucket-art{height:51px}.sand-queue-empty:first-child{height:70px}.sand-queue-back{height:29px}.sand-queue-back .sand-bucket-art{height:31px;width:31px}.sand-more-queue{display:none}.sand-bottom{min-height:40px}.sand-start-card{padding:14px 10px}.sand-card-spark{display:none}.sand-start-card h2{font-size:17px}.sand-start-card p{margin-bottom:12px;font-size:11px}}
@media(prefers-reduced-motion:reduce){.sand-progress-track i{transition:none}.sand-scene-overlay,.sand-sheet-backdrop{backdrop-filter:none}}
</style>
