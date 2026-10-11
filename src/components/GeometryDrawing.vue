<script setup lang="ts">
import { computed, ref } from 'vue'
import { MagnifyingGlassPlusIcon, ArrowsPointingInIcon } from '@heroicons/vue/24/outline'
import { drawingMeasurements, type Geometry } from '../domain/production'
const props = defineProps<{ geometry: Geometry; names: string[]; review: string[] }>()
const zoom = ref(false)
const measurements = computed(() => drawingMeasurements(props.geometry))
const slot = computed(() => measurements.value.slots[0])
const pad = computed(() => Math.max(90, props.geometry.width * .10))
const font = computed(() => pad.value * .22)
const fmt = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
const panels = computed(() => {
  let x = props.geometry.flap
  return props.geometry.panels.map(width => { const segment = { start: x, end: x + width, value: width }; x += width; return segment })
})
const detailLeft = computed(() => slot.value?.topDepth ? slot.value.topLeft : slot.value?.bottomLeft ?? 0)
const detailRight = computed(() => slot.value?.topDepth ? slot.value.topRight : slot.value?.bottomRight ?? 0)
const detailYLeft = computed(() => !slot.value?.offset || slot.value.leftIsDeeper ? 130 : 100)
const detailYRight = computed(() => !slot.value?.offset || !slot.value.leftIsDeeper ? 130 : 100)
</script>
<template>
  <div class="space-y-5 p-4 sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="min-w-0 text-xs text-muted">{{ names.join(' → ') }}</p>
      <button class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-xs hover:bg-canvas" type="button" :aria-pressed="zoom" @click="zoom=!zoom">
        <ArrowsPointingInIcon v-if="zoom" class="size-4" /><MagnifyingGlassPlusIcon v-else class="size-4" />{{ zoom ? 'Вписать' : 'Увеличить' }}
      </button>
    </div>
    <p v-if="review.length" class="text-xs text-muted">Предварительная развёртка: часть ограничений маршрута требует проверки.</p>
    <div class="overflow-x-auto bg-canvas" :tabindex="zoom ? 0 : undefined" aria-label="Размерный чертёж">
      <svg class="w-full text-ink" :class="zoom ? 'min-w-[1100px]' : ''" :viewBox="`${-pad*.45} ${-pad} ${geometry.width+pad*2} ${geometry.height+pad*2}`" role="img" aria-label="Развёртка: размеры панелей сверху, соединительный клапан слева, общая длина снизу, общая высота справа. Все размеры в миллиметрах.">
        <polygon :points="geometry.points.map(point=>point.join(',')).join(' ')" fill="var(--surface)" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <g v-for="(segment,index) in panels" :key="`panel-${index}`">
          <circle :cx="(segment.start+segment.end)/2" :cy="geometry.height/2" :r="font*.8" fill="var(--accent-soft)" />
          <text :x="(segment.start+segment.end)/2" :y="geometry.height/2+font*.34" :font-size="font" text-anchor="middle" fill="var(--accent)">{{ index+1 }}</text>
        </g>
        <line v-for="(fold,index) in geometry.folds" :key="index" :x1="fold[0]" :y1="fold[1]" :x2="fold[2]" :y2="fold[3]" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" />
        <g v-for="(segment,index) in [{ start: 0, end: geometry.flap, value: geometry.flap }, ...panels]" :key="index">
          <path :d="`M${segment.start} ${-pad*.08} V${-pad*.58} M${segment.end} ${-pad*.08} V${-pad*.58} M${segment.start} ${-pad*.4} H${segment.end}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
          <path :d="`M${segment.start-pad*.03} ${-pad*.34} l${pad*.06} ${-pad*.12} M${segment.end-pad*.03} ${-pad*.34} l${pad*.06} ${-pad*.12}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
          <text :x="(segment.start+segment.end)/2" :y="-pad*.62" :font-size="font" text-anchor="middle" fill="var(--ink)">{{ fmt(segment.value) }}</text>
        </g>

        <path :d="`M0 ${geometry.height+pad*.1} V${geometry.height+pad*.62} M${geometry.width} ${geometry.height+pad*.1} V${geometry.height+pad*.62} M0 ${geometry.height+pad*.43} H${geometry.width}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
        <path :d="`M${-pad*.03} ${geometry.height+pad*.49} l${pad*.06} ${-pad*.12} M${geometry.width-pad*.03} ${geometry.height+pad*.49} l${pad*.06} ${-pad*.12}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
        <text :x="geometry.width/2" :y="geometry.height+pad*.78" :font-size="font" text-anchor="middle" fill="var(--ink)">X = {{ fmt(geometry.width) }}</text>
        <path :d="`M${geometry.width+pad*.1} 0 H${geometry.width+pad*.64} M${geometry.width+pad*.1} ${geometry.height} H${geometry.width+pad*.64} M${geometry.width+pad*.45} 0 V${geometry.height}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
        <text :transform="`translate(${geometry.width+pad*.85},${geometry.height/2}) rotate(90)`" :font-size="font" text-anchor="middle" fill="var(--ink)">Y = {{ fmt(geometry.height) }}</text>
      </svg>
    </div>
    <div class="flex flex-wrap justify-between gap-x-4 gap-y-2 text-xs text-muted">
      <div class="flex flex-wrap gap-4"><span class="flex items-center gap-2"><span class="w-5 border-t border-ink" />Рез</span><span class="flex items-center gap-2"><span class="w-5 border-t border-dashed border-accent" />Биговка</span></div>
      <span>Все размеры · мм</span>
    </div>
    <div class="grid items-start gap-6 border-t border-line pt-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section class="min-w-0" aria-label="Размеры между биговками">
        <h3 class="mb-3 text-sm font-semibold">Размеры между биговками</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs tabular-nums">
            <caption class="mb-3 text-left text-[11px] text-muted">Панели слева направо, как на чертеже · мм</caption>
            <thead><tr class="border-b border-line bg-canvas"><th scope="col" class="px-3 py-3 font-normal text-muted">Размер</th><th v-for="(_,index) in measurements.panels" :key="index" scope="col" class="px-3 py-3 text-center font-medium"><span class="mx-auto flex size-6 items-center justify-center rounded-full bg-accent-soft text-accent">{{ index+1 }}</span></th></tr></thead>
            <tbody>
              <tr class="border-b border-line"><th scope="row" class="px-3 py-3 font-normal text-muted">Ширина панели</th><td v-for="(panel,index) in measurements.panels" :key="index" class="px-3 py-3 text-center font-medium">{{ fmt(panel.width) }}</td></tr>
              <tr class="border-b border-line"><th scope="row" class="px-3 py-3 font-normal text-muted">Верхний клапан</th><td v-for="(panel,index) in measurements.panels" :key="index" class="px-3 py-3 text-center">{{ fmt(panel.top) }}</td></tr>
              <tr class="border-b border-line bg-canvas"><th scope="row" class="px-3 py-3 font-medium">Высота корпуса</th><td v-for="(panel,index) in measurements.panels" :key="index" class="px-3 py-3 text-center font-semibold">{{ fmt(panel.body) }}</td></tr>
              <tr class="border-b border-line"><th scope="row" class="px-3 py-3 font-normal text-muted">Нижний клапан</th><td v-for="(panel,index) in measurements.panels" :key="index" class="px-3 py-3 text-center">{{ fmt(panel.bottom) }}</td></tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-muted">Соединительный клапан <strong class="font-medium text-ink">{{ geometry.flap }} мм</strong><span v-if="geometry.count>1"> · {{ geometry.count }} заготовки</span></p>
      </section>
      <section v-if="slot" aria-label="Размеры просечки">
        <h3 class="mb-3 text-sm font-semibold">Просечка</h3>
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
      </section>
    </div>
  </div>
</template>
