<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoxDraftForm from '../components/BoxDraftForm.vue'
import AppIcon from '../components/AppIcon.vue'
import ProductionScene from '../components/ProductionScene.vue'
import GeometryDrawing from '../components/GeometryDrawing.vue'
import SheetLayout from '../components/SheetLayout.vue'
import GridWorkspace from '../components/GridWorkspace.vue'
import { gridArea, gridDraft, gridCutting, selectedGridRoute, gridConfirmed } from '../composables/useGridDraft'
import { confirmedProduction, savedLayout, savedPartLayouts } from '../composables/useProductionRoute'
import { useBoxDraft } from '../composables/useBoxDraft'
const route = useRoute()
const router = useRouter()
const draft = useBoxDraft()
const workspacePart=ref<'box'|'grid'>('box')
const isGrid=computed(()=>draft.design==='grid'||draft.design==='grid-0201'&&workspacePart.value==='grid')
watch(()=>draft.design,()=>{workspacePart.value=draft.design==='grid'?'grid':'box'},{immediate:true})
const area = computed(()=>{ const parts=confirmedProduction.value?.geometry?.parts; if(parts) return parts.every(part=>savedPartLayouts[part.name]) ? parts.reduce((sum,part)=>{ const plan=savedPartLayouts[part.name]!; return sum+part.quantity*plan.sheetX*plan.sheetY/plan.count/1e6 },0) : null; return savedLayout.value ? savedLayout.value.sheetX*savedLayout.value.sheetY/savedLayout.value.count/1e6 : null })
const areaRows = computed(() => {
  if(draft.design==='grid') return [{label:gridCutting.value==='roda'?'Площадь полос / комплект':'Расход / комплект решётки',value:gridArea.value}]
  if(draft.design==='grid-0201') return [
    {label:'Короб · 1 шт.',value:area.value},
    {label:gridCutting.value==='roda'?'Решётка · площадь полос':'Решётка · расход',value:gridArea.value},
    {label:gridCutting.value==='roda'?'Комплект · без припуска RODA':'Расход комплекта',value:area.value!==null&&gridArea.value!==null?area.value+gridArea.value:null},
  ]
  const geo = confirmedProduction.value?.geometry
  if (geo?.parts) return [
    ...geo.parts.map(part => {
      const plan = savedPartLayouts[part.name]
      return { label: `${part.name} · 1 шт.`, value: plan ? plan.sheetX * plan.sheetY / plan.count / 1e6 : null }
    }),
    { label: 'Комплект короба · 2 L + 2 W', value: area.value },
  ]
  if (geo?.count === 2) return [
    { label: 'Одна половина · 1 шт.', value: area.value },
    { label: 'Комплект короба · 2 шт.', value: area.value === null ? null : area.value * 2 },
  ]
  return [{ label: 'Расход на заготовку', value: area.value }]
})
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
  <div class="mb-5 flex items-center justify-between gap-4"><h1 class="text-lg font-semibold">{{ draft.design==='grid'?'Решётка':draft.design==='grid-0201'?'Короб + решётка':'Короб' }}</h1><span class="text-xs text-muted">{{ draft.design.startsWith('grid') ? `Решётка ${gridDraft.cols} × ${gridDraft.rows} · ${gridDraft.profile}` : `FEFCO ${Number(draft.design.split('-')[0])} · ${draft.profile}` }}</span></div>
  <div class="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
    <BoxDraftForm />
    <section class="min-w-0 overflow-hidden rounded-xl border border-line bg-surface" aria-label="Результат">
      <div v-if="draft.design==='grid-0201'" class="flex gap-2 border-b border-line px-3 py-2" role="group" aria-label="Изделие комплекта"><button v-for="part in [{id:'box',label:'Короб · FEFCO 201'},{id:'grid',label:'Решётка'}] as const" :key="part.id" type="button" class="min-h-11 cursor-pointer rounded-md px-3 text-sm" :class="workspacePart===part.id?'bg-accent-soft text-accent':'text-muted hover:bg-canvas'" :aria-pressed="workspacePart===part.id" @click="workspacePart=part.id">{{ part.label }}</button></div>
      <div class="flex flex-wrap items-center gap-2 border-b border-line px-2 py-2 sm:px-3">
        <nav aria-label="Вид результата" class="flex min-w-0 gap-1">
          <button v-for="view in views" :key="view.id" type="button" :aria-pressed="selected.id === view.id" class="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors hover:bg-canvas sm:gap-2 sm:px-3 sm:text-sm" :class="selected.id === view.id ? 'bg-accent-soft text-accent' : 'text-muted'" @click="changeView(view.id)"><AppIcon :name="view.icon" class="hidden size-4 sm:block" />{{ view.title }}</button>
        </nav>
        <span class="ml-auto hidden text-xs text-muted sm:block">мм</span>
      </div>
      <GridWorkspace v-if="isGrid" :view="selected.id" @drawing="openDrawing" @route="changeView('route')" />
      <ProductionScene v-else-if="selected.id==='route'" @drawing="openDrawing" />
      <GeometryDrawing v-else-if="selected.id==='drawing' && confirmedProduction?.geometry" :geometry="confirmedProduction.geometry" :names="confirmedProduction.names" :review="confirmedProduction.review" />
      <SheetLayout v-else-if="selected.id==='layout' && confirmedProduction?.geometry" />
      <div v-else :key="selected.id" class="flex min-h-72 flex-col items-center justify-center gap-3 px-5 py-14 text-center sm:min-h-[420px] lg:min-h-[540px]" role="status"><AppIcon :name="selected.icon" class="size-8 text-muted" /><p class="text-sm text-muted">Выберите и подтвердите маршрут с рассчитанной развёрткой.</p><button type="button" class="min-h-11 cursor-pointer rounded-md bg-accent-soft px-4 py-2 text-accent" @click="changeView('route')">Выбрать маршрут</button></div>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-xs text-muted tabular-nums"><span v-if="draft.design.startsWith('grid')">Продукт {{ gridDraft.productLengthMm }} × {{ gridDraft.productWidthMm }} × {{ gridDraft.productHeightMm }} мм</span><span v-else>L {{ draft.lengthMm || '—' }} × W {{ draft.widthMm || '—' }} × H {{ draft.heightMm || '—' }} мм</span><div class="ml-auto flex flex-wrap gap-x-5 gap-y-2"><span v-for="item in areaRows" :key="item.label">{{ item.label }}: <strong class="font-medium text-ink">{{ item.value!==null ? item.value.toLocaleString('ru-RU',{minimumFractionDigits:3,maximumFractionDigits:3}) : '—' }} м²</strong></span></div></div>
    </section>
  </div>
  <details class="mt-4 rounded-lg border border-line bg-surface px-4 py-3 lg:ml-[336px]" :open="route.query.details === '1'"><summary class="w-fit cursor-pointer text-xs text-muted">Диагностика</summary><p class="pt-3 text-xs leading-relaxed text-muted">{{ isGrid ? gridConfirmed ? selectedGridRoute?.review.join(' · ') || 'Известные ограничения проверены.' : 'Выберите и подтвердите маршрут решётки.' : confirmedProduction ? (confirmedProduction.review.join(' · ') || 'Известные ограничения выбранного маршрута проверены.') : 'Выберите маршрут. Незаданные ограничения оборудования требуют проверки.' }}</p></details>
</template>
