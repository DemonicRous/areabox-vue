<script setup lang="ts">
import { computed, watch } from 'vue'
import { useBoxDraft } from '../composables/useBoxDraft'
import { designs, cardboardProfiles } from '../data/catalog'
import CatalogSelect from './CatalogSelect.vue'
import GridControls from './GridControls.vue'
import type { PrintType } from '../domain/types'
const creaseOptions: { value: 'same' | 'different'; label: string }[] = [
  { value: 'same', label: 'На одной высоте' },
  { value: 'different', label: 'На разном уровне' },
]
const printOptions: { value: PrintType; label: string }[] = [
  { value: 'digital', label: 'Цифровая печать' },
  { value: 'flexo', label: 'Флексопечать' },
  { value: 'pinlong', label: 'Полноцветная печать' },
]
const formatMm = (value: number) => `${value.toLocaleString('ru-RU')} мм`
const profileOptions = cardboardProfiles.map(profile => ({ value: profile.id, label: profile.id, cells: [formatMm(profile.actualThicknessMm), formatMm(profile.drawingThicknessMm)] }))
const designOptions = designs.map(design => ({ value: design.id, label: design.id.startsWith('grid') ? design.title.split(' · ')[0]! : `FEFCO ${Number(design.id.split('-')[0])}`, description: design.title.split(' · ')[1] }))
const draft = useBoxDraft()
const availableCreaseOptions = computed(() => draft.design.startsWith('0203') ? creaseOptions.filter(option=>option.value==='different') : creaseOptions)
watch(() => draft.design, design => {
  if (design.startsWith('0203')) draft.creaseLevel = 'different'
  if (design === 'grid') draft.hasPrinting = false
}, { immediate: true, flush: 'sync' })
const dimensions = [
  { key: 'lengthMm', label: 'Длина L', min: 50 },
  { key: 'widthMm', label: 'Ширина W', min: 50 },
  { key: 'heightMm', label: 'Высота H', min: 30 },
] as const
const errors = computed(() => {
  const issues: string[] = []
  if (draft.design==='grid') return issues
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
      <fieldset v-if="!draft.design.startsWith('grid')"><legend class="mb-2 text-xs font-medium text-muted">{{ draft.design.startsWith('grid') ? 'Внутренние размеры короба, мм' : 'Размеры, мм' }}</legend><div class="grid grid-cols-3 gap-2">
        <label v-for="field in dimensions" :key="field.key" class="field">{{ field.label }}<input v-model.number="draft[field.key]" class="control tabular-nums" type="number" inputmode="decimal" :min="field.min" max="2500" step="1" :aria-invalid="typeof draft[field.key] !== 'number' || draft[field.key] < field.min || draft[field.key] > 2500 || (field.key === 'widthMm' && draft.widthMm > draft.lengthMm)" :aria-describedby="errors.length ? 'box-errors' : undefined" /></label>
      </div></fieldset>
      <GridControls v-if="draft.design.startsWith('grid')" />
      <div v-if="draft.design==='grid-0201'" class="rounded-lg border border-line bg-canvas p-3 text-xs">
        <p class="text-muted">Короб FEFCO 201 · внутренние размеры автоматически</p>
        <p class="mt-2 font-medium tabular-nums">L {{ draft.lengthMm }} × W {{ draft.widthMm }} × H {{ draft.heightMm }} мм</p>
        <p class="mt-2 text-muted">Посадочный запас 5 мм. Высота учитывает продукт и решётку.</p>
      </div>
      <CatalogSelect v-if="draft.design!=='grid'" v-model="draft.profile" :label="draft.design==='grid-0201' ? 'Профиль короба' : 'Профиль картона'" :options="profileOptions" :columns="['Фактическая', 'Чертёжная']" />
      <CatalogSelect v-if="draft.design!=='grid'" v-model="draft.creaseLevel" label="Расположение биговок" :options="availableCreaseOptions" />
      <p v-if="draft.design.startsWith('0203')" class="text-[11px] text-muted">FEFCO 203: биговки на разных уровнях; вырезка на высечке или плоттере.</p>
      <div v-if="draft.design!=='grid'" class="space-y-4 border-t border-line pt-4">
        <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <input v-model="draft.hasPrinting" type="checkbox" class="size-4 shrink-0 accent-accent" aria-controls="box-printing" />
          Наличие печати
        </label>
        <div v-if="draft.hasPrinting" id="box-printing" class="space-y-4">
          <CatalogSelect v-model="draft.printType" label="Тип печати" :options="printOptions" />
          <label class="field">Количество цветов<input v-model.number="draft.printColors" class="control tabular-nums" type="number" inputmode="numeric" min="1" step="1" :aria-invalid="!Number.isInteger(draft.printColors) || draft.printColors < 1" :aria-describedby="errors.length ? 'box-errors' : undefined" /></label>
        </div>
      </div>
      <ul v-if="errors.length" id="box-errors" class="space-y-1 text-xs leading-relaxed text-danger" role="alert"><li v-for="error in errors" :key="error">{{ error }}</li></ul>
    </div>
  </section>
</template>
