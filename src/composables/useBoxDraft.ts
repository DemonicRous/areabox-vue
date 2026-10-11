import { reactive } from 'vue'
import type { BoxInput } from '../domain/types'

const draft = reactive<BoxInput>({ design: '0201', profile: 'B', lengthMm: 300, widthMm: 200, heightMm: 150 })
export function useBoxDraft() { return draft }
