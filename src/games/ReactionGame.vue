<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { Zap, RotateCcw } from 'lucide-vue-next'
import { recordScore } from '../store'
const phase = ref<'idle' | 'waiting' | 'ready' | 'early' | 'result' | 'done'>('idle'), results = ref<number[]>([]), last = ref(0)
let timeout: ReturnType<typeof setTimeout> | undefined, readyTime = 0
const average = computed(() => Math.round(results.value.reduce((a, b) => a + b, 0) / Math.max(1, results.value.length)))
function wait() { phase.value = 'waiting'; clearTimeout(timeout); timeout = setTimeout(() => { phase.value = 'ready'; readyTime = performance.now() }, 1600 + Math.random() * 3000) }
function tap() {
  if (phase.value === 'waiting') { clearTimeout(timeout); phase.value = 'early' }
  else if (phase.value === 'ready') { last.value = Math.round(performance.now() - readyTime); results.value.push(last.value); if (results.value.length === 5) { phase.value = 'done'; recordScore('reaction', average.value, true) } else phase.value = 'result' }
  else if (phase.value === 'done') reset()
  else wait()
}
function reset() { clearTimeout(timeout); phase.value = 'idle'; results.value = []; last.value = 0 }
function visibility() { if (document.hidden && ['waiting', 'ready'].includes(phase.value)) { clearTimeout(timeout); phase.value = 'idle' } }
document.addEventListener('visibilitychange', visibility)
onUnmounted(() => { clearTimeout(timeout); document.removeEventListener('visibilitychange', visibility) })
</script>
<template>
  <div class="game-toolbar"><div class="score-pill">挑战进度 <strong>{{ results.length }}/5</strong></div><div class="toolbar-actions"><button @click="reset"><RotateCcw :size="16" />重来</button></div></div>
  <button class="reaction-zone" :class="phase" @pointerdown.prevent="tap" @keydown.enter.prevent="tap" @keydown.space.prevent="tap">
    <Zap :size="50" :stroke-width="1.5" />
    <template v-if="phase === 'idle'"><h2>你的反应有多快？</h2><p>屏幕变绿时，立刻点击</p><span class="reaction-cta">点击这里，开始挑战 ↗</span></template>
    <template v-else-if="phase === 'waiting'"><h2>等一等…</h2><p>保持专注，绿色马上出现</p><span class="reaction-cta">现在先别点哦</span></template>
    <template v-else-if="phase === 'ready'"><h2>就是现在！</h2><p>快点我！</p></template>
    <template v-else-if="phase === 'early'"><h2>有点心急啦</h2><p>要等变成绿色再点哦</p><span class="reaction-cta">点击再试一次，不计入成绩 ↗</span></template>
    <template v-else-if="phase === 'result'"><h2 class="reaction-score">{{ last }}<small>ms</small></h2><p>{{ last < 250 ? '闪电般的速度！' : last < 400 ? '反应很不错哦！' : '慢慢来，下一次会更快' }}</p><span class="reaction-cta">点击开始下一轮 ↗</span></template>
    <template v-else><h2 class="reaction-score">{{ average }}<small>ms</small></h2><p>5 轮平均反应时间 · {{ average < 250 ? '你就是闪电侠！' : '挑战完成，很棒！' }}</p><span class="reaction-cta">点击重新挑战 ↗</span></template>
  </button>
  <div class="reaction-rounds"><span v-for="n in 5" :key="n" :class="{ complete: results[n - 1] !== undefined }">{{ results[n - 1] !== undefined ? `${results[n - 1]} ms` : `第 ${n} 轮` }}</span></div><p class="game-instruction">等待屏幕变绿后尽快点击，完成 5 轮挑战。<br />平均用时越短，反应越快！</p>
</template>
