import { computed, reactive, ref, watch } from 'vue'
import type { ProfileId } from '../domain/types'
import { calculateGrid, gridRoute, gridSlotWidth } from '../domain/grid'
import { machines } from '../data/machines'
import { useBoxDraft } from './useBoxDraft'

export const gridDraft = reactive({ rows: 3, cols: 3, heightMm: 0, profile: 'D' as ProfileId, clearanceMm: 5, productLengthMm: 100, productWidthMm: 100, productHeightMm: 200, cellGapMm: 1, assembly: 'auto' as 'auto' | 'premier' | 'manual' })
export const gridCutting = ref('roda')
export const gridConfirmed = ref(false)
export const gridView = ref<'plan' | 'strips' | 'scene'>('plan')
const box=useBoxDraft()
export const gridSlotMm=computed(()=>gridSlotWidth(gridCutting.value))
export const gridModel=computed(()=>calculateGrid(box,{...gridDraft,slotMm:gridSlotMm.value}))
export const gridBoxDimensions=computed(()=>({
  lengthMm: Math.max(gridModel.value.length,gridModel.value.width)+gridDraft.clearanceMm,
  widthMm: Math.min(gridModel.value.length,gridModel.value.width)+gridDraft.clearanceMm,
  heightMm: Math.max(gridModel.value.height,gridDraft.productHeightMm)+gridDraft.clearanceMm,
}))
watch(()=>[box.design,gridBoxDimensions.value],()=>{
  if(box.design==='grid-0201' && !gridModel.value.errors.length) Object.assign(box,gridBoxDimensions.value)
},{immediate:true,flush:'sync'})
export const gridRoutes=computed(()=>[...machines.gridCutting!,...machines.flatbed!,...machines.rotary!,...machines.plotter!].map(line=>gridRoute({...box,...gridBoxDimensions.value},{...gridDraft,slotMm:gridSlotWidth(line.id)},gridModel.value,line)))
export const selectedGridRoute=computed(()=>gridRoutes.value.find(route=>route.line.id===gridCutting.value)??null)
export const gridArea=computed(()=>gridConfirmed.value && !selectedGridRoute.value?.blocked.length ? selectedGridRoute.value?.area??null : null)
watch([box,gridDraft,gridCutting],()=>{gridConfirmed.value=false},{deep:true,flush:'sync'})
