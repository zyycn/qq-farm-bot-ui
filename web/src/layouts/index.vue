<script setup lang="ts">
import LayoutHeader from './components/LayoutHeader.vue'
import Sidebar from './components/Sidebar.vue'
</script>

<template>
  <a-layout class="h-[100dvh] w-screen a-bg-layout">
    <Sidebar />

    <a-layout>
      <LayoutHeader />

      <a-layout-content class="overflow-y-auto p-3">
        <div class="min-h-full md:h-full">
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
