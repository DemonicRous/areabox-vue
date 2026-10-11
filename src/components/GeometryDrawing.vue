<script setup lang="ts">
import type { Geometry } from '../domain/production'
defineProps<{ geometry: Geometry; names: string[]; review: string[] }>()
</script>
<template>
  <div class="space-y-4 p-4 sm:p-5">
    <p class="text-xs text-muted">{{ names.join(' → ') }}</p>
    <p v-if="review.length" class="text-xs text-muted">Предварительная развёртка: маршрут содержит непроверенные ограничения.</p>
    <svg class="w-full text-ink" :viewBox="`-30 -30 ${geometry.width+60} ${geometry.height+60}`" role="img" aria-label="Развёртка по выбранному производственному маршруту">
      <polygon :points="geometry.points.map(point=>point.join(',')).join(' ')" fill="var(--canvas)" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      <line v-for="(fold,index) in geometry.folds" :key="index" :x1="fold[0]" :y1="fold[1]" :x2="fold[2]" :y2="fold[3]" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" />
    </svg>
    <div class="flex flex-wrap gap-x-5 gap-y-2 text-xs tabular-nums text-muted"><span>X {{ geometry.width }} × Y {{ geometry.height }} мм</span><span>Просечка {{ geometry.slot }} мм</span><span>Клапан {{ geometry.flap }} мм</span><span v-if="geometry.count>1">{{ geometry.count }} заготовки</span></div>
    <p class="text-xs text-muted">Сплошная линия — рез, пунктир — биговка.</p>
  </div>
</template>
