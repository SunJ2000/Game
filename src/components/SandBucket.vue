<script setup lang="ts">
import { PALETTE } from '../games/sand-collect/engine'
defineProps<{ color: number; capacity: number; remaining?: number; muted?: boolean }>()
</script>
<template>
  <svg class="sand-bucket-art" viewBox="0 0 80 82" aria-hidden="true" :style="{ '--bucket-color': PALETTE[color]?.hex }">
    <ellipse cx="40" cy="76" rx="26" ry="5" fill="#496747" opacity=".1" />
    <path d="M15 24 23 65Q40 82 57 65L65 24Z" fill="var(--bucket-color)" stroke="#ffffff" stroke-width="2" />
    <path d="M17 29 24 62Q28 67 31 67L26 29Z" fill="#ffffff" opacity=".18" />
    <path d="M15 26C5-2 75-2 65 26" fill="none" stroke="#466950" stroke-opacity=".5" stroke-width="3" />
    <ellipse cx="40" cy="25" rx="25" ry="10" fill="var(--bucket-color)" stroke="#ffffff" stroke-width="3" />
    <ellipse cx="40" cy="25" rx="21" ry="7" fill="#243b38" opacity=".22" />
    <ellipse v-if="remaining !== undefined && remaining < capacity" cx="40" cy="27" :rx="10 + (1 - remaining / capacity) * 10" ry="5" fill="var(--bucket-color)" />
    <text x="40" y="51" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" opacity=".9">{{ PALETTE[color]?.symbol }}</text>
    <rect x="17" y="55" width="46" height="21" rx="10" fill="#273f39" :opacity="muted ? .4 : .88" />
    <text x="40" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="white" font-family="Outfit, sans-serif">{{ remaining ?? capacity }}</text>
  </svg>
</template>
<style scoped>.sand-bucket-art{display:block;width:100%;height:100%;overflow:visible}</style>
