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
  <section class="panel">
    <div class="panel-heading"><span class="step">01</span><h2>Параметры короба</h2></div>
    <label>Конструкция<select v-model="draft.design"><option v-for="design in designs" :key="design.id" :value="design.id">{{ design.title }}</option></select></label>
    <div class="dimensions">
      <label v-for="field in dimensions" :key="field.key">{{ field.label }}<span class="input-wrap"><input v-model.number="draft[field.key]" type="number" :min="field.min" max="2500" step="1" /><span>мм</span></span></label>
    </div>
    <label>Профиль картона<select v-model="draft.profile"><option v-for="profile in profiles" :key="profile">{{ profile }}</option></select></label>
    <ul v-if="errors.length" class="errors" role="alert"><li v-for="error in errors" :key="error">{{ error }}</li></ul>
    <p class="form-note">Размеры сохраняются при переходе между разделами текущей сессии.</p>
  </section>
</template>
