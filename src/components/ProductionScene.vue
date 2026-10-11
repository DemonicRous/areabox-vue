<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { machines, type Passport } from '../data/machines'
import { useBoxDraft } from '../composables/useBoxDraft'
import { productionSelection as selection, confirmedProduction } from '../composables/useProductionRoute'
import { checkMachine, geometry, technology, findMachine, planSheet } from '../domain/production'
const emit = defineEmits<{ drawing: [] }>()
const draft = useBoxDraft()
const activeStage=ref('cutting')
const compound = computed(()=>['0201-2','0201-4'].includes(draft.design))
const cutTech = computed(()=>technology(selection.cutting))
const geo = computed(()=>selection.cutting ? geometry(draft,cutTech.value,selection.finishing) : null)
const sheet = computed(()=>geo.value && selection.cutting ? planSheet(geo.value,findMachine(selection.cutting)!,draft.hasPrinting && selection.printing ? findMachine(selection.printing) : undefined) : null)
const printing = computed(()=> !draft.hasPrinting ? [] : draft.printType === 'flexo'
  ? [...machines.inline!, ...machines.flatbed!, ...machines.rotary!] : [machines.printing!.find(machine=>machine.id === (draft.printType === 'digital' ? 'digital' : 'pinlong'))!])
const cutting = computed(()=>draft.hasPrinting && draft.printType === 'flexo' ? printing.value.filter(machine=>machine.id===selection.printing)
  : draft.hasPrinting && draft.printType === 'digital' ? machines.plotter!
  : [...(draft.hasPrinting || compound.value ? [] : machines.inline!), ...machines.flatbed!, ...machines.rotary!, ...machines.plotter!])
const finishing = computed(()=> cutTech.value === 'inline' ? [] : compound.value ? machines.stitching! : [...machines.folderGluer!, ...machines.stitching!, ...(cutTech.value==='plotter' ? machines.manualGluer! : [])])
function category(machine: Passport) { return Object.keys(machines).find(key=>machines[key]!.some(item=>item.id===machine.id))! }
function check(machine: Passport, stage: string) {
  const candidateGeometry = stage === 'cutting' ? geometry(draft,technology(machine.id),selection.finishing)
    : stage === 'finishing' && selection.cutting ? geometry(draft,cutTech.value,machine.id) : geo.value
  const cat=category(machine)
  const candidateSheet = candidateGeometry && ['flatbed','rotary','plotter','inline'].includes(cat) ? planSheet(candidateGeometry,machine,draft.hasPrinting && selection.printing ? findMachine(selection.printing) : undefined) : sheet.value
  return checkMachine(machine,draft,candidateGeometry,cat,candidateSheet)
}
const stages = computed(()=>[
  { id: 'corrugator', title: 'Гофрокартон', options: machines.corrugator!, selected: 'fosber', note: '' },
  { id: 'printing', title: 'Печать', options: printing.value, selected: selection.printing, note: !draft.hasPrinting ? 'Без печати' : '' },
  { id: 'cutting', title: 'Вырезка', options: cutting.value, selected: selection.cutting, note: draft.hasPrinting && draft.printType === 'digital' ? 'После Hanway — только плоттер' : '' },
  { id: 'finishing', title: 'Соединение', options: finishing.value, selected: selection.finishing, note: selection.cutting && cutTech.value === 'inline' ? 'Фальцесклейка в составе инлайна' : '' },
])
const active = computed(()=>stages.value.find(stage=>stage.id===activeStage.value)!)
const ready = computed(()=>!!selection.cutting && (!draft.hasPrinting || !!selection.printing) && (cutTech.value==='inline' || !!selection.finishing))
const selectedMachines = computed(()=>[machines.corrugator![0]!, ...(draft.hasPrinting && selection.printing ? [findMachine(selection.printing)!] : []), ...(selection.cutting ? [findMachine(selection.cutting)!] : []), ...(selection.finishing && cutTech.value!=='inline' ? [findMachine(selection.finishing)!] : [])].filter((machine,index,all)=>machine && all.findIndex(item=>item.id===machine.id)===index))
const checks = computed(()=>selectedMachines.value.map(machine=>check(machine,'selected')))
const blocked = computed(()=>checks.value.flatMap(value=>value.blocked))
const review = computed(()=>[...new Set(checks.value.flatMap(value=>value.review))])
function choose(stage: string, id: string) {
  confirmedProduction.value = null
  if (stage==='printing') { selection.printing=id; selection.cutting=''; selection.finishing=''; activeStage.value='cutting' }
  if (stage==='cutting') { selection.cutting=id; selection.finishing=''; activeStage.value=technology(id)==='inline' ? 'cutting' : 'finishing' }
  if (stage==='finishing') selection.finishing=id
}
watch(draft,()=>{
  confirmedProduction.value=null
  if (!printing.value.some(machine=>machine.id===selection.printing)) selection.printing=''
  if (!cutting.value.some(machine=>machine.id===selection.cutting)) { selection.cutting=''; selection.finishing=''; activeStage.value='cutting' }
  if (!finishing.value.some(machine=>machine.id===selection.finishing)) selection.finishing=''
},{deep:true})
function confirm() {
  if (!ready.value || blocked.value.length) return
  confirmedProduction.value={ names: selectedMachines.value.map(machine=>machine.name), geometry: geo.value, review: review.value }
  if (geo.value) emit('drawing')
}
</script>
<template>
  <div class="space-y-5 p-4 sm:p-5">
    <h2 class="text-sm font-semibold">Производственная цепочка</h2>
    <div class="grid gap-2 sm:grid-cols-4">
      <button v-for="stage in stages" :key="stage.id" type="button" :aria-expanded="activeStage===stage.id" aria-controls="route-options" class="flex min-h-20 min-w-0 cursor-pointer flex-col justify-center gap-2 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-canvas" :class="activeStage===stage.id ? 'border-accent bg-accent-soft' : 'border-line'" @click="activeStage=stage.id">
        <span class="flex items-center justify-between gap-2 text-[11px] text-muted">{{ stage.title }}<ArrowRightIcon v-if="stage.id!=='finishing'" class="size-3.5 shrink-0" aria-hidden="true" /></span>
        <span class="text-sm font-medium">{{ stage.options.find(machine=>machine.id===stage.selected)?.name || (stage.id==='printing' && !draft.hasPrinting ? 'Без печати' : stage.id==='finishing' && selection.cutting && cutTech==='inline' ? 'В составе инлайна' : 'Выбрать линию') }}</span>
      </button>
    </div>
    <section id="route-options" class="space-y-3" :aria-label="active.title">
      <div class="flex flex-wrap items-baseline justify-between gap-2"><h3 class="text-sm font-medium">{{ active.title }}</h3><span v-if="active.options.length" class="text-xs text-muted">{{ active.options.length }} линии</span></div>
      <p v-if="active.note" class="text-xs text-muted">{{ active.note }}</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <div v-for="machine in active.options" :key="machine.id" class="min-w-0">
          <button type="button" :disabled="check(machine,active.id).blocked.length>0 || active.id==='finishing' && !selection.cutting" :aria-pressed="active.selected===machine.id" class="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50" :class="active.selected===machine.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-canvas'" @click="choose(active.id,machine.id)">
            <span>{{ machine.name }}</span><CheckCircleIcon v-if="active.selected===machine.id" class="size-4 shrink-0 text-accent" aria-hidden="true" />
          </button>
          <p v-if="check(machine,active.id).blocked.length" class="mt-1 px-1 text-[11px] text-danger">{{ check(machine,active.id).blocked.join(' · ') }}</p>
        </div>
      </div>
      <p v-if="active.id==='finishing' && !selection.cutting" class="text-xs text-muted">Сначала выберите линию вырезки.</p>
    </section>
    <section v-if="geo && sheet" class="grid items-center gap-4 border-t border-line pt-4 sm:grid-cols-[minmax(0,1fr)_auto]" aria-label="Раскладка на листе">
      <svg class="max-h-44 w-full" :viewBox="`-8 -8 ${sheet.sheetX+16} ${sheet.sheetY+16}`" role="img" aria-label="Расположение развёрток на производственном листе">
        <rect :width="sheet.sheetX" :height="sheet.sheetY" fill="var(--canvas)" stroke="var(--muted)" stroke-width="1" vector-effect="non-scaling-stroke" />
        <g v-for="index in sheet.count" :key="index" :transform="`translate(${(sheet.sheetX-sheet.cols*geo.width)/2+((index-1)%sheet.cols)*geo.width},${(sheet.sheetY-sheet.rows*geo.height)/2+Math.floor((index-1)/sheet.cols)*geo.height})`">
          <polygon :points="geo.points.map(point=>point.join(',')).join(' ')" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1" vector-effect="non-scaling-stroke" />
        </g>
      </svg>
      <div class="space-y-2 text-xs tabular-nums"><p class="text-sm font-semibold">{{ sheet.count }} мест · {{ sheet.cols }} × {{ sheet.rows }}</p><p class="text-muted">Лист {{ sheet.sheetX }} × {{ sheet.sheetY }} мм</p><p class="text-muted">Развёртка {{ geo.width }} × {{ geo.height }} мм</p><p class="text-muted">Использование {{ Math.round(sheet.utilization*100) }}%</p></div>
    </section>
    <div v-if="ready" class="space-y-3 border-t border-line pt-4" aria-live="polite">
      <p class="text-xs text-muted">Просечка {{ geo?.slot ?? '—' }} мм · соединительный клапан {{ geo?.flap ?? '—' }} мм</p>
      <ul v-if="blocked.length" class="space-y-1 text-xs text-danger"><li v-for="reason in blocked" :key="reason">{{ reason }}</li></ul>
      <details v-if="review.length" class="text-xs text-muted"><summary class="cursor-pointer">Проверка паспорта · {{ review.length }} уточнений</summary><ul class="mt-2 space-y-1"><li v-for="reason in review" :key="reason">{{ reason }}</li></ul></details>
      <button type="button" :disabled="blocked.length>0" class="min-h-11 w-full cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" @click="confirm">{{ geo ? 'Построить развёртку' : 'Выбрать предварительный маршрут' }}</button>
      <p v-if="review.length" class="text-[11px] text-muted">Маршрут предварительный: часть ограничений требует проверки.</p>
      <p v-if="confirmedProduction && !geo" class="text-xs text-muted">Геометрия этой конструкции ещё требует калибровки.</p>
    </div>
  </div>
</template>
