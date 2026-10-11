<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { useTheme } from '../composables/useTheme'
const { theme } = useTheme()
</script>
<template>
  <div class="inline-flex shrink-0 rounded-lg border border-line bg-canvas p-0.5" role="group" aria-label="Тема оформления">
    <button v-for="value in (['light', 'dark'] as const)" :key="value" type="button" :aria-label="value === 'light' ? 'Светлая тема' : 'Тёмная тема'" :title="value === 'light' ? 'Светлая тема' : 'Тёмная тема'" :aria-pressed="theme === value" class="flex size-11 cursor-pointer items-center justify-center rounded-md transition-colors motion-reduce:transition-none" :class="theme === value ? 'bg-surface text-ink' : 'text-muted hover:text-ink'" @click="theme = value"><AppIcon :name="value === 'light' ? 'sun' : 'moon'" /></button>
  </div>
</template>
