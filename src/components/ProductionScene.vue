<script setup lang="ts">
import { computed, watch } from 'vue'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { machines, type Passport } from '../data/machines'
import { useBoxDraft } from '../composables/useBoxDraft'
import { productionSelection as selection, confirmedProduction } from '../composables/useProductionRoute'
import { checkMachine, geometry, technology, findMachine } from '../domain/production'
const emit = defineEmits<{ drawing: [] }>()
const draft = useBoxDraft()
const compound = computed(()=>['0201-2','0201-4'].includes(draft.design))
const cutTech = computed(()=>technology(selection.cutting))
const geo = computed(()=>selection.cutting ? geometry(draft,cutTech.value,selection.finishing) : null)
const printing = computed(()=> !draft.hasPrinting ? [] : draft.printType === 'flexo'
  ? [...machines.inline!, ...machines.rotary!] : [machines.printing!.find(machine=>machine.id === (draft.printType === 'digital' ? 'digital' : 'pinlong'))!])
const cutting = computed(()=>draft.hasPrinting && draft.printType === 'flexo' ? printing.value.filter(machine=>machine.id===selection.printing)
  : draft.hasPrinting && draft.printType === 'digital' ? machines.plotter!
  : [...(draft.hasPrinting || compound.value ? [] : machines.inline!), ...machines.flatbed!, ...machines.rotary!, ...machines.plotter!])
const finishing = computed(()=> cutTech.value === 'inline' ? [] : compound.value ? machines.stitching! : [...machines.folderGluer!, ...machines.stitching!])
function category(machine: Passport) { return Object.keys(machines).find(key=>machines[key]!.some(item=>item.id===machine.id))! }
function check(machine: Passport, stage: string) {
  const candidateGeometry = stage === 'cutting' ? geometry(draft,technology(machine.id),selection.finishing)
    : stage === 'finishing' && selection.cutting ? geometry(draft,cutTech.value,machine.id) : geo.value
  return checkMachine(machine,draft,candidateGeometry,category(machine))
}
const stages = computed(()=>[
  { id: 'corrugator', title: 'Гофрокартон', options: machines.corrugator!, selected: 'fosber', note: '' },
  { id: 'printing', title: 'Печать', options: printing.value, selected: selection.printing, note: !draft.hasPrinting ? 'Без печати' : '' },
  { id: 'cutting', title: 'Вырезка', options: cutting.value, selected: selection.cutting, note: draft.hasPrinting && draft.printType === 'digital' ? 'После Hanway — только плоттер' : '' },
  { id: 'finishing', title: 'Соединение', options: finishing.value, selected: selection.finishing, note: selection.cutting && cutTech.value === 'inline' ? 'Фальцесклейка в составе инлайна' : '' },
])
const ready = computed(()=>!!selection.cutting && (!draft.hasPrinting || !!selection.printing) && (cutTech.value==='inline' || !!selection.finishing))
const selectedMachines = computed(()=>[machines.corrugator![0]!, ...(draft.hasPrinting && selection.printing ? [findMachine(selection.printing)!] : []), ...(selection.cutting ? [findMachine(selection.cutting)!] : []), ...(selection.finishing && cutTech.value!=='inline' ? [findMachine(selection.finishing)!] : [])].filter((machine,index,all)=>machine && all.findIndex(item=>item.id===machine.id)===index))
const checks = computed(()=>selectedMachines.value.map(machine=>check(machine,'selected')))
const blocked = computed(()=>checks.value.flatMap(value=>value.blocked))
const review = computed(()=>[...new Set(checks.value.flatMap(value=>value.review))])
function choose(stage: string, id: string) {
  confirmedProduction.value = null
  if (stage==='printing') { selection.printing=id; selection.cutting=''; selection.finishing='' }
  if (stage==='cutting') { selection.cutting=id; selection.finishing='' }
  if (stage==='finishing') selection.finishing=id
}
watch(draft,()=>{
  confirmedProduction.value=null
  if (!printing.value.some(machine=>machine.id===selection.printing)) selection.printing=''
  if (!cutting.value.some(machine=>machine.id===selection.cutting)) { selection.cutting=''; selection.finishing='' }
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
    <div><h2 class="font-semibold">Производственная цепочка</h2><p class="mt-1 text-xs text-muted">Выберите линии по этапам. Размеры проверяются для выбранного способа вырезки и соединения.</p></div>
    <div class="grid gap-4 xl:grid-cols-2">
      <section v-for="stage in stages" :key="stage.id" class="min-w-0 border-t border-line pt-3">
        <h3 class="mb-3 flex items-center justify-between text-sm font-semibold">{{ stage.title }}<ArrowRightIcon v-if="stage.id!=='finishing'" class="size-4 text-muted" aria-hidden="true" /></h3>
        <p v-if="stage.note" class="mb-3 text-xs text-muted">{{ stage.note }}</p>
        <div class="space-y-2">
          <div v-for="machine in stage.options" :key="machine.id">
            <button type="button" :disabled="check(machine,stage.id).blocked.length>0 || stage.id==='finishing' && !selection.cutting" :aria-pressed="stage.selected===machine.id" class="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50" :class="stage.selected===machine.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-canvas'" @click="choose(stage.id,machine.id)">
              <span>{{ machine.name }}</span><CheckCircleIcon v-if="stage.selected===machine.id" class="size-4 shrink-0 text-accent" aria-hidden="true" />
            </button>
            <p class="mt-1 px-1 text-[11px]" :class="check(machine,stage.id).blocked.length ? 'text-danger' : 'text-muted'">{{ check(machine,stage.id).blocked.join(' · ') || (check(machine,stage.id).review.length ? 'Требует проверки' : 'Подходит') }}</p>
          </div>
        </div>
      </section>
    </div>
    <div v-if="ready" class="space-y-3 border-t border-line pt-4" aria-live="polite">
      <p class="text-sm font-medium">{{ selectedMachines.map(machine=>machine.name).join(' → ') }}</p>
      <p v-if="geo" class="text-xs tabular-nums text-muted">Заготовка {{ geo.width }} × {{ geo.height }} мм · просечка {{ geo.slot }} мм · соединительный клапан {{ geo.flap }} мм</p>
      <ul v-if="blocked.length" class="space-y-1 text-xs text-danger"><li v-for="reason in blocked" :key="reason">{{ reason }}</li></ul>
      <details v-if="review.length" class="text-xs text-muted"><summary class="cursor-pointer">Требует проверки: {{ review.length }}</summary><ul class="mt-2 space-y-1"><li v-for="reason in review" :key="reason">{{ reason }}</li></ul></details>
      <button type="button" :disabled="blocked.length>0" class="min-h-11 cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface disabled:cursor-not-allowed disabled:opacity-50" @click="confirm">{{ review.length ? 'Выбрать предварительный маршрут' : 'Выбрать маршрут' }}</button>
      <p v-if="confirmedProduction && !geo" class="text-xs text-muted">Маршрут выбран предварительно. Геометрия этой конструкции ещё требует калибровки.</p>
    </div>
  </div>
</template>
