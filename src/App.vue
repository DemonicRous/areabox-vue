<script setup lang="ts">
import { sections } from './router'
</script>

<template>
  <div class="shell">
    <header><RouterLink to="/" class="brand" aria-label="AreaBOX, главная"><span class="brand-mark">▧</span>AreaBOX<span class="version">0.1</span></RouterLink><span class="build-status">Vue 3 · каркас приложения</span></header>
    <nav aria-label="Разделы приложения"><RouterLink v-for="section in sections" :key="section.path" :to="section.path" exact-active-class="selected">{{ section.title }}</RouterLink></nav>
    <main><RouterView /></main>
    <footer><span>AreaBOX / прототип</span><span>Размеры — мм · площадь — м²</span></footer>
  </div>
</template>
