<script setup lang="ts">
defineProps<{
  items: { key: string, icon: string, label: string }[]
  collapsed?: boolean
  activeKey: string
}>()

const emit = defineEmits<{
  menuClick: [path: string]
}>()
</script>

<template>
  <nav class="flex-1 px-3 space-y-1.5" :class="collapsed ? 'px-2' : ''">
    <div
      v-for="item in items"
      :key="item.key"
      class="group flex cursor-pointer items-center rounded-lg transition-all duration-150"
      :class="[
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
        activeKey === item.key
          ? 'a-bg-primary-bg a-color-primary-text font-medium'
          : 'hover:a-bg-fill-tertiary a-color-text-secondary',
      ]"
      @click="emit('menuClick', item.key)"
    >
      <div class="shrink-0 text-[17px] transition-all duration-350 group-hover:scale-115" :class="item.icon" />
      <span v-if="!collapsed" class="truncate text-[14px]">{{ item.label }}</span>
    </div>
  </nav>
</template>
