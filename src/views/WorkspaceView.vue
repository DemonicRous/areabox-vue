<script setup lang="ts">
import { useRoute } from 'vue-router'
import BoxDraftForm from '../components/BoxDraftForm.vue'
const route = useRoute()
const milestones = ['Геометрия и формулы', 'Паспорта и ограничения', 'Раскладка и расход материала', 'Экспорт SVG / DXF']
</script>

<template>
  <div class="intro"><p class="eyebrow">РАБОЧАЯ ОБЛАСТЬ / {{ route.meta.title }}</p><h1>{{ route.meta.heading }}</h1><p>{{ route.meta.description }}</p></div>
  <div v-if="route.path === '/'" class="workspace">
    <BoxDraftForm />
    <section class="drawing-panel">
      <div class="panel-heading"><span class="step">02</span><h2>Чертёж развёртки</h2><span class="badge">Следующий этап</span></div>
      <div class="drawing-placeholder">
        <svg viewBox="0 0 580 270" role="img" aria-label="Условная схема развёртки, не расчётный чертёж">
          <path d="M45 95 L70 85 V35 H540 V235 H70 V185 L45 175 Z" fill="#f8faf7" stroke="#3b5b49" stroke-width="2" />
          <path d="M70 85 H540 M70 185 H540 M70 85 V185 M210 35 V235 M305 35 V235 M445 35 V235" fill="none" stroke="#b1714b" stroke-width="1.5" stroke-dasharray="7 5" />
        </svg>
        <p>Место для расчётного чертежа</p><small>Геометрия подключается отдельным модулем.</small>
      </div>
      <p class="form-note">Условная схема показывает назначение раздела. Расчёт площади пока не подключён.</p>
    </section>
  </div>
  <section v-else class="panel empty-panel"><span class="step">В РАЗРАБОТКЕ</span><h2>{{ route.meta.heading }}</h2><p>Раздел подготовлен для переноса и проверки логики AreaBOX.</p><RouterLink to="/">← К параметрам короба</RouterLink></section>
  <section class="roadmap"><div><p class="eyebrow">ОСНОВА ГОТОВА</p><h2>Дальше — расчётное ядро</h2><p>Перенос логики по этапам с проверкой формул и единиц.</p></div><ol><li v-for="(milestone, index) in milestones" :key="milestone"><span>0{{ index + 1 }}</span>{{ milestone }}</li></ol></section>
</template>
