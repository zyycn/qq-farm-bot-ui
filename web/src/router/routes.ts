import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { label: '概览', icon: 'i-twemoji-house-with-garden' },
      },
      {
        path: 'personal',
        name: 'personal',
        component: () => import('@/views/personal/index.vue'),
        meta: { label: '个人', icon: 'i-twemoji-farmer' },
      },
      {
        path: 'friends',
        name: 'friends',
        component: () => import('@/views/friends/index.vue'),
        meta: { label: '好友', icon: 'i-twemoji-people-hugging' },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('@/views/analytics/index.vue'),
        meta: { label: '分析', icon: 'i-twemoji-bar-chart' },
      },
      {
        path: 'accounts',
        name: 'accounts',
        component: () => import('@/views/accounts/index.vue'),
        meta: { label: '账号', icon: 'i-twemoji-bust-in-silhouette' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { label: '设置', icon: 'i-twemoji-gear' },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
  },
]

export default routes
