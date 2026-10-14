<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { Play, RotateCcw } from 'lucide-vue-next'
import { recordScore } from '../store'
const running = ref(false), ended = ref(false), active = ref(-1), score = ref(0), left = ref(30), hit = ref(-1)
let timer: ReturnType<typeof setInterval> | undefined, pop: ReturnType<typeof setInterval> | undefined, hitTimer: ReturnType<typeof setTimeout> | undefined, deadline = 0
function stop() { clearInterval(timer); clearInterval(pop); clearTimeout(hitTimer) }
function appear() { let next = Math.floor(Math.random() * 9); if (next === active.value) next = (next + 1) % 9; active.value = next }
function start() { stop(); running.value = true; ended.value = false; score.value = 0; left.value = 30; hit.value = -1; deadline = Date.now() + 30000; appear(); pop = setInterval(appear, 730); timer = setInterval(() => { left.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); if (left.value <= 0) { stop(); running.value = false; ended.value = true; active.value = -1; recordScore('mole', score.value) } }, 100) }
function whack(index: number) { if (!running.value || index !== active.value || Date.now() >= deadline) return; score.value += 10; active.value = -1; hit.value = index; recordScore('mole', score.value); clearTimeout(hitTimer); hitTimer = setTimeout(() => hit.value = -1, 240) }
onUnmounted(stop)
</script>
<template>
  <div class="game-toolbar"><div class="score-pill">得分 <strong>{{ score }}</strong><span class="toolbar-divider"></span>剩余 {{ left }} 秒</div><div class="toolbar-actions"><button @click="start"><RotateCcw v-if="running || ended" :size="16" /><Play v-else :size="16" />{{ running || ended ? '重来' : '开始' }}</button></div></div>
  <div class="board-wrap"><div class="mole-board"><button v-for="n in 9" :key="n" class="mole-hole" :class="{ popped: active === n - 1, hit: hit === n - 1 }" :aria-label="active === n - 1 ? `打第 ${n} 只地鼠` : `第 ${n} 个地洞`" @pointerdown.prevent="whack(n - 1)" @keydown.enter.prevent="whack(n - 1)" @keydown.space.prevent="whack(n - 1)"><span class="mole-body"><span class="mole-ear left"></span><span class="mole-ear right"></span><span class="mole-eyes">• •</span><span class="mole-snout">ᴥ</span></span><span class="hole-front"></span><span v-if="hit === n - 1" class="hit-score">+10 ✦</span></button></div><div v-if="!running" class="board-overlay"><span>{{ ended ? '🎉' : '🔨' }}</span><h2>{{ ended ? '好手速！' : '地鼠们藏好啦' }}</h2><p>{{ ended ? `30 秒获得 ${score} 分，打中 ${score / 10} 只` : '地鼠冒头就点它，30 秒能抓住几只？' }}</p><button class="primary-button" @click="start">{{ ended ? '再来一局' : '开始挑战' }}</button></div></div><p class="game-instruction">点击冒出来的小地鼠，每只 +10 分。<br />只有 30 秒，眼疾手快才是王道！</p>
</template>
