<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoxDraftForm from '../components/BoxDraftForm.vue'
import AppIcon from '../components/AppIcon.vue'
import { useBoxDraft } from '../composables/useBoxDraft'
const route = useRoute()
const router = useRouter()
const draft = useBoxDraft()
const views = [
  { id: 'drawing', title: 'Чертёж', icon: 'drawing', empty: 'Расчётный чертёж ещё не подключён' },
  { id: 'layout', title: 'Раскладка', icon: 'layout', empty: 'Расчёт раскладки ещё не подключён' },
  { id: 'route', title: 'Маршрут', icon: 'route', empty: 'Подбор оборудования ещё не подключён' },
] as const
const selected = computed(() => views.find(view => view.id === route.query.view) ?? views[0])
function changeView(id: string) { router.replace({ path: '/', query: { ...route.query, view: id === 'drawing' ? undefined : id } }) }
</script>
<template>
  <div class="mb-5 flex items-center justify-between gap-4"><h1 class="text-lg font-semibold">Короб</h1><span class="text-xs text-muted">FEFCO {{ draft.design }} · {{ draft.profile }}</span></div>
  <div class="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
    <BoxDraftForm />
    <section class="min-w-0 overflow-hidden rounded-xl border border-line bg-surface" aria-label="Результат">
      <div class="flex flex-wrap items-center gap-2 border-b border-line px-2 py-2 sm:px-3">
        <nav aria-label="Вид результата" class="flex min-w-0 gap-1">
          <button v-for="view in views" :key="view.id" type="button" :aria-pressed="selected.id === view.id" class="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors hover:bg-canvas sm:gap-2 sm:px-3 sm:text-sm" :class="selected.id === view.id ? 'bg-accent-soft font-medium text-accent' : 'text-muted'" @click="changeView(view.id)"><AppIcon :name="view.icon" class="hidden size-4 sm:block" />{{ view.title }}</button>
        </nav>
        <span class="ml-auto hidden text-xs text-muted sm:block">мм</span>
      </div>
      <div :key="selected.id" class="flex min-h-72 flex-col items-center justify-center gap-3 px-5 py-14 text-center sm:min-h-[420px] lg:min-h-[540px]" role="status"><AppIcon :name="selected.icon" class="size-8 text-muted" /><p class="text-sm text-muted">{{ selected.empty }}</p></div>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-xs text-muted tabular-nums"><span>L {{ draft.lengthMm || '—' }} × W {{ draft.widthMm || '—' }} × H {{ draft.heightMm || '—' }} мм</span><span class="ml-auto">Площадь: — м²</span></div>
    </section>
  </div>
  <details class="mt-4 rounded-lg border border-line bg-surface px-4 py-3 lg:ml-[336px]" :open="route.query.details === '1'"><summary class="w-fit cursor-pointer text-xs text-muted">Диагностика</summary><p class="pt-3 text-xs leading-relaxed text-muted">Расчётное ядро не подключено.</p></details>
</template>
