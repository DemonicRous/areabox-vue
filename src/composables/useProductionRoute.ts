import { reactive, ref, watch } from 'vue'
import type { Geometry, SheetPlan } from '../domain/production'
export const productionSelection = reactive({ printing: '', cutting: '', finishing: '' })
export const confirmedProduction = ref<{ names: string[]; geometry: Geometry | null; review: string[] } | null>(null)
export const savedLayout = ref<SheetPlan | null>(null)
watch(confirmedProduction,()=>{ savedLayout.value=null }, { flush:'sync' })
