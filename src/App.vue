<script setup lang="ts">
import { sections } from './router'
import AppIcon from './components/AppIcon.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'
function focusWorkspace() { document.getElementById('workspace')?.focus() }
</script>
<template>
  <div class="min-h-dvh">
    <button type="button" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:p-3" @click="focusWorkspace">К рабочей области</button>
    <header class="border-b border-line bg-surface">
      <div class="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center gap-2 text-base font-semibold tracking-tight" aria-label="AreaBOX, главная"><AppIcon name="box" class="text-accent" />AreaBOX</RouterLink>
        <nav aria-label="Основная навигация" class="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
          <RouterLink v-for="section in sections" :key="section.path" :to="section.path" v-slot="{ isExactActive }" class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm transition-colors hover:bg-canvas sm:flex-none" active-class="bg-accent-soft text-accent"><AppIcon :name="section.icon" class="size-4" /><span :class="{ 'font-semibold': isExactActive }">{{ section.title }}</span></RouterLink>
        </nav>
        <div class="ml-auto"><ThemeSwitch /></div>
      </div>
    </header>
    <main id="workspace" tabindex="-1" class="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7"><RouterView /></main>
  </div>
</template>
