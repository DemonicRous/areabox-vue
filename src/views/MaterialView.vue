<script setup lang="ts">
import { cardboardProfiles } from '../data/catalog'
const formatMm = (value: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)
</script>
<template>
  <h1 class="mb-5 text-lg font-semibold">Материал</h1>
  <section aria-label="Профили картона" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <article v-for="profile in cardboardProfiles" :key="profile.id" class="rounded-xl border border-line bg-surface p-5" :aria-labelledby="`profile-${profile.id}`">
      <h2 :id="`profile-${profile.id}`" class="mb-5 text-xl font-semibold text-accent">{{ profile.id }}</h2>
      <dl class="space-y-3 text-sm">
        <div class="flex items-baseline justify-between gap-4"><dt class="text-muted">Фактическая толщина</dt><dd class="shrink-0 font-medium tabular-nums">{{ formatMm(profile.actualThicknessMm) }} <span class="text-xs font-normal text-muted">мм</span></dd></div>
        <div class="flex items-baseline justify-between gap-4"><dt class="text-muted">Чертёжная толщина</dt><dd class="shrink-0 font-medium tabular-nums">{{ formatMm(profile.drawingThicknessMm) }} <span class="text-xs font-normal text-muted">мм</span></dd></div>
        <div class="flex items-baseline justify-between gap-4 border-t border-line pt-3"><dt class="text-muted">Расстояние между биговками</dt><dd class="shrink-0 font-medium tabular-nums">{{ formatMm(profile.creaseDistanceMm) }} <span class="text-xs font-normal text-muted">мм</span></dd></div>
      </dl>
    </article>
  </section>
</template>
