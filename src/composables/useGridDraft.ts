import { computed, reactive, ref, watch } from 'vue'
import type { ProfileId } from '../domain/types'
import { calculateGrid, gridRoute } from '../domain/grid'
import { machines } from '../data/machines'
import { useBoxDraft } from './useBoxDraft'

export const gridDraft = reactive({ rows: 3, cols: 3, heightMm: 0, profile: 'D' as ProfileId, clearanceMm: 5, productLengthMm: 0, productWidthMm: 0, cellGapMm: 1, slotMm: 7, assembly: 'auto' as 'auto' | 'premier' | 'manual' })
export const gridCutting = ref('roda')
export const gridConfirmed = ref(false)
export const gridView = ref<'plan' | 'strips' | 'scene'>('plan')
const box=useBoxDraft()
export const gridModel=computed(()=>calculateGrid(box,gridDraft))
export const gridRoutes=computed(()=>[...machines.gridCutting!,...machines.flatbed!,...machines.rotary!,...machines.plotter!].map(line=>gridRoute(box,gridDraft,gridModel.value,line)))
export const selectedGridRoute=computed(()=>gridRoutes.value.find(route=>route.line.id===gridCutting.value)??null)
export const gridArea=computed(()=>gridConfirmed.value && !selectedGridRoute.value?.blocked.length ? selectedGridRoute.value?.area??null : null)
watch([box,gridDraft,gridCutting],()=>{gridConfirmed.value=false},{deep:true,flush:'sync'})
