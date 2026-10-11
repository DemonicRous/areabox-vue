<script setup lang="ts">
import { computed } from 'vue'
import type { Geometry, SheetPlan } from '../domain/production'
const props = defineProps<{ geometry: Geometry; sheet: SheetPlan; left: number; top: number; inline: boolean }>()
const pad = computed(() => Math.max(props.sheet.sheetX, props.sheet.sheetY) * .075)
const font = computed(() => pad.value * .3)
</script>
<template>
  <div class="min-w-0 bg-canvas p-3">
    <svg class="h-60 w-full sm:h-72" :viewBox="`${-pad} ${-pad} ${sheet.sheetX+pad*2} ${sheet.sheetY+pad*2}`" role="img" aria-label="Раскладка с линиями реза, биговками и размерами листа">
      <rect :width="sheet.sheetX" :height="sheet.sheetY" fill="var(--surface)" stroke="var(--muted)" vector-effect="non-scaling-stroke" />
      <rect v-if="inline" width="8" :height="sheet.sheetY" fill="var(--muted)" fill-opacity=".3" />
      <g v-for="index in sheet.count" :key="index" :transform="`translate(${left+((index-1)%sheet.cols)*geometry.width},${top+Math.floor((index-1)/sheet.cols)*geometry.height})`">
        <polygon :points="geometry.points.map(point=>point.join(',')).join(' ')" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.2" vector-effect="non-scaling-stroke" />
        <line v-for="(fold,i) in geometry.folds" :key="i" :x1="fold[0]" :y1="fold[1]" :x2="fold[2]" :y2="fold[3]" stroke="var(--ink)" stroke-opacity=".65" stroke-dasharray="5 4" vector-effect="non-scaling-stroke" />
      </g>
      <g stroke="var(--muted)" stroke-width="1" vector-effect="non-scaling-stroke" fill="none">
        <path :d="`M0 ${-pad*.15} V${-pad*.45} H${sheet.sheetX} V${-pad*.15}`" />
        <path :d="`M${sheet.sheetX+pad*.15} 0 H${sheet.sheetX+pad*.4} V${sheet.sheetY} H${sheet.sheetX+pad*.15}`" />
      </g>
      <g fill="var(--ink)" :font-size="font" text-anchor="middle" class="tabular-nums">
        <text :x="sheet.sheetX/2" :y="-pad*.6">{{ sheet.sheetX }} мм</text>
        <text :transform="`translate(${sheet.sheetX+pad*.72},${sheet.sheetY/2}) rotate(90)`">{{ sheet.sheetY }} мм</text>
      </g>
    </svg>
    <div class="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted">
      <span class="flex items-center gap-1.5"><span class="w-5 border-t border-accent" />Рез</span>
      <span class="flex items-center gap-1.5"><span class="w-5 border-t border-dashed border-ink" />Биговка</span>
      <span v-if="inline">Припуск слева · 8 мм</span>
    </div>
  </div>
</template>
