<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

function handleToggle() {
  document.documentElement.classList.add('theme-transition')
  appStore.toggleDark()
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transition')
  }, 400)
}
</script>

<template>
  <a-button
    class="relative flex items-center justify-center overflow-hidden"
    title="切换主题"
    color="primary"
    variant="filled"
    @click="handleToggle"
  >
    <Transition name="theme-icon" mode="out-in">
      <div v-if="isDark" key="dark" class="i-twemoji-crescent-moon" />
      <div v-else key="light" class="i-twemoji-sun" />
    </Transition>
  </a-button>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.25s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
