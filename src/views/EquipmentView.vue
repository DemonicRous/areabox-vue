<script setup lang="ts">
import { fosberTemplate } from '../data/equipment'
</script>
<template>
  <h1 class="mb-5 text-lg font-semibold">Оборудование</h1>
  <section class="overflow-hidden rounded-xl border border-line bg-surface" aria-labelledby="fosber-title">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
      <div><h2 id="fosber-title" class="text-base font-semibold">Fosber</h2><p class="mt-1 text-xs text-muted">Гофроагрегат</p></div>
      <span class="rounded-md bg-canvas px-2.5 py-1.5 text-xs text-muted">Шаблон параметров</span>
    </header>
    <div class="grid lg:grid-cols-2">
      <section v-for="group in fosberTemplate" :key="group.id" class="border-b border-line p-4 sm:p-5" :aria-labelledby="`fosber-${group.id}`">
        <h3 :id="`fosber-${group.id}`" class="mb-4 text-sm font-semibold">{{ group.title }}</h3>
        <dl class="space-y-4">
          <div v-for="parameter in group.parameters" :key="parameter.id" class="grid items-baseline gap-x-4 gap-y-1 text-sm" :class="parameter.id === 'profiles' ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_auto]'">
            <dt class="text-muted">{{ parameter.label }}<span v-if="parameter.unit" class="ml-1 text-xs">({{ parameter.unit }})</span><span v-if="parameter.format === 'range'" class="mt-1 block text-xs">мин. / макс.</span></dt>
            <dd class="font-medium tabular-nums" :aria-label="parameter.value ? undefined : 'Не задано'">{{ parameter.value ?? (parameter.format === 'range' ? '— / —' : '—') }}</dd>
          </div>
        </dl>
      </section>
    </div>
    <p class="px-4 py-3 text-xs text-muted sm:px-5">Прочерк — параметр не задан.</p>
  </section>
</template>
