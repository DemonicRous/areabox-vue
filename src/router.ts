import { createRouter, createWebHashHistory } from 'vue-router'
import WorkspaceView from './views/WorkspaceView.vue'
import EquipmentView from './views/EquipmentView.vue'
export const sections = [
  { path: '/', title: 'Короб', icon: 'box' },
  { path: '/equipment', title: 'Оборудование', icon: 'equipment' },
] as const
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: WorkspaceView },
    { path: '/equipment', component: EquipmentView },
    { path: '/layout', redirect: '/?view=layout' },
    { path: '/production', redirect: '/?view=route' },
    { path: '/diagnostics', redirect: '/?details=1' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
