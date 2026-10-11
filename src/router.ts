import { createRouter, createWebHashHistory } from 'vue-router'
import WorkspaceView from './views/WorkspaceView.vue'

export const sections = [
  { path: '/', title: 'Расчёт', heading: 'Новая развёртка', description: 'От размеров короба — к проверенной геометрии.' },
  { path: '/layout', title: 'Раскладка', heading: 'Материал и раскладка', description: 'Размещение заготовок с сохранением направления гофры.' },
  { path: '/production', title: 'Производство', heading: 'Производственный маршрут', description: 'Материал, формирование и соединение короба.' },
  { path: '/equipment', title: 'Оборудование', heading: 'Паспорта оборудования', description: 'Профили, форматы подачи и технологические ограничения.' },
  { path: '/diagnostics', title: 'Диагностика', heading: 'Прозрачный расчёт', description: 'Формулы, единицы измерения и причины ограничений.' },
] as const

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...sections.map(section => ({ path: section.path, component: WorkspaceView, meta: section })),
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
