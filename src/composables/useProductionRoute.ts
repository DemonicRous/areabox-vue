import { reactive, ref } from 'vue'
import type { Geometry } from '../domain/production'
export const productionSelection = reactive({ printing: '', cutting: '', finishing: '' })
export const confirmedProduction = ref<{ names: string[]; geometry: Geometry | null; review: string[] } | null>(null)
