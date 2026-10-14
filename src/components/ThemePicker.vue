<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Palette, Check, X } from 'lucide-vue-next'
import { theme, themes, setTheme, themePickerOpen } from '../theme'

defineProps<{ compact?: boolean }>()
const dialog = ref<HTMLDialogElement>()
const target = ref<Element | string>('body')
const isOpen = ref(false)
let previousOverflow = ''
function open() {
  target.value = document.fullscreenElement ?? 'body'
  // The dialog is teleported inside a fullscreen game so it remains reachable.
  requestAnimationFrame(() => {
    if (!dialog.value || themePickerOpen.value) return
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialog.value.showModal()
    isOpen.value = true
    themePickerOpen.value = true
  })
}
function closed() {
  if (!isOpen.value) return
  isOpen.value = false
  themePickerOpen.value = false
  document.documentElement.style.overflow = previousOverflow
}
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return
  const box = dialog.value.getBoundingClientRect()
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.value.close()
}
onBeforeUnmount(() => { if (isOpen.value) { dialog.value?.close(); closed() } })
</script>

<template>
  <button class="theme-trigger" :class="{ 'theme-trigger-compact': compact }" aria-label="切换主题" aria-haspopup="dialog" :aria-expanded="isOpen" @click="open"><Palette :size="19" /><span v-if="!compact">主题</span></button>
  <Teleport :to="target">
    <dialog ref="dialog" class="theme-dialog" aria-label="选择主题" @close="closed" @click="backdrop" @keydown.stop>
      <div class="theme-dialog-heading"><div><small>换个颜色，换个心情</small><h2>挑一套你喜欢的主题</h2></div><button class="theme-close" aria-label="关闭主题选择" @click="dialog?.close()"><X :size="21" /></button></div>
      <div class="theme-options" role="group" aria-label="主题配色">
        <button v-for="item in themes" :key="item.id" class="theme-option" :class="{ 'is-selected': theme === item.id }" :aria-pressed="theme === item.id" @click="setTheme(item.id)">
          <span class="theme-preview" :style="{ background: item.background }"><i v-for="color in item.colors" :key="color" :style="{ background: color }" /></span>
          <span class="theme-option-copy"><strong>{{ item.name }}<em v-if="item.id === 'vivid'">推荐</em></strong><small>{{ item.description }}</small></span>
          <span class="theme-selected"><Check v-if="theme === item.id" :size="17" /></span>
        </button>
      </div>
      <button class="theme-done" @click="dialog?.close()">就用这个</button>
    </dialog>
  </Teleport>
</template>
