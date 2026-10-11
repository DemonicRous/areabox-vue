<script setup lang="ts">
import { computed, watch } from 'vue'
import { ArrowRightIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { useBoxDraft } from '../composables/useBoxDraft'
import { productionSelection as selection, confirmedProduction, savedLayout } from '../composables/useProductionRoute'
import RouteLayout from './RouteLayout.vue'
import { findMachine, parameter, evaluateRoute, finishingLines, productionRoutes, technology, type ProductionRoute } from '../domain/production'
const emit = defineEmits<{ drawing: [] }>()
const draft = useBoxDraft()
const routes = computed(() => productionRoutes(draft))
const available = computed(() => routes.value.filter(route => !route.blocked.length))
const unavailable = computed(() => routes.value.filter(route => route.blocked.length))
const current = computed(() => selection.cutting && routes.value.some(route => route.line.id === selection.cutting)
  ? evaluateRoute(draft, selection.cutting, selection.finishing) : null)
const connections = computed(() => current.value ? finishingLines(draft, current.value.line.id).map(line => ({
  line, route: evaluateRoute(draft, current.value!.line.id, line.id),
})) : [])
const geo = computed(() => current.value?.geometry)
const sheet = computed(() => savedLayout.value ?? current.value?.sheet)
const previewLeft = computed(() => current.value ? technology(current.value.line.id) === 'inline' ? 8 : Math.max(technology(current.value.line.id) === 'plotter' ? 20 : 0, ...[current.value.line, findMachine(current.value.selection.printing)].filter(Boolean).map(line => Number(parameter(line!, 'marginLeft') ?? 0))) : 0)
const previewTop = computed(() => current.value ? Math.max(technology(current.value.line.id) === 'plotter' ? 20 : 0, ...[current.value.line, findMachine(current.value.selection.printing)].filter(Boolean).map(line => Number(parameter(line!, 'marginTop') ?? 0))) : 0)
const labels = { inline: 'Инлайн', flatbed: 'Плоская высечка', rotary: 'Ротационная высечка', plotter: 'Плоттер' }
function choose(route: ProductionRoute) {
  if (selection.printing === route.selection.printing && selection.cutting === route.selection.cutting && selection.finishing === route.selection.finishing) return
  Object.assign(selection, route.selection)
  confirmedProduction.value = null
}
watch(draft, () => {
  confirmedProduction.value = null
  if (!current.value || current.value.blocked.length) Object.assign(selection, { printing: '', cutting: '', finishing: '' })
  else Object.assign(selection, current.value.selection)
}, { deep: true })
function confirm() {
  const route = current.value
  if (!route || route.blocked.length) return
  if (!confirmedProduction.value) confirmedProduction.value = { names: route.names, geometry: route.geometry, review: route.review }
  if (route.geometry) emit('drawing')
}
</script>
<template>
  <div class="p-4 sm:p-6">
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-base font-semibold">Выберите маршрут</h2>
      <span class="text-xs text-muted" aria-live="polite">Доступно: {{ available.length }} из {{ routes.length }}</span>
    </div>
    <p class="mb-4 text-xs text-muted">Печать, вырезка и соединение проверяются вместе.</p>
    <div v-if="available.length" class="divide-y divide-line border-y border-line" role="group" aria-label="Доступные производственные маршруты">
      <button v-for="route in available" :key="route.line.id" type="button" :aria-pressed="selection.cutting === route.line.id"
        class="flex w-full cursor-pointer gap-3 px-2 py-4 text-left transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent"
        :class="selection.cutting === route.line.id ? 'bg-accent-soft' : ''" @click="choose(route)">
        <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border" :class="selection.cutting === route.line.id ? 'border-accent bg-accent text-surface' : 'border-muted'">
          <CheckIcon v-if="selection.cutting === route.line.id" class="size-3.5" aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span class="text-sm font-semibold">{{ route.line.name }} <span class="ml-1 text-xs font-normal text-muted">{{ labels[technology(route.line.id)] }}</span></span>
            <span class="text-xs text-muted tabular-nums">{{ route.sheet ? `${route.sheet.count} мест на листе` : 'Геометрия не подтверждена' }}</span>
          </span>
          <span class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
            <template v-for="(name, index) in (selection.cutting === route.line.id && current ? current.names : route.names)" :key="name">
              <ArrowRightIcon v-if="index" class="size-3 shrink-0" aria-hidden="true" /><span>{{ name }}</span>
            </template>
          </span>
          <span v-if="route.review.length" class="mt-2 block text-[11px] text-muted">Предварительно · есть незаданные ограничения</span>
        </span>
      </button>
    </div>
    <p v-else class="border-y border-line py-6 text-sm" role="status">Подходящих маршрутов нет. Ниже указаны ограничения линий.</p>
    <section v-if="current" class="mt-6 space-y-5" aria-label="Выбранный маршрут">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-sm font-semibold">{{ current.line.name }} · настройка маршрута</h3>
        <span v-if="technology(current.line.id) === 'inline'" class="text-xs text-muted">Склейка в составе линии</span>
      </div>
      <fieldset v-if="connections.length" class="min-w-0">
        <legend class="mb-2 text-xs text-muted">Соединение короба</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <label v-for="option in connections" :key="option.line.id" class="flex min-h-11 items-start gap-2 rounded-md border px-3 py-3 text-sm"
            :class="option.route.blocked.length ? 'border-line text-muted opacity-60' : selection.finishing === option.line.id ? 'cursor-pointer border-accent bg-accent-soft' : 'cursor-pointer border-line hover:bg-canvas'">
            <input type="radio" name="route-connection" :value="option.line.id" :checked="selection.finishing === option.line.id" :disabled="!!option.route.blocked.length"
              class="mt-0.5 size-4 shrink-0 accent-accent" @change="choose(option.route)" />
            <span class="min-w-0">{{ option.line.name }}<span v-if="option.route.blocked.length" class="mt-1 block text-[11px]">{{ option.route.blocked.join(' · ') }}</span></span>
          </label>
        </div>
      </fieldset>
      <div v-if="geo && sheet" class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
        <RouteLayout :geometry="geo" :sheet="sheet" :left="previewLeft" :top="previewTop" :inline="technology(current.line.id) === 'inline'" />
        <dl class="grid grid-cols-2 gap-x-3 gap-y-3 text-xs sm:grid-cols-1">
          <div><dt class="text-muted">Лист, мм</dt><dd class="mt-1 text-sm font-medium tabular-nums">{{ sheet.sheetX }} × {{ sheet.sheetY }}</dd></div>
          <div><dt class="text-muted">Одна развёртка, мм</dt><dd class="mt-1 font-medium tabular-nums">{{ geo.width }} × {{ geo.height }}</dd></div>
          <div><dt class="text-muted">Раскладка</dt><dd class="mt-1 font-medium">{{ sheet.cols }} × {{ sheet.rows }} · {{ sheet.count }} мест</dd></div>
          <div><dt class="text-muted">Просечка / клапан, мм</dt><dd class="mt-1 font-medium">{{ geo.slot }} / {{ geo.flap }}</dd></div>
        </dl>
      </div>
      <ul v-if="current.blocked.length" class="space-y-1 text-xs text-danger" role="alert"><li v-for="reason in current.blocked" :key="reason">{{ reason }}</li></ul>
      <details v-if="current.review.length" class="text-xs text-muted">
        <summary class="min-h-8 cursor-pointer">Требуют проверки: {{ current.review.length }}</summary>
        <ul class="mt-2 space-y-2"><li v-for="reason in current.review" :key="reason">{{ reason }}</li></ul>
      </details>
      <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button type="button" :disabled="!!current.blocked.length" class="min-h-11 w-full cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" @click="confirm">
          {{ geo ? 'Построить развёртку' : 'Сохранить предварительный маршрут' }}
        </button>
        <span v-if="current.review.length" class="text-xs text-muted">Маршрут предварительный</span>
      </div>
    </section>
    <p v-else-if="available.length" class="py-6 text-center text-xs text-muted">Выберите цепочку, чтобы увидеть раскладку и построить развёртку.</p>
    <section v-if="unavailable.length" class="mt-4 border-t border-line pt-3" aria-label="Недоступные маршруты">
      <h3 class="py-3 text-xs text-muted">Недоступные маршруты · {{ unavailable.length }}</h3>
      <div v-for="route in unavailable" :key="route.line.id" class="border-t border-line py-3">
        <p class="text-sm font-medium">{{ route.line.name }} <span class="ml-1 text-xs font-normal text-muted">{{ labels[technology(route.line.id)] }}</span></p>
        <ul class="mt-2 space-y-1 text-xs text-muted"><li v-for="reason in route.blocked" :key="reason">{{ reason }}</li></ul>
      </div>
    </section>
  </div>
</template>
