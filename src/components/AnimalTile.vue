<script setup lang="ts">
defineProps<{ animal: number }>()
</script>
<template>
  <svg class="animal-face" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <template v-if="animal === 0"><path d="M10 28 7 7l20 12h10L57 7l-3 21" fill="#ec9c61"/><path d="m12 12 3 15 11-6m26-9-3 15-11-6" fill="#ffdab0"/><rect x="8" y="19" width="48" height="39" rx="19" fill="#f5ad70"/><path d="M11 38c4-8 12-7 21 3 9-10 18-11 22-3-2 15-11 19-22 19S14 52 11 38Z" fill="#fff4da"/></template>
    <template v-else-if="animal === 1"><circle cx="16" cy="14" r="11" fill="#bf9072"/><circle cx="48" cy="14" r="11" fill="#bf9072"/><circle cx="16" cy="14" r="6" fill="#edc8a8"/><circle cx="48" cy="14" r="6" fill="#edc8a8"/><rect x="7" y="14" width="50" height="45" rx="22" fill="#cc9f7c"/><ellipse cx="32" cy="44" rx="16" ry="12" fill="#f1d4b6"/></template>
    <template v-else-if="animal === 2"><circle cx="17" cy="17" r="11" fill="#9cbf62"/><circle cx="47" cy="17" r="11" fill="#9cbf62"/><rect x="6" y="20" width="52" height="38" rx="18" fill="#add175"/><circle cx="17" cy="17" r="7" fill="#fffbea"/><circle cx="47" cy="17" r="7" fill="#fffbea"/><circle cx="18" cy="18" r="3.5" fill="#42563c"/><circle cx="46" cy="18" r="3.5" fill="#42563c"/></template>
    <template v-else-if="animal === 3"><path d="M23 15c-8-14 6-17 9-4 7-12 18-3 9 5" fill="#e49683"/><rect x="7" y="14" width="50" height="44" rx="21" fill="#f8d97d"/><path d="m25 37 7-5 7 5-7 10Z" fill="#e6a254"/></template>
    <template v-else-if="animal === 4"><path d="M10 28 9 7l19 12h10L55 7l-2 21" fill="#b6a0d4"/><path d="m13 13 2 12 9-5m27-7-2 12-9-5" fill="#e7c4da"/><rect x="7" y="19" width="50" height="39" rx="18" fill="#c9b2e5"/><path d="m13 39 9 2m-10 5 10-1m29-6-9 2m10 5-10-1" stroke="#967eaa" stroke-width="2" stroke-linecap="round"/><path d="m28 37 4 4 4-4" fill="#93758d"/></template>
    <template v-else><circle cx="16" cy="14" r="10" fill="#7a8b8d"/><circle cx="48" cy="14" r="10" fill="#7a8b8d"/><rect x="7" y="14" width="50" height="45" rx="21" fill="#faf9e9"/><ellipse cx="21" cy="32" rx="9" ry="11" transform="rotate(22 21 32)" fill="#7a8b8d"/><ellipse cx="43" cy="32" rx="9" ry="11" transform="rotate(-22 43 32)" fill="#7a8b8d"/></template>
    <g v-if="animal !== 2" :fill="animal === 5 ? '#fffdf1' : '#574c40'"><circle cx="22" cy="31" r="3.5"/><circle cx="42" cy="31" r="3.5"/></g>
    <g v-if="animal !== 3"><path v-if="animal !== 2 && animal !== 4" d="m28 40 4 4 4-4" fill="#715b4d"/><path d="M26 46q6 7 12 0" stroke="#715b4d" stroke-width="2" stroke-linecap="round"/></g>
    <g fill="#e58b8b" opacity=".55"><ellipse cx="15" cy="40" rx="4" ry="2.5"/><ellipse cx="49" cy="40" rx="4" ry="2.5"/></g>
  </svg>
</template>
