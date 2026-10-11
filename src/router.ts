import { createRouter, createWebHashHistory } from 'vue-router'
import WorkspaceView from './views/WorkspaceView.vue'
import EquipmentView from './views/EquipmentView.vue'
import MaterialView from './views/MaterialView.vue'
export const sections = [
  { path: '/', title: 'Короб', icon: 'box' },
  { path: '/equipment', title: 'Оборудование', icon: 'equipment' },
  { path: '/material', title: 'Материал', icon: 'material' },
] as const
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: WorkspaceView },
    { path: '/equipment', component: EquipmentView },
    { path: '/material', component: MaterialView },
    { path: '/layout', redirect: '/?view=layout' },
    { path: '/production', redirect: '/?view=route' },
    { path: '/diagnostics', redirect: '/?details=1' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
