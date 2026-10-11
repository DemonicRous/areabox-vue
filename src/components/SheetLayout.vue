<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RouteLayout from './RouteLayout.vue'
import { confirmedProduction, productionSelection, savedLayout, savedPartLayouts } from '../composables/useProductionRoute'
import { useBoxDraft } from '../composables/useBoxDraft'
import { evaluateLayout, layoutVariants } from '../domain/layout'
import type { Geometry, SheetPlan } from '../domain/production'
const props = defineProps<{ geometry?: Geometry; partKey?: string }>()
const draft = useBoxDraft()
const geo = computed(()=>props.geometry ?? confirmedProduction.value!.geometry!)
const stored = computed(()=>props.partKey ? savedPartLayouts[props.partKey] ?? null : savedLayout.value)
const totalArea = computed(()=>geo.value.parts?.every(part=>savedPartLayouts[part.name]) ? geo.value.parts.reduce((sum,part)=>{ const plan=savedPartLayouts[part.name]!; return sum+part.quantity*plan.sheetX*plan.sheetY/plan.count/1e6 },0) : null)
const variants = computed(()=>layoutVariants(draft,productionSelection,geo.value))
const custom = ref(false)
const cols = ref(1), rows = ref(1), x = ref(0), y = ref(0)
const result = computed(()=>evaluateLayout(draft,productionSelection,geo.value,cols.value,rows.value,x.value,y.value))
const fmt = (value: number, digits=3)=>value.toLocaleString('ru-RU',{minimumFractionDigits:digits,maximumFractionDigits:digits})
function choose(plan: SheetPlan) { cols.value=plan.cols; rows.value=plan.rows; x.value=plan.sheetX; y.value=plan.sheetY; custom.value=false }
watch(variants,()=>{ const plan=stored.value ?? variants.value[0]; if(plan) choose(plan) },{immediate:true})
const isSaved = computed(()=>!!stored.value && ['sheetX','sheetY','cols','rows'].every(key=>stored.value![key as keyof SheetPlan]===result.value.plan[key as keyof SheetPlan]))
function save() { if(result.value.errors.length) return; if(props.partKey) savedPartLayouts[props.partKey]={...result.value.plan}; else savedLayout.value={...result.value.plan} }
</script>
<template>
  <div v-if="geo.parts" class="divide-y divide-line">
    <div class="p-5"><h2 class="text-base font-semibold">Два отдельных изделия</h2><p class="mt-2 text-xs text-muted">Панели L и W раскладываются на разные листы. На короб нужны по 2 шт. каждой.</p><p class="mt-3 text-sm">Расход на короб: <strong>{{ totalArea===null ? 'сохраните обе раскладки' : fmt(totalArea)+' м²' }}</strong></p></div>
    <section v-for="part in geo.parts" :key="part.name"><h3 class="px-5 pt-5 text-sm font-semibold">{{ part.name }} · {{ part.quantity }} шт. на короб</h3><SheetLayout :geometry="part.geometry" :part-key="part.name" /></section>
  </div>
  <div v-else class="space-y-5 p-4 sm:p-5">
    <div class="flex flex-wrap items-baseline justify-between gap-2"><h2 class="text-base font-semibold">Раскладка на листе</h2><span class="text-xs text-muted">X — поперёк гофры · Y — вдоль</span></div>
    <p class="text-xs text-muted">{{ confirmedProduction!.names.join(' → ') }}</p>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="min-h-11 cursor-pointer rounded-md px-3 text-sm" :class="!custom ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-canvas'" :aria-pressed="!custom" @click="custom=false; variants[0] && choose(variants[0])">Автоподбор</button>
      <button type="button" class="min-h-11 cursor-pointer rounded-md px-3 text-sm" :class="custom ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-canvas'" :aria-pressed="custom" @click="custom=true">Свой размер листа</button>
    </div>
    <div v-if="custom" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <label v-for="field in [{label:'Лист X, мм',key:'x'},{label:'Лист Y, мм',key:'y'},{label:'Столбцы',key:'cols'},{label:'Ряды',key:'rows'}]" :key="field.key" class="space-y-1 text-xs text-muted">
        <span>{{ field.label }}</span>
        <input v-if="field.key==='x'" v-model.number="x" type="number" min="1" step="1" class="min-h-11 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink" />
        <input v-else-if="field.key==='y'" v-model.number="y" type="number" min="1" step="1" class="min-h-11 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink" />
        <input v-else-if="field.key==='cols'" v-model.number="cols" type="number" min="1" max="100" step="1" class="min-h-11 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink" />
        <input v-else v-model.number="rows" type="number" min="1" max="100" step="1" class="min-h-11 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink" />
      </label>
    </div>
    <ul v-if="result.errors.length" class="space-y-1 text-xs text-danger" role="alert"><li v-for="error in result.errors" :key="error">{{ error }}</li></ul>
    <template v-else>
      <RouteLayout :geometry="geo" :sheet="result.plan" :left="result.limits.left" :top="result.limits.top" :inline="result.limits.tech==='inline'" />
      <dl class="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 tabular-nums">
        <div><dt class="text-muted">Заготовок на листе</dt><dd class="mt-1 text-sm font-semibold">{{ result.plan.count * (geo.parts ? 2 : 1) }}</dd></div>
        <div><dt class="text-muted">Площадь листа</dt><dd class="mt-1 text-sm font-medium">{{ fmt(x*y/1e6) }} м²</dd></div>
        <div><dt class="text-muted">{{ geo.parts ? 'Расход на пару L + W' : 'Расход на заготовку' }}</dt><dd class="mt-1 text-sm font-medium">{{ fmt(x*y/result.plan.count/1e6,3) }} м²</dd></div>
        <div><dt class="text-muted">Использование формата</dt><dd class="mt-1 text-sm font-medium">{{ fmt(result.plan.utilization*100,1) }}%</dd></div>
      </dl>
      <p v-if="geo.count>1" class="text-xs text-muted">На короб: {{ geo.parts ? '2 панели L + 2 панели W' : 'две одинаковые половины' }}. {{ geo.parts ? 'Сетка размещает пары L + W. Расход на короб равен расходу на пару × 2.' : 'Расход на короб равен расходу на заготовку × 2.' }}</p>
      <p class="text-[11px] text-muted">Использование рассчитано по прямоугольным габаритам развёртки. Поля слева / справа / сверху / снизу: {{ result.limits.left }} / {{ result.limits.right }} / {{ result.limits.top }} / {{ result.limits.bottom }} мм.</p>
    </template>
    <section v-if="!custom" class="border-t border-line pt-4">
      <h3 class="mb-3 text-sm font-semibold">Варианты · {{ variants.length }}</h3>
      <p v-if="!variants.length" class="text-xs text-muted">Допустимых автоматических раскладок нет. Проверьте маршрут или задайте лист вручную.</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <button v-for="(plan,index) in variants.slice(0,12)" :key="`${plan.cols}-${plan.rows}`" type="button" class="min-h-16 cursor-pointer rounded-md border px-3 py-3 text-left" :class="cols===plan.cols && rows===plan.rows && x===plan.sheetX && y===plan.sheetY ? 'border-accent bg-accent-soft' : 'border-line hover:bg-canvas'" :aria-pressed="cols===plan.cols && rows===plan.rows && x===plan.sheetX && y===plan.sheetY" @click="choose(plan)">
          <span class="flex items-baseline justify-between gap-2 text-sm font-medium"><span>{{ plan.cols }} × {{ plan.rows }} · {{ plan.count * (geo.parts ? 2 : 1) }} заготовок</span><span v-if="index===0" class="text-[11px] text-accent">{{ result.limits.tech==='plotter' && productionSelection.printing!=='digital' ? 'Стандартный лист' : 'Минимальный расход' }}</span></span>
          <span class="mt-1 block text-xs text-muted tabular-nums">{{ plan.sheetX }} × {{ plan.sheetY }} мм · {{ fmt(plan.sheetX*plan.sheetY/plan.count/1e6,3) }} м² / {{ geo.parts ? 'пару' : 'шт.' }}</span>
        </button>
      </div>
      <p v-if="variants.length>12" class="mt-2 text-xs text-muted">Показаны 12 вариантов с наименьшим расходом. Другую сетку можно задать вручную.</p>
    </section>
    <details v-if="result.review.length" class="text-xs text-muted"><summary class="min-h-8 cursor-pointer">Паспортные ограничения требуют проверки · {{ result.review.length }}</summary><ul class="space-y-1 pt-2"><li v-for="reason in result.review" :key="reason">{{ reason }}</li></ul></details>
    <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <button type="button" :disabled="!!result.errors.length || isSaved" class="min-h-11 cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-50" @click="save">{{ isSaved ? 'Раскладка сохранена' : 'Сохранить раскладку' }}</button>
      <span v-if="result.review.length" class="text-xs text-muted">Предварительный расчёт</span>
    </div>
  </div>
</template>
