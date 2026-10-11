<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { machines } from '../data/machines'
const categories = [
  { id: 'gridCutting', title: 'Высечка решёток', count: 1 },
  { id: 'gridAssembly', title: 'Сборка решёток', count: 2 },
  { id: 'corrugator', title: 'Гофроагрегат', count: 1 },
  { id: 'inline', title: 'Инлайн', count: 2 },
  { id: 'printing', title: 'Печать', count: 2 },
  { id: 'flatbed', title: 'Плоская высечка', count: 2 },
  { id: 'rotary', title: 'Ротационная высечка', count: 1 },
  { id: 'plotter', title: 'Плоттер', count: 1 },
  { id: 'stitching', title: 'Сшивка', count: 2 },
  { id: 'folderGluer', title: 'Фальцесклейка', count: 3 },
  { id: 'laminator', title: 'Ламинатор', count: 1 },
] as const
const opened = ref<string | null>('corrugator')
function toggle(id: string) { opened.value = opened.value === id ? null : id }
</script>
<template>
  <h1 class="mb-5 text-lg font-semibold">Оборудование</h1>
  <div class="space-y-3">
    <section v-for="category in categories" :key="category.id" class="overflow-hidden rounded-xl border border-line bg-surface">
      <h2>
        <button type="button" class="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-canvas sm:px-5" :id="`category-${category.id}`" :aria-expanded="opened === category.id" :aria-controls="`panel-${category.id}`" @click="toggle(category.id)">
          <span>{{ category.title }}</span><span class="text-xs font-normal text-muted">{{ category.count }}</span>
          <ChevronDownIcon class="ml-auto size-4 shrink-0 text-muted transition-transform duration-300 ease-out motion-reduce:transition-none" :class="{ 'rotate-180': opened === category.id }" aria-hidden="true" />
        </button>
      </h2>
      <div :id="`panel-${category.id}`" role="region" :aria-labelledby="`category-${category.id}`" :aria-hidden="opened !== category.id" :inert="opened !== category.id" class="grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none" :class="opened === category.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'">
        <div class="min-h-0 overflow-hidden">
          <div class="border-t border-line p-3 sm:p-4">
        <div v-if="machines[category.id]?.length" class="space-y-4">
  <section v-for="machine in machines[category.id]" :key="machine.id" class="overflow-hidden rounded-xl border border-line bg-surface" :aria-labelledby="`${machine.id}-title`">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
      <h3 :id="`${machine.id}-title`" class="text-base font-semibold">{{ machine.name }}</h3>
      <span class="rounded-md bg-canvas px-2.5 py-1.5 text-xs text-muted">Шаблон параметров</span>
    </header>
    <div class="grid lg:grid-cols-2">
      <section v-for="group in machine.groups" :key="group.id" class="border-b border-line p-4 sm:p-5" :class="{ 'lg:col-span-2': group.id === 'routing' }" :aria-labelledby="`${machine.id}-${group.id}`">
        <h4 :id="`${machine.id}-${group.id}`" class="mb-4 text-sm font-semibold">{{ group.title }}</h4>
        <dl class="space-y-4">
          <div v-for="parameter in group.parameters" :key="parameter.id" class="grid items-baseline gap-x-4 gap-y-1 text-sm" :class="['profiles', 'designs', 'fluteDirection', 'cuttingEquipment'].includes(parameter.id) ? 'grid-cols-1' : ['printSide', 'dieCutting'].includes(parameter.id) ? 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'">
            <dt class="text-muted">{{ parameter.label }}<span v-if="parameter.unit" class="ml-1 text-xs">({{ parameter.unit }})</span><span v-if="parameter.format === 'range'" class="mt-1 block text-xs">мин. / макс.</span></dt>
            <dd class="font-medium tabular-nums" :aria-label="parameter.value ? undefined : 'Не задано'">{{ parameter.value ?? (parameter.format === 'range' ? '— / —' : '—') }}</dd>
          </div>
        </dl>
      </section>
    </div>
    <p class="px-4 py-3 text-xs text-muted sm:px-5">Прочерк — параметр не задан.</p>
  </section>
        </div>
        <p v-else class="px-1 py-4 text-sm text-muted">Линии ещё не добавлены.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
