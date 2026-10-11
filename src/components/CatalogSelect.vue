<script setup lang="ts" generic="T extends string">
import { computed, nextTick, onMounted, onUnmounted, ref, useId } from 'vue'
import { CheckIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  label: string
  options: { value: T; label: string; description?: string; cells?: string[] }[]
  columns?: string[]
}>()
const model = defineModel<T>({ required: true })
const id = useId()
const root = ref<HTMLElement>()
const opened = ref(false)
const active = ref(0)
const selected = computed(() => props.options.find(option => option.value === model.value))
function close() { opened.value = false }
function open() {
  active.value = Math.max(0, props.options.findIndex(option => option.value === model.value))
  opened.value = true
  reveal()
}
async function reveal() {
  await nextTick()
  root.value?.querySelector(`#${CSS.escape(`${id}-option-${active.value}`)}`)?.scrollIntoView({ block: 'nearest' })
}
function select(index: number) {
  const option = props.options[index]
  if (option) model.value = option.value
  close()
  root.value?.querySelector('button')?.focus()
}
let search = ''
let lastKey = 0
function keydown(event: KeyboardEvent) {
  if (event.key === 'Tab') { close(); return }
  if (event.key === 'Escape') { if (opened.value) event.preventDefault(); close(); return }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    if (!opened.value) { open(); return }
    if (event.key === 'Enter' || event.key === ' ') { select(active.value); return }
    if (event.key === 'Home') active.value = 0
    else if (event.key === 'End') active.value = props.options.length - 1
    else active.value = Math.max(0, Math.min(props.options.length - 1, active.value + (event.key === 'ArrowDown' ? 1 : -1)))
    reveal()
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    if (!opened.value) open()
    search = Date.now() - lastKey > 700 ? event.key : search + event.key
    lastKey = Date.now()
    const index = props.options.findIndex(option => option.label.toLowerCase().startsWith(search.toLowerCase()))
    if (index >= 0) { active.value = index; reveal() }
  }
}
function outside(event: PointerEvent) {
  if (event.target instanceof Node && !root.value?.contains(event.target)) close()
}
onMounted(() => document.addEventListener('pointerdown', outside))
onUnmounted(() => document.removeEventListener('pointerdown', outside))
</script>

<template>
  <div ref="root" class="relative min-w-0" @focusout="event => { if (!root?.contains(event.relatedTarget as Node)) close() }">
    <label :id="`${id}-label`" :for="`${id}-trigger`" class="mb-2 block text-xs font-medium text-muted">{{ label }}</label>
    <button :id="`${id}-trigger`" type="button" role="combobox" aria-haspopup="listbox" :aria-expanded="opened" :aria-controls="`${id}-list`" :aria-labelledby="`${id}-label`" :aria-activedescendant="opened ? `${id}-option-${active}` : undefined" class="control flex cursor-pointer items-center gap-3 text-left hover:border-accent" @click="opened ? close() : open()" @keydown="keydown">
      <span class="min-w-0 flex-1">
        <span v-if="columns" class="flex items-center gap-4 py-1">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent-soft text-lg font-semibold text-accent">{{ selected?.label }}</span>
          <span class="min-w-0 flex-1 space-y-1">
            <span v-for="(cell, index) in selected?.cells" :key="index" class="flex items-baseline justify-between gap-2 text-xs font-normal text-muted"><span>{{ columns[index] }}</span><span class="shrink-0 text-sm font-medium tabular-nums text-ink">{{ cell }}</span></span>
          </span>
        </span>
        <span v-else class="block py-0.5"><span class="block font-semibold tabular-nums">{{ selected?.label }}</span><span class="mt-1 block text-xs font-normal text-muted">{{ selected?.description }}</span></span>
      </span>
      <ChevronDownIcon class="size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none" :class="{ 'rotate-180': opened }" aria-hidden="true" />
    </button>
    <div v-if="opened" class="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-line bg-surface">
      <div v-if="columns" class="grid grid-cols-[3rem_1fr_1fr_1rem] gap-2 border-b border-line bg-canvas px-3 py-2 text-center text-[11px] text-muted" aria-hidden="true"><span>Профиль</span><span v-for="column in columns" :key="column">{{ column }}</span><span /></div>
      <ul :id="`${id}-list`" role="listbox" :aria-labelledby="`${id}-label`" class="max-h-72 overflow-y-auto overscroll-contain p-1">
        <li v-for="(option, index) in options" :id="`${id}-option-${index}`" :key="option.value" role="option" :aria-selected="model === option.value" class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm" :class="active === index ? 'bg-accent-soft text-ink' : 'text-ink hover:bg-canvas'" @pointermove="active = index" @pointerdown.prevent @click="select(index)">
          <span v-if="columns" class="grid min-w-0 flex-1 grid-cols-[3rem_1fr_1fr] gap-2 text-center"><span class="font-semibold">{{ option.label }}</span><span v-for="(cell, cellIndex) in option.cells" :key="cellIndex" class="tabular-nums">{{ cell }}</span></span>
          <span v-else class="min-w-0 flex-1 py-0.5"><span class="block font-medium tabular-nums">{{ option.label }}</span><span class="mt-1 block text-xs text-muted">{{ option.description }}</span></span>
          <CheckIcon class="size-4 shrink-0 text-accent" :class="{ invisible: model !== option.value }" aria-hidden="true" />
        </li>
      </ul>
    </div>
  </div>
</template>
