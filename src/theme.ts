import { readonly, ref } from 'vue'

export const themes = [
  { id: 'vivid', name: '活力缤纷', description: '明亮紫 · 清爽蓝 · 元气橙', colors: ['#6547ed', '#16bb91', '#ffb82e', '#ff6294'], background: '#f4f3ff' },
  { id: 'sunset', name: '日落汽水', description: '珊瑚橘 · 桃子粉 · 海盐蓝', colors: ['#dc4b32', '#ff7c52', '#ed528c', '#179aca'], background: '#fff5ef' },
  { id: 'soft', name: '柔和森林', description: '原有配色 · 鼠尾草绿 · 奶油黄', colors: ['#285c47', '#63b998', '#f2c866', '#e58c9f'], background: '#f6f8f5' },
] as const
export type ThemeId = typeof themes[number]['id']
const storageKey = 'pocket-play-theme'
export function isTheme(value: unknown): value is ThemeId { return themes.some(item => item.id === value) }
export function readTheme(storage: Pick<Storage, 'getItem'>): ThemeId {
  try { const value = storage.getItem(storageKey); return isTheme(value) ? value : 'vivid' } catch { return 'vivid' }
}
const current = ref<ThemeId>('vivid')
export const theme = readonly(current)
export const themePickerOpen = ref(false)
function apply(id: ThemeId) {
  current.value = id
  document.documentElement.dataset.theme = id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themes.find(item => item.id === id)!.background)
}
export function setTheme(id: ThemeId) {
  if (!isTheme(id)) return
  apply(id)
  try { localStorage.setItem(storageKey, id) } catch { /* Keep the selected theme for this visit. */ }
}
export function initTheme() {
  let id: ThemeId = 'vivid'
  try { id = readTheme(localStorage) } catch { /* Storage can be disabled by the browser. */ }
  apply(id)
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) apply(isTheme(event.newValue) ? event.newValue : 'vivid')
  })
}
