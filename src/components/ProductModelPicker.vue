<script setup lang="ts">
import { CubeIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { productModels, type ProductModelId } from '../data/productModels'
defineProps<{modelValue:ProductModelId;loading:boolean;error:string}>()
const emit=defineEmits<{'update:modelValue':[value:ProductModelId];retry:[]}>()
const base=import.meta.env.BASE_URL
</script>
<template>
  <fieldset class="space-y-3 border-t border-line pt-3">
    <legend class="text-xs font-medium">Форма продукта</legend>
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="3D модель продукта">
      <button v-for="item in productModels" :key="item.id" type="button" class="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" :class="modelValue===item.id?'border-accent bg-accent-soft text-ink':'border-line bg-canvas text-muted hover:border-accent'" :aria-pressed="modelValue===item.id" @click="emit('update:modelValue',item.id)">
        <CheckIcon v-if="modelValue===item.id" class="absolute right-1.5 top-1.5 size-3 text-accent" />
        <img v-if="item.preview" :src="`${base}models/products/previews/${item.preview}`" alt="" class="size-14 object-contain" width="56" height="56" loading="lazy" />
        <div v-else class="grid size-14 place-items-center"><CubeIcon class="size-8" /></div>
        <span>{{ item.label }}</span>
      </button>
    </div>
    <p v-if="loading" role="status" class="text-xs text-muted">Загрузка модели…</p>
    <p v-else-if="error" role="alert" class="text-xs text-danger">{{ error }} <button type="button" class="min-h-11 cursor-pointer px-2 underline underline-offset-2" @click="emit('retry')">Повторить</button></p>
    <p class="text-[11px] leading-relaxed text-muted">Форма масштабируется под L/W/H; расчёт решётки не меняется. Модели: <a href="https://kenney.nl/assets/food-kit" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">Kenney · CC0</a>.</p>
  </fieldset>
</template>
