<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { gridDraft as grid, gridModel as model, gridRoutes as routes, selectedGridRoute as current, gridCutting, gridConfirmed, gridView } from '../composables/useGridDraft'
const props=defineProps<{view:string}>()
const emit=defineEmits<{drawing:[];route:[]}>()
const GridScene=defineAsyncComponent(()=>import('./GridScene.vue'))
const fmt=(value:number,digits=1)=>value.toLocaleString('ru-RU',{maximumFractionDigits:digits})
const area=(value:number)=>value.toLocaleString('ru-RU',{minimumFractionDigits:3,maximumFractionDigits:3})
const sheet=computed(()=>current.value?.sheet)
function confirm() { if(!current.value || current.value.blocked.length) return; gridConfirmed.value=true;emit('drawing') }
</script>
<template>
  <div class="space-y-5 p-4 sm:p-5">
    <template v-if="props.view==='route'">
      <h2 class="text-base font-semibold">Изготовление решётки</h2>
      <p class="text-xs text-muted">{{ grid.rows*grid.cols }} ячеек · {{ model.strips.reduce((sum,strip)=>sum+strip.quantity,0) }} полос на комплект · {{ current?.assembly==='premier' ? 'сборка Premier PCM' : 'ручная сборка решётки' }}</p>
      <div class="space-y-2" role="group" aria-label="Линия изготовления решётки">
        <button v-for="route in routes" :key="route.line.id" type="button" :disabled="!!route.blocked.length" :aria-pressed="gridCutting===route.line.id" class="w-full cursor-pointer rounded-lg border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60" :class="gridCutting===route.line.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-canvas'" @click="gridCutting=route.line.id">
          <span class="flex flex-wrap items-baseline justify-between gap-2"><strong class="text-sm font-medium">{{ route.line.name }} → {{ route.assembly==='premier' ? 'Premier PCM' : 'Ручная сборка решётки' }}</strong><span v-if="!route.blocked.length && route.area!==null" class="text-xs">{{ area(route.area) }} м² / комплект</span></span>
          <span class="mt-1 block text-xs text-muted">{{ route.blocked.length ? route.blocked.join(' · ') : route.line.id==='roda' ? 'Без штанцформы · площадь полос' : `${route.sheet?.sheetX} × ${route.sheet?.sheetY} мм · ${route.sheet?.kits} комплектов на листе` }}</span>
        </button>
      </div>
      <details v-if="current?.review.length" class="text-xs text-muted"><summary class="min-h-11 cursor-pointer py-3">Требует подтверждения · {{ current.review.length }}</summary><ul class="space-y-2"><li v-for="review in current.review" :key="review">{{ review }}</li></ul></details>
      <button type="button" :disabled="!current || !!current.blocked.length" class="min-h-11 cursor-pointer rounded-md bg-accent px-4 text-sm font-medium text-surface disabled:opacity-50" @click="confirm">{{ gridConfirmed ? 'Открыть чертёж' : 'Подтвердить маршрут' }}</button>
    </template>
    <template v-else-if="!gridConfirmed || model.errors.length || current?.blocked.length">
      <div class="flex flex-col items-center gap-3 py-12"><p class="text-center text-sm text-muted">Исправьте параметры и подтвердите маршрут решётки.</p><button type="button" class="min-h-11 cursor-pointer rounded-md bg-accent-soft px-4 text-sm text-accent" @click="emit('route')">Выбрать маршрут</button></div>
    </template>
    <template v-else-if="props.view==='drawing'">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Вид решётки"><button v-for="tab in [{id:'plan',label:'Вид сверху'},{id:'strips',label:'Полосы'},{id:'scene',label:'3D'}] as const" :key="tab.id" type="button" class="min-h-11 cursor-pointer rounded-md px-3 text-sm" :class="gridView===tab.id ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-canvas'" :aria-pressed="gridView===tab.id" @click="gridView=tab.id">{{ tab.label }}</button></div>
      <div v-if="gridView==='plan'" class="rounded-xl bg-canvas p-5">
        <svg class="max-h-[480px] w-full" :viewBox="`-25 -25 ${model.length+50} ${model.width+50}`" role="img" aria-label="Вид решётки сверху">
          <rect x="0" y="0" :width="model.length" :height="model.width" fill="var(--surface)" stroke="var(--muted)" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" />
          <rect v-for="n in grid.cols-1" :key="`col-${n}`" :x="n*model.cellL+(n-1)*model.thickness" y="0" :width="model.thickness" :height="model.width" fill="var(--accent)" />
          <rect v-for="n in grid.rows-1" :key="`row-${n}`" x="0" :y="n*model.cellW+(n-1)*model.thickness" :width="model.length" :height="model.thickness" fill="var(--accent)" />
        </svg>
      </div>
      <GridScene v-else-if="gridView==='scene'" :length="grid.productLengthMm || Math.max(1,model.cellL-grid.cellGapMm)" :width="grid.productWidthMm || Math.max(1,model.cellW-grid.cellGapMm)" :height="model.height" :grid-height="model.height" :rows="grid.rows" :cols="grid.cols" :cell-l="model.cellL" :cell-w="model.cellW" :board="model.thickness" />
      <div v-else class="space-y-5">
        <section v-for="strip in model.strips" :key="strip.name">
          <div class="mb-2 flex flex-wrap justify-between gap-2 text-sm"><h3 class="font-medium">{{ strip.name }} · {{ strip.quantity }} шт.</h3><span class="text-muted">{{ fmt(strip.length) }} × {{ fmt(strip.height) }} мм</span></div>
          <svg class="max-h-72 w-full rounded-xl bg-canvas" :viewBox="`-15 -15 ${strip.length+30} ${strip.height+30}`" role="img" :aria-label="`${strip.name}, ширина просечки ${grid.slotMm}, глубина ${model.depth} мм`">
            <polygon :points="strip.points.map(point=>point.join(',')).join(' ')" fill="var(--accent-soft)" stroke="var(--ink)" stroke-width="1.3" vector-effect="non-scaling-stroke" />
            <line v-for="position in gridCutting==='roda' ? strip.slots : []" :key="position" :x1="position" :x2="position" :y1="strip.fromTop ? model.depth : strip.height-model.depth" :y2="strip.fromTop ? model.depth+7 : strip.height-model.depth-7" stroke="var(--ink)" vector-effect="non-scaling-stroke" />
          </svg>
          <p class="mt-2 text-xs text-muted">Просечка {{ grid.slotMm }} × {{ fmt(model.depth) }} мм · центры от левого края: {{ strip.slots.map(position=>fmt(position)).join(' / ') || 'нет просечек' }}</p>
        </section>
      </div>
      <dl class="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4"><div><dt class="text-muted">Габариты решётки</dt><dd class="mt-1">{{ fmt(model.length) }} × {{ fmt(model.width) }} × {{ fmt(model.height) }} мм</dd></div><div><dt class="text-muted">Ячейка в свету</dt><dd class="mt-1">{{ fmt(model.cellL) }} × {{ fmt(model.cellW) }} мм</dd></div><div><dt class="text-muted">Количество ячеек</dt><dd class="mt-1">{{ grid.rows*grid.cols }}</dd></div><div><dt class="text-muted">Площадь полос / комплект</dt><dd class="mt-1">{{ area(model.pieceArea) }} м²</dd></div></dl>
    </template>
    <template v-else>
      <h2 class="text-base font-semibold">Раскладка полного комплекта</h2>
      <template v-if="sheet">
        <svg class="max-h-[550px] w-full rounded-xl bg-canvas p-3" :viewBox="`-30 -30 ${sheet.sheetX+60} ${sheet.sheetY+60}`" role="img" aria-label="Раскладка полос решётки на листе">
          <rect x="0" y="0" :width="sheet.sheetX" :height="sheet.sheetY" fill="var(--surface)" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
          <rect v-for="(item,index) in sheet.items" :key="index" :x="item.x+sheet.left" :y="item.y+sheet.top" :width="item.width" :height="item.height" :fill="item.name==='Продольная полоса' ? 'var(--accent-soft)' : 'var(--canvas)'" stroke="var(--accent)" stroke-width=".7" vector-effect="non-scaling-stroke" />
        </svg>
        <dl class="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4"><div><dt class="text-muted">Лист X × Y</dt><dd class="mt-1">{{ sheet.sheetX }} × {{ sheet.sheetY }} мм</dd></div><div><dt class="text-muted">Комплектов на листе</dt><dd class="mt-1">{{ sheet.kits }}</dd></div><div><dt class="text-muted">Полос на листе</dt><dd class="mt-1">{{ sheet.items.length }}</dd></div><div><dt class="text-muted">Расход / комплект</dt><dd class="mt-1 font-medium">{{ area(sheet.area) }} м²</dd></div></dl>
        <p class="text-xs text-muted">Продольные и поперечные полосы размещаются вместе полными комплектами. X — поперёк гофры, Y — вдоль. Поворот полос не используется.</p>
      </template>
      <template v-else><p class="text-sm text-muted">RODA: раскладка листа не задана. Рассчитывается площадь полос одного комплекта.</p><p class="text-lg font-medium tabular-nums">{{ area(model.pieceArea) }} м²</p><div v-for="strip in model.strips" :key="strip.name" class="flex flex-wrap justify-between gap-2 border-b border-line pb-3 text-sm"><span>{{ strip.name }} · {{ strip.quantity }} шт.</span><span>{{ area(strip.length*strip.height/1e6) }} м² / шт. · {{ area(strip.length*strip.height*strip.quantity/1e6) }} м² / комплект</span></div></template>
      <p v-if="current?.review.length" class="text-xs text-muted">Предварительный расчёт. Незаданные паспортные ограничения требуют подтверждения.</p>
    </template>
  </div>
</template>
