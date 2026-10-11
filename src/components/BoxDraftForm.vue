<script setup lang="ts">
import { computed } from 'vue'
import { useBoxDraft } from '../composables/useBoxDraft'
import { designs, profiles } from '../data/catalog'
const draft = useBoxDraft()
const dimensions = [
  { key: 'lengthMm', label: 'Длина L', min: 50 },
  { key: 'widthMm', label: 'Ширина W', min: 50 },
  { key: 'heightMm', label: 'Высота H', min: 30 },
] as const
const errors = computed(() => {
  const issues: string[] = []
  for (const field of dimensions) {
    const value = draft[field.key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < field.min || value > 2500) {
      issues.push(`${field.label}: введите число от ${field.min} до 2500 мм.`)
    }
  }
  if (draft.widthMm > draft.lengthMm) issues.push('Ширина должна быть не больше длины.')
  return issues
})
</script>

<template>
  <section class="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="box-parameters">
    <h2 id="box-parameters" class="mb-5 text-sm font-semibold">Параметры</h2>
    <div class="space-y-5">
      <label class="field">Конструкция<select v-model="draft.design" class="control"><option v-for="design in designs" :key="design.id" :value="design.id">{{ design.title }}</option></select></label>
      <fieldset><legend class="mb-2 text-xs font-medium text-muted">Размеры, мм</legend><div class="grid grid-cols-3 gap-2">
        <label v-for="field in dimensions" :key="field.key" class="field">{{ field.label }}<input v-model.number="draft[field.key]" class="control tabular-nums" type="number" inputmode="decimal" :min="field.min" max="2500" step="1" :aria-invalid="typeof draft[field.key] !== 'number' || draft[field.key] < field.min || draft[field.key] > 2500 || (field.key === 'widthMm' && draft.widthMm > draft.lengthMm)" :aria-describedby="errors.length ? 'box-errors' : undefined" /></label>
      </div></fieldset>
      <label class="field">Профиль<select v-model="draft.profile" class="control"><option v-for="profile in profiles" :key="profile">{{ profile }}</option></select></label>
      <ul v-if="errors.length" id="box-errors" class="space-y-1 text-xs leading-relaxed text-danger" role="alert"><li v-for="error in errors" :key="error">{{ error }}</li></ul>
    </div>
  </section>
</template>
