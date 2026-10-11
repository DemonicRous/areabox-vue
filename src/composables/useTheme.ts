import { ref, watch } from 'vue'
export type Theme = 'light' | 'dark'
const theme = ref<Theme>(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
watch(theme, value => {
  document.documentElement.classList.toggle('dark', value === 'dark')
  document.documentElement.style.colorScheme = value
  try { localStorage.setItem('areabox-theme', value) } catch { /* Theme works without storage. */ }
})
export function useTheme() { return { theme } }
