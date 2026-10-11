<script setup lang="ts">
import { computed } from 'vue'
import { useBoxDraft } from '../composables/useBoxDraft'
import { designs, cardboardProfiles } from '../data/catalog'
import CatalogSelect from './CatalogSelect.vue'
const formatMm = (value: number) => `${value.toLocaleString('ru-RU')} мм`
const profileOptions = cardboardProfiles.map(profile => ({ value: profile.id, label: profile.id, cells: [formatMm(profile.actualThicknessMm), formatMm(profile.drawingThicknessMm)] }))
const designOptions = designs.map(design => ({ value: design.id, label: design.id, description: design.title.split(' · ')[1] }))
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
  if (draft.hasPrinting && (!Number.isInteger(draft.printColors) || draft.printColors < 1)) {
    issues.push('Количество цветов: введите целое число от 1.')
  }
  return issues
})
</script>

<template>
  <section class="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="box-parameters">
    <h2 id="box-parameters" class="mb-5 text-sm font-semibold">Параметры</h2>
    <div class="space-y-5">
      <CatalogSelect v-model="draft.design" label="Конструкции" :options="designOptions" />
      <fieldset><legend class="mb-2 text-xs font-medium text-muted">Размеры, мм</legend><div class="grid grid-cols-3 gap-2">
        <label v-for="field in dimensions" :key="field.key" class="field">{{ field.label }}<input v-model.number="draft[field.key]" class="control tabular-nums" type="number" inputmode="decimal" :min="field.min" max="2500" step="1" :aria-invalid="typeof draft[field.key] !== 'number' || draft[field.key] < field.min || draft[field.key] > 2500 || (field.key === 'widthMm' && draft.widthMm > draft.lengthMm)" :aria-describedby="errors.length ? 'box-errors' : undefined" /></label>
      </div></fieldset>
      <CatalogSelect v-model="draft.profile" label="Профиль картона" :options="profileOptions" :columns="['Фактическая', 'Чертёжная']" />
      <div class="space-y-4 border-t border-line pt-4">
        <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <input v-model="draft.hasPrinting" type="checkbox" class="size-4 shrink-0 accent-accent" aria-controls="box-printing" />
          Наличие печати
        </label>
        <div v-if="draft.hasPrinting" id="box-printing" class="grid gap-4 sm:grid-cols-2">
          <label class="field">Тип печати<select v-model="draft.printType" class="control">
            <option value="digital">Цифровая печать</option>
            <option value="flexo">Флексопечать</option>
            <option value="pinlong">Полноцветная печать</option>
          </select></label>
          <label class="field">Количество цветов<input v-model.number="draft.printColors" class="control tabular-nums" type="number" inputmode="numeric" min="1" step="1" :aria-invalid="!Number.isInteger(draft.printColors) || draft.printColors < 1" :aria-describedby="errors.length ? 'box-errors' : undefined" /></label>
        </div>
      </div>
      <ul v-if="errors.length" id="box-errors" class="space-y-1 text-xs leading-relaxed text-danger" role="alert"><li v-for="error in errors" :key="error">{{ error }}</li></ul>
    </div>
  </section>
</template>
