<script setup lang="ts">
import { MenuFoldOutlined, MenuOutlined, MenuUnfoldOutlined } from '@antdv-next/icons'
import { useStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Sidebar from './components/Sidebar.vue'

const appStore = useAppStore()
const router = useRouter()
const adminToken = useStorage('admin_token', '')
const { sidebarCollapsed } = storeToRefs(appStore)

function logout() {
  adminToken.value = ''
  router.push('/login')
}
</script>

<template>
  <a-layout class="h-[100dvh] w-screen a-bg-layout">
    <Sidebar />

    <a-layout>
      <a-layout-header
        class="flex items-center justify-between border-b border-b-solid px-3 a-bg-container a-border-b-border-sec h-12!"
      >
        <div class="flex items-center">
          <a-button class="hidden xl:inline-flex" type="text" @click="appStore.toggleSidebarCollapsed()">
            <template #icon>
              <MenuUnfoldOutlined v-if="sidebarCollapsed" />
              <MenuFoldOutlined v-else />
            </template>
          </a-button>

          <a-button class="xl:hidden" type="text" @click="appStore.toggleSidebar()">
            <template #icon>
              <MenuOutlined />
            </template>
          </a-button>
        </div>

        <a-button
          class="flex items-center hover:shadow-sm"
          color="primary"
          variant="filled"
          @click="logout"
        >
          <div class="i-twemoji-waving-hand text-base" />
          <span>登出</span>
        </a-button>
      </a-layout-header>

      <a-layout-content class="overflow-y-auto p-3">
        <div class="h-full">
          <RouterView v-slot="{ Component, route }">
            <Transition name="slide-fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
