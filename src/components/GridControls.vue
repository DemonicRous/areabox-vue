<script setup lang="ts">
import { computed, ref } from 'vue'
import CatalogSelect from './CatalogSelect.vue'
import { cardboardProfiles } from '../data/catalog'
import { gridDraft as grid, gridModel as model, gridSlotMm } from '../composables/useGridDraft'
import { useBoxDraft } from '../composables/useBoxDraft'
import { calculateGrid } from '../domain/grid'
const draft=useBoxDraft()
const needed=ref(12)
const options=cardboardProfiles.map(p=>({value:p.id,label:p.id,cells:[`${p.actualThicknessMm} мм`,`${p.drawingThicknessMm} мм`]}))
const suggestions=computed(()=>{
  if(!Number.isInteger(needed.value)||needed.value<2||needed.value>900) return []
  const result=[]
  for(let rows=1;rows<=30;rows++) for(let cols=1;cols<=30;cols++) {
    if(rows*cols!==needed.value) continue
    const m=calculateGrid(draft,{...grid,rows,cols,slotMm:gridSlotMm.value})
    if(!m.errors.length) result.push({rows,cols,score:Math.abs(Math.log(m.length/m.width))})
  }
  return result.sort((a,b)=>a.score-b.score).slice(0,4)
})
</script>
<template>
  <fieldset class="space-y-4 border-t border-line pt-4">
    <legend class="text-sm font-medium">Решётка</legend>
    <fieldset>
      <legend class="mb-2 text-xs font-medium text-muted">Габариты продукта, мм</legend>
      <div class="grid grid-cols-3 gap-2">
        <label class="field">Длина L<input v-model.number="grid.productLengthMm" class="control" type="number" min="1" max="2500" /></label>
        <label class="field">Ширина W<input v-model.number="grid.productWidthMm" class="control" type="number" min="1" max="2500" /></label>
        <label class="field">Высота H<input v-model.number="grid.productHeightMm" class="control" type="number" min="1" max="2500" /></label>
      </div>
    </fieldset>
    <label class="field">Допуск ячейки, мм<input v-model.number="grid.cellGapMm" class="control" type="number" min="0" step="0.5" /></label>
    <p class="text-xs text-muted">Расчётная ячейка: <strong class="text-ink">{{ model.cellL }} × {{ model.cellW }} мм</strong>. Допуск прибавляется к длине и ширине продукта.</p>
    <div class="grid grid-cols-2 gap-3">
      <label class="field">Колонки<input v-model.number="grid.cols" class="control" type="number" min="1" max="30" step="1" /></label>
      <label class="field">Ряды<input v-model.number="grid.rows" class="control" type="number" min="1" max="30" step="1" /></label>
    </div>
    <p class="text-xs text-muted">Композиция {{ grid.cols }} × {{ grid.rows }} · {{ grid.cols*grid.rows }} ячеек</p>
    <label class="field">Высота решётки, мм<input :value="grid.heightMm || ''" class="control" type="number" min="20" max="2500" :placeholder="`По продукту: ${grid.productHeightMm} мм`" @input="grid.heightMm=Number(($event.target as HTMLInputElement).value)" /></label>
    <p class="text-[11px] text-muted">По умолчанию равна высоте продукта. Очистите поле, чтобы вернуть автоматическую высоту.</p>
    <CatalogSelect v-model="grid.profile" label="Профиль решётки" :options="options" :columns="['Фактическая','Чертёжная']" />
    <p class="text-[11px] text-muted">Расчёт по чертёжной толщине. Полосы укорочены на 2,5 мм с каждого края для посадки в короб; шаг просечек сохраняется.</p>
    <CatalogSelect v-model="grid.assembly" label="Сборка" :options="[{value:'auto',label:'Автоподбор',description:'Premier PCM или ручная сборка'},{value:'premier',label:'Premier PCM'},{value:'manual',label:'Ручная сборка решётки'}]" />
    <details class="text-xs">
      <summary class="min-h-11 cursor-pointer py-3 text-muted">Подбор композиции</summary>
      <div class="grid grid-cols-2 gap-3">
        <label class="field">Количество ячеек<input v-model.number="needed" class="control" type="number" min="2" max="900" /></label>
        <p class="self-center text-muted">Просечка автоматически: RODA — 7 мм, плоттер и высечка — 6 мм.</p>
      </div>
      <div class="mt-3 flex flex-wrap gap-2"><button v-for="option in suggestions" :key="`${option.cols}-${option.rows}`" type="button" class="min-h-11 cursor-pointer rounded-md bg-canvas px-3" @click="grid.rows=option.rows;grid.cols=option.cols">{{ option.cols }} × {{ option.rows }}</button><p v-if="!suggestions.length" class="text-muted">Подходящих вариантов нет.</p></div>
    </details>
    <ul v-if="model.errors.length" role="alert" class="space-y-1 text-xs text-danger"><li v-for="error in model.errors" :key="error">{{ error }}</li></ul>
  </fieldset>
</template>
