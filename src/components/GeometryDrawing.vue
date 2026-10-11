<script setup lang="ts">
import { computed } from 'vue'
import type { Geometry } from '../domain/production'
const props = defineProps<{ geometry: Geometry; names: string[]; review: string[] }>()
const pad = computed(() => Math.max(75, props.geometry.width * .075))
const font = computed(() => pad.value * .25)
const verticalFolds = computed(() => props.geometry.folds.filter(fold => fold[0] === fold[2]))
const levels = computed(() => [verticalFolds.value[0]?.[1] ?? 0, verticalFolds.value[0]?.[3] ?? props.geometry.height])
const slotDepth = computed(() => levels.value[0]! > 0
  ? Math.max(levels.value[0]!, verticalFolds.value[1]?.[1] ?? 0)
  : props.geometry.height - Math.min(levels.value[1]!, verticalFolds.value[1]?.[3] ?? props.geometry.height))
const panels = computed(() => {
  let x = props.geometry.flap
  return props.geometry.panels.map(width => { const segment = { start: x, end: x + width, value: width }; x += width; return segment })
})
const heights = computed(() => [0, ...levels.value, props.geometry.height].slice(0, -1).map((start, index) => {
  const end = [0, ...levels.value, props.geometry.height][index + 1]!
  return { start: start!, end, value: end - start! }
}).filter(segment => segment.value > 0))
</script>
<template>
  <div class="space-y-4 p-4 sm:p-5">
    <p class="text-xs text-muted">{{ names.join(' → ') }}</p>
    <p v-if="review.length" class="text-xs text-muted">Предварительная развёртка: маршрут содержит непроверенные ограничения.</p>
    <div class="overflow-x-auto rounded-md bg-canvas" tabindex="0" aria-label="Размерный чертёж; на узком экране можно прокрутить по горизонтали">
      <svg class="min-w-[720px] w-full text-ink" :viewBox="`${-pad} ${-pad} ${geometry.width+pad*3} ${geometry.height+pad*2}`" role="img" aria-label="Развёртка с размерами панелей, корпуса, клапанов и общими габаритами в миллиметрах">
        <polygon :points="geometry.points.map(point=>point.join(',')).join(' ')" fill="var(--surface)" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
        <line v-for="(fold,index) in geometry.folds" :key="index" :x1="fold[0]" :y1="fold[1]" :x2="fold[2]" :y2="fold[3]" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" />
        <g v-for="(segment,index) in panels" :key="index">
          <path :d="`M${segment.start} ${-pad*.12} V${-pad*.45} H${segment.end} V${-pad*.12}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
          <text :x="(segment.start+segment.end)/2" :y="-pad*.58" :font-size="font" text-anchor="middle" fill="var(--ink)">{{ segment.value }}</text>
        </g>
        <g v-for="(segment,index) in heights" :key="index">
          <path :d="`M${geometry.width+pad*.12} ${segment.start} H${geometry.width+pad*.4} V${segment.end} H${geometry.width+pad*.12}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
          <text :transform="`translate(${geometry.width+pad*.66},${(segment.start+segment.end)/2}) rotate(90)`" :font-size="font" text-anchor="middle" fill="var(--ink)">{{ segment.value }}</text>
        </g>
        <path :d="`M0 ${geometry.height+pad*.15} V${geometry.height+pad*.5} H${geometry.width} V${geometry.height+pad*.15}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
        <text :x="geometry.width/2" :y="geometry.height+pad*.82" :font-size="font" text-anchor="middle" fill="var(--ink)">X · {{ geometry.width }} мм</text>
        <path :d="`M${geometry.width+pad*.95} 0 H${geometry.width+pad*1.25} V${geometry.height} H${geometry.width+pad*.95}`" fill="none" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
        <text :transform="`translate(${geometry.width+pad*1.56},${geometry.height/2}) rotate(90)`" :font-size="font" text-anchor="middle" fill="var(--ink)">Y · {{ geometry.height }} мм</text>
        <path :d="`M0 ${levels[0]!+geometry.body*.55} H${geometry.flap}`" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
        <text :x="-pad*.2" :y="levels[0]!+geometry.body*.55" :font-size="font" text-anchor="end" fill="var(--ink)">{{ geometry.flap }}</text>
      </svg>
    </div>
    <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_280px]">
      <div class="space-y-3 text-xs text-muted">
        <p class="font-medium text-ink">Все размеры в миллиметрах</p>
        <p>Размеры панелей и корпуса указаны между биговками.</p>
        <div class="flex flex-wrap gap-x-5 gap-y-2 tabular-nums"><span>Клапан {{ geometry.flap }} мм</span><span>Просечка {{ geometry.slot }} × {{ slotDepth }} мм</span><span v-if="geometry.count>1">{{ geometry.count }} заготовки</span></div>
        <div class="flex flex-wrap gap-4"><span class="flex items-center gap-2"><span class="w-5 border-t border-ink" />Рез</span><span class="flex items-center gap-2"><span class="w-5 border-t border-dashed border-accent" />Биговка</span></div>
      </div>
      <div v-if="panels.length>1" class="bg-canvas p-3">
        <p class="text-xs font-medium">Просечка · схема размеров</p>
        <svg class="mt-2 h-40 w-full" viewBox="0 0 260 170" role="img" :aria-label="`Ширина просечки ${geometry.slot} мм, глубина ${slotDepth} мм`">
          <path d="M25 25 H90 V125 H125 V25 H175" fill="none" stroke="var(--ink)" stroke-width="1.5" />
          <path d="M90 20 V10 H125 V20 M185 25 H200 V125 H135" fill="none" stroke="var(--muted)" />
          <text x="108" y="165" text-anchor="middle" fill="var(--ink)" font-size="12">Ширина {{ geometry.slot }} мм</text>
          <text x="212" y="80" fill="var(--ink)" font-size="12" :transform="'rotate(90 212 80)'" text-anchor="middle">Глубина {{ slotDepth }} мм</text>
          <line x1="25" y1="125" x2="175" y2="125" stroke="var(--accent)" stroke-dasharray="5 4" />
        </svg>
      </div>
    </div>
  </div>
</template>
