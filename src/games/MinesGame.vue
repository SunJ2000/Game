<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { Flag, MousePointer2, RotateCcw } from 'lucide-vue-next'
import { makeMines, floodReveal } from './engine'
import { recordScore } from '../store'
const cells = ref<number[]>(Array(64).fill(0)), revealed = ref(new Set<number>()), flags = ref(new Set<number>()), flagMode = ref(false), started = ref(false), ended = ref(false), won = ref(false), seconds = ref(0), exploded = ref(-1)
let timer: ReturnType<typeof setInterval> | undefined
function reset() { clearInterval(timer); cells.value = Array(64).fill(0); revealed.value = new Set(); flags.value = new Set(); started.value = false; ended.value = false; won.value = false; seconds.value = 0; exploded.value = -1; flagMode.value = false }
function flag(index: number) { if (ended.value || revealed.value.has(index)) return; const next = new Set(flags.value); if (next.has(index)) next.delete(index); else if (next.size < 10) next.add(index); flags.value = next }
function reveal(index: number) {
  if (ended.value || revealed.value.has(index)) return
  if (flagMode.value) { flag(index); return }
  if (flags.value.has(index)) return
  if (!started.value) { cells.value = makeMines(index); started.value = true; timer = setInterval(() => seconds.value++, 1000) }
  if (cells.value[index] === -1) { exploded.value = index; ended.value = true; clearInterval(timer); return }
  revealed.value = floodReveal(cells.value, revealed.value, flags.value, index)
  if (revealed.value.size === 54) { won.value = true; ended.value = true; clearInterval(timer); recordScore('mines', Math.max(1, seconds.value), true) }
}
onUnmounted(() => clearInterval(timer))
</script>
<template>
  <div class="game-toolbar"><div class="score-pill"><Flag :size="15" />{{ 10 - flags.size }}<span class="toolbar-divider"></span>{{ seconds }} 秒</div><div class="toolbar-actions"><button :class="{ 'tool-active': flagMode }" :aria-pressed="flagMode" @click="flagMode = !flagMode"><Flag v-if="flagMode" :size="16" /><MousePointer2 v-else :size="16" />{{ flagMode ? '插旗' : '翻开' }}</button><button @click="reset"><RotateCcw :size="16" />重来</button></div></div>
  <div class="board-wrap"><div class="mines-board"><button v-for="(value, i) in cells" :key="i" class="mine-cell" :class="{ revealed: revealed.has(i), exploded: exploded === i, flagged: flags.has(i) }" :data-value="value" :aria-label="`第 ${Math.floor(i / 8) + 1} 行第 ${i % 8 + 1} 列，${revealed.has(i) ? value ? `附近 ${value} 颗雷` : '安全' : flags.has(i) ? '已标旗' : '未翻开'}`" :disabled="ended || revealed.has(i)" @click="reveal(i)" @contextmenu.prevent="flag(i)"><span v-if="ended && value === -1">✹</span><Flag v-else-if="flags.has(i)" :size="18" /><span v-else-if="revealed.has(i) && value > 0">{{ value }}</span></button></div><div v-if="ended" class="board-overlay mine-result" role="status"><span>{{ won ? '🏆' : '☕' }}</span><h2>{{ won ? '安全通关！' : '哎呀，碰到小地雷了' }}</h2><p>{{ won ? `用时 ${seconds} 秒，排雷小能手就是你` : '再试一次，下一局一定更有把握' }}</p><button class="primary-button" @click="reset">再来一局</button></div></div><p class="game-instruction">数字代表周围 8 格中的地雷数量，共 10 颗雷。<br />切换「插旗」标记地雷。第一次翻开保证安全。</p>
</template>
