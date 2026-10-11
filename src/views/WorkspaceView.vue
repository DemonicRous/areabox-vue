<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoxDraftForm from '../components/BoxDraftForm.vue'
import AppIcon from '../components/AppIcon.vue'
import ProductionScene from '../components/ProductionScene.vue'
import GeometryDrawing from '../components/GeometryDrawing.vue'
import SheetLayout from '../components/SheetLayout.vue'
import { confirmedProduction, savedLayout } from '../composables/useProductionRoute'
import { useBoxDraft } from '../composables/useBoxDraft'
const route = useRoute()
const router = useRouter()
const draft = useBoxDraft()
watch(draft,()=>{ confirmedProduction.value=null },{deep:true})
const views = [
  { id: 'drawing', title: 'Чертёж', icon: 'drawing', empty: 'Расчётный чертёж ещё не подключён' },
  { id: 'layout', title: 'Раскладка', icon: 'layout', empty: 'Расчёт раскладки ещё не подключён' },
  { id: 'route', title: 'Маршрут', icon: 'route', empty: 'Подбор оборудования ещё не подключён' },
] as const
const selected = computed(() => views.find(view => view.id === route.query.view) ?? views[2])
function changeView(id: string) { router.replace({ path: '/', query: { ...route.query, view: id } }) }
async function openDrawing() {
  await router.replace({ path: '/', query: { ...route.query, view: 'drawing' } })
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
}
</script>
<template>
  <div class="mb-5 flex items-center justify-between gap-4"><h1 class="text-lg font-semibold">Короб</h1><span class="text-xs text-muted">FEFCO {{ Number(draft.design.split('-')[0]) }} · {{ draft.profile }}</span></div>
  <div class="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
    <BoxDraftForm />
    <section class="min-w-0 overflow-hidden rounded-xl border border-line bg-surface" aria-label="Результат">
      <div class="flex flex-wrap items-center gap-2 border-b border-line px-2 py-2 sm:px-3">
        <nav aria-label="Вид результата" class="flex min-w-0 gap-1">
          <button v-for="view in views" :key="view.id" type="button" :aria-pressed="selected.id === view.id" class="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors hover:bg-canvas sm:gap-2 sm:px-3 sm:text-sm" :class="selected.id === view.id ? 'bg-accent-soft text-accent' : 'text-muted'" @click="changeView(view.id)"><AppIcon :name="view.icon" class="hidden size-4 sm:block" />{{ view.title }}</button>
        </nav>
        <span class="ml-auto hidden text-xs text-muted sm:block">мм</span>
      </div>
      <ProductionScene v-if="selected.id==='route'" @drawing="openDrawing" />
      <GeometryDrawing v-else-if="selected.id==='drawing' && confirmedProduction?.geometry" :geometry="confirmedProduction.geometry" :names="confirmedProduction.names" :review="confirmedProduction.review" />
      <SheetLayout v-else-if="selected.id==='layout' && confirmedProduction?.geometry" />
      <div v-else :key="selected.id" class="flex min-h-72 flex-col items-center justify-center gap-3 px-5 py-14 text-center sm:min-h-[420px] lg:min-h-[540px]" role="status"><AppIcon :name="selected.icon" class="size-8 text-muted" /><p class="text-sm text-muted">Выберите и подтвердите маршрут с рассчитанной развёрткой.</p><button type="button" class="min-h-11 cursor-pointer rounded-md bg-accent-soft px-4 py-2 text-accent" @click="changeView('route')">Выбрать маршрут</button></div>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-xs text-muted tabular-nums"><span>L {{ draft.lengthMm || '—' }} × W {{ draft.widthMm || '—' }} × H {{ draft.heightMm || '—' }} мм</span><span class="ml-auto">{{ confirmedProduction?.geometry?.parts ? 'Расход на пару L + W' : 'Расход на заготовку' }}: {{ savedLayout ? (savedLayout.sheetX*savedLayout.sheetY/savedLayout.count/1e6).toLocaleString('ru-RU',{minimumFractionDigits:3,maximumFractionDigits:3}) : '—' }} м²</span></div>
    </section>
  </div>
  <details class="mt-4 rounded-lg border border-line bg-surface px-4 py-3 lg:ml-[336px]" :open="route.query.details === '1'"><summary class="w-fit cursor-pointer text-xs text-muted">Диагностика</summary><p class="pt-3 text-xs leading-relaxed text-muted">{{ confirmedProduction ? (confirmedProduction.review.join(' · ') || 'Известные ограничения выбранного маршрута проверены.') : 'Выберите маршрут. Незаданные ограничения оборудования требуют проверки.' }}</p></details>
</template>
