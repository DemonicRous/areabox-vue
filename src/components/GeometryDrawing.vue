<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MagnifyingGlassPlusIcon, ArrowsPointingInIcon, ArrowsRightLeftIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { drawingMeasurements, type Geometry } from '../domain/production'
const props = defineProps<{ geometry: Geometry; names: string[]; review: string[] }>()
const zoom = ref(false)
const dimensions = ref(true)
const activePart = ref(0)
const selectedPanel = ref(0)
const panelDetailsOpen = ref(false)
const panelDetails = ref<HTMLDetailsElement | null>(null)
function selectPanel(index: number) {
  selectedPanel.value = index
  panelDetailsOpen.value = true
  if (panelDetails.value) panelDetails.value.open = true
}
const geometry = computed(()=>props.geometry.parts?.[activePart.value]?.geometry ?? props.geometry)
watch(()=>props.geometry,()=>{ activePart.value=0; zoom.value=false })
const measurements = computed(() => drawingMeasurements(geometry.value))
watch(geometry, () => { selectedPanel.value = 0 })
const panelDimensions = computed(() => measurements.value.panels[selectedPanel.value])
const slot = computed(() => measurements.value.slots[0])
const pad = computed(() => Math.max(90, geometry.value.width * .10))
const font = computed(() => pad.value * .19)
const fmt = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
const panels = computed(() => {
  let x = geometry.value.flap
  return geometry.value.panels.map(width => { const segment = { start: x, end: x + width, value: width }; x += width; return segment })
})
const detailLeft = computed(() => slot.value?.topDepth ? slot.value.topLeft : slot.value?.bottomLeft ?? 0)
const detailRight = computed(() => slot.value?.topDepth ? slot.value.topRight : slot.value?.bottomRight ?? 0)
const detailYLeft = computed(() => !slot.value?.offset || slot.value.leftIsDeeper ? 130 : 100)
const detailYRight = computed(() => !slot.value?.offset || !slot.value.leftIsDeeper ? 130 : 100)
</script>
<template>
  <div class="drawing-workspace space-y-4 p-4 sm:p-5">
    <div v-if="props.geometry.parts" class="flex flex-wrap items-center gap-2" role="group" aria-label="Изделие на чертеже">
      <button v-for="(part,index) in props.geometry.parts" :key="part.name" type="button" :aria-pressed="activePart===index" class="min-h-11 cursor-pointer rounded-md px-3 text-sm" :class="activePart===index ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-canvas'" @click="activePart=index; zoom=false">{{ part.name }} · {{ part.quantity }} шт.</button>
    </div>
    <p v-else-if="geometry.count===2" class="text-xs text-muted">Одна половина · 2 шт. на короб</p>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0" :title="names.join(' → ')"><span class="text-sm font-semibold tabular-nums">{{ fmt(geometry.width) }} × {{ fmt(geometry.height) }} <span class="font-normal text-muted">мм</span></span><span v-if="review.length" class="ml-3 text-xs text-muted">Предварительно</span></div>
      <div class="flex items-center gap-1 rounded-lg bg-canvas p-1"><button type="button" :aria-pressed="dimensions" class="drawing-control flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-xs" :class="dimensions ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'" @click="dimensions=!dimensions"><ArrowsRightLeftIcon class="size-4" />Размеры</button>
      <button class="drawing-control flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-xs text-muted hover:text-ink" type="button" :aria-pressed="zoom" @click="zoom=!zoom">
        <ArrowsPointingInIcon v-if="zoom" class="size-4" /><MagnifyingGlassPlusIcon v-else class="size-4" />{{ zoom ? 'Вписать' : 'Увеличить' }}
      </button>
    </div>
    </div>

    <div class="drawing-canvas overflow-x-auto rounded-xl bg-canvas px-2 py-4 sm:px-4 sm:py-6" :tabindex="zoom ? 0 : undefined" aria-label="Размерный чертёж">
      <svg class="w-full text-ink" :class="zoom ? 'min-w-[1100px]' : ''" :viewBox="`${-pad*.45} ${-pad} ${geometry.width+pad*2} ${geometry.height+pad*2}`" role="group" aria-label="Развёртка. Нажмите на панель для просмотра её параметров. Все размеры в миллиметрах.">
        <polygon :points="geometry.points.map(point=>point.join(',')).join(' ')" fill="var(--surface)" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <g v-for="(segment,index) in (panelDetailsOpen ? panels : [])" :key="`panel-${index}`">
          <circle :cx="(segment.start+segment.end)/2" :cy="geometry.height/2" :r="font*.8" fill="var(--accent-soft)" />
          <text :x="(segment.start+segment.end)/2" :y="geometry.height/2+font*.34" :font-size="font" text-anchor="middle" fill="var(--accent)">{{ index+1 }}</text>
        </g>
        <rect v-if="panelDetailsOpen && panels[selectedPanel]" :x="panels[selectedPanel]!.start" :y="geometry.folds.filter(fold=>fold[0]===fold[2])[selectedPanel]?.[1] ?? 0" :width="panels[selectedPanel]!.value" :height="panelDimensions?.body ?? geometry.body" fill="var(--accent)" opacity=".12" pointer-events="none" />
        <line v-for="(fold,index) in geometry.folds" :key="index" :x1="fold[0]" :y1="fold[1]" :x2="fold[2]" :y2="fold[3]" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" />
        <g v-if="dimensions">
        <g v-for="(segment,index) in [{ start: 0, end: geometry.flap, value: geometry.flap }, ...panels]" :key="index">
          <path :d="`M${segment.start} ${-pad*.08} V${-pad*.58} M${segment.end} ${-pad*.08} V${-pad*.58} M${segment.start} ${-pad*.4} H${segment.end}`" fill="none" stroke="var(--muted)" stroke-width=".8" vector-effect="non-scaling-stroke" />
          <path :d="`M${segment.start-pad*.03} ${-pad*.34} l${pad*.06} ${-pad*.12} M${segment.end-pad*.03} ${-pad*.34} l${pad*.06} ${-pad*.12}`" fill="none" stroke="var(--muted)" stroke-width=".8" vector-effect="non-scaling-stroke" />
          <text :x="(segment.start+segment.end)/2" :y="-pad*.62" :font-size="font" text-anchor="middle" fill="var(--ink)" class="dimension-label">{{ fmt(segment.value) }}</text>
        </g>

        <path :d="`M0 ${geometry.height+pad*.1} V${geometry.height+pad*.62} M${geometry.width} ${geometry.height+pad*.1} V${geometry.height+pad*.62} M0 ${geometry.height+pad*.43} H${geometry.width}`" fill="none" stroke="var(--muted)" stroke-width=".8" vector-effect="non-scaling-stroke" />
        <path :d="`M${-pad*.03} ${geometry.height+pad*.49} l${pad*.06} ${-pad*.12} M${geometry.width-pad*.03} ${geometry.height+pad*.49} l${pad*.06} ${-pad*.12}`" fill="none" stroke="var(--muted)" stroke-width=".8" vector-effect="non-scaling-stroke" />
        <text :x="geometry.width/2" :y="geometry.height+pad*.78" :font-size="font" text-anchor="middle" fill="var(--ink)">X · {{ fmt(geometry.width) }}</text>
        <path :d="`M${geometry.width+pad*.1} 0 H${geometry.width+pad*.64} M${geometry.width+pad*.1} ${geometry.height} H${geometry.width+pad*.64} M${geometry.width+pad*.45} 0 V${geometry.height}`" fill="none" stroke="var(--muted)" stroke-width=".8" vector-effect="non-scaling-stroke" />
        <text :transform="`translate(${geometry.width+pad*.85},${geometry.height/2}) rotate(90)`" :font-size="font" text-anchor="middle" fill="var(--ink)">Y · {{ fmt(geometry.height) }}</text>
        </g>
        <rect v-for="(segment,index) in panels" :key="`select-${index}`" :x="segment.start" :y="geometry.panelEdges?.[index]?.[0] ?? 0" :width="segment.value" :height="(geometry.panelEdges?.[index]?.[1] ?? geometry.height)-(geometry.panelEdges?.[index]?.[0] ?? 0)" fill="transparent" class="panel-hit" tabindex="0" role="button" :aria-label="`Показать параметры панели ${index+1}`" :aria-pressed="panelDetailsOpen && selectedPanel===index" @click="selectPanel(index)" @keydown.enter.prevent="selectPanel(index)" @keydown.space.prevent="selectPanel(index)" />
      </svg>
    </div>
    <div class="flex flex-wrap justify-between gap-x-4 gap-y-2 text-xs text-muted">
      <div class="flex flex-wrap gap-4"><span class="flex items-center gap-2"><span class="w-5 border-t border-ink" />Рез</span><span class="flex items-center gap-2"><span class="w-5 border-t border-dashed border-accent" />Биговка</span></div>
      <span>Все размеры · мм</span>
    </div>
    <div class="divide-y divide-line border-t border-line">
      <details ref="panelDetails" class="min-w-0 py-2" @toggle="panelDetailsOpen=($event.target as HTMLDetailsElement).open">
        <summary class="drawing-summary flex min-h-11 cursor-pointer items-center justify-between gap-3 py-3 text-sm font-medium"><span>Размеры панелей</span><ChevronDownIcon class="size-4 shrink-0 text-muted" /></summary>
        <div class="flex flex-wrap gap-2 pb-4" role="group" aria-label="Выбор панели">
          <button v-for="(_,index) in measurements.panels" :key="index" type="button" :aria-pressed="selectedPanel===index" class="drawing-control min-h-11 cursor-pointer rounded-lg px-4 text-sm" :class="selectedPanel===index ? 'bg-accent-soft text-accent' : 'bg-canvas text-muted hover:text-ink'" @click="selectedPanel=index">Панель {{ index+1 }}</button>
        </div>
        <dl v-if="panelDimensions" class="grid grid-cols-2 gap-x-6 gap-y-4 pb-3 sm:grid-cols-4">
          <div v-for="item in [{ label:'Ширина',value:panelDimensions.width },{ label:'Высота',value:panelDimensions.body },{ label:'Верхний клапан',value:panelDimensions.top },{ label:'Нижний клапан',value:panelDimensions.bottom }]" :key="item.label"><dt class="text-xs text-muted">{{ item.label }}</dt><dd class="mt-1 text-base font-medium tabular-nums">{{ fmt(item.value) }} <span class="text-xs font-normal text-muted">мм</span></dd></div>
        </dl>
        <p class="mt-3 text-xs text-muted">Соединительный клапан <strong class="font-medium text-ink">{{ geometry.flap }} мм</strong><span v-if="geometry.count>1"> · {{ geometry.count }} заготовки</span></p>
      </details>
      <details v-if="slot" class="py-2">
        <summary class="drawing-summary flex min-h-11 cursor-pointer items-center justify-between gap-3 py-3 text-sm font-medium"><span>Просечка <span class="ml-2 font-normal text-muted">{{ fmt(slot.width) }} мм<span v-if="slot.offset"> · перепад {{ fmt(slot.offset) }} мм</span></span></span><ChevronDownIcon class="size-4 shrink-0 text-muted" /></summary><div class="max-w-md pb-3">
        <div class="bg-canvas px-3 py-2">
          <svg class="h-44 w-full" viewBox="0 0 300 170" role="img" :aria-label="`Ширина ${slot.width} мм. Перепад биговок ${slot.offset} мм.`">
            <path d="M110 35 V130 H145 V35" fill="none" stroke="var(--ink)" stroke-width="1.5" />
            <path d="M25 35 Q35 29 45 35 T65 35 T85 35 T105 35 L110 35 M145 35 Q154 29 163 35 T181 35 T199 35" fill="none" stroke="var(--muted)" stroke-width="1.5" />
            <line x1="25" :y1="detailYLeft" x2="110" :y2="detailYLeft" stroke="var(--accent)" stroke-dasharray="5 4" />
            <line x1="145" :y1="detailYRight" x2="200" :y2="detailYRight" stroke="var(--accent)" stroke-dasharray="5 4" />
            <path d="M110 30 V12 H145 V30" fill="none" stroke="var(--muted)" />
            <text x="127" y="165" text-anchor="middle" fill="var(--ink)" font-size="13">Ширина {{ fmt(slot.width) }} мм</text>
            <g v-if="slot.offset">
              <path d="M210 100 H225 V130 H210" fill="none" stroke="var(--muted)" />
              <text x="234" y="119" fill="var(--ink)" font-size="13">{{ fmt(slot.offset) }}</text>
            </g>
      </svg>
        </div>
        <dl class="mt-3 space-y-2 text-xs tabular-nums">
          <div class="flex justify-between gap-3"><dt class="text-muted">До левой биговки</dt><dd>{{ fmt(detailLeft) }} мм</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">До правой биговки</dt><dd>{{ fmt(detailRight) }} мм</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">Глубина реза от длинного клапана</dt><dd>{{ fmt(slot.topDepth || slot.bottomDepth) }} мм</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-muted">Перепад биговок</dt><dd>{{ fmt(slot.offset) }} мм</dd></div>
        </dl>
        <p class="mt-3 text-[11px] text-muted">{{ slot.topDepth ? 'Верхняя просечка между панелями 1 и 2.' : 'Нижняя просечка между панелями 1 и 2.' }} Схема с увеличенным перепадом для наглядности.</p>
        </div>
      </details>
    </div>
  </div>
</template>
<style scoped>
.panel-hit { cursor: pointer; }
.panel-hit:hover { fill: var(--accent); fill-opacity: .06; }
.panel-hit:focus-visible { outline: none; stroke: var(--accent); stroke-width: 2; vector-effect: non-scaling-stroke; }
.drawing-control { transition: color 160ms ease, background-color 160ms ease; }
.drawing-control:focus-visible, .drawing-summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.dimension-label { font-variant-numeric: tabular-nums; }
.drawing-summary { list-style: none; }
.drawing-summary::-webkit-details-marker { display: none; }
.drawing-summary:hover { color: var(--accent); }
.drawing-summary svg { transition: transform 180ms ease; }
details[open] > .drawing-summary svg { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) { .drawing-control, .drawing-summary svg { transition: none; } }
</style>
