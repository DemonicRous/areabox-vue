import { reactive } from 'vue'
import type { BoxInput } from '../domain/types'

const draft = reactive<BoxInput>({ design: '0201', profile: 'B', lengthMm: 300, widthMm: 200, heightMm: 150, hasPrinting: false, printType: 'digital', printColors: 1 })
export function useBoxDraft() { return draft }
