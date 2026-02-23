<script setup lang="ts">
defineProps<{
  label?: string
}>()
const model = defineModel<boolean>()
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2">
    <input
      v-model="model"
      type="checkbox"
      class="h-4 w-4 border-gray-300 rounded text-green-600 dark:border-gray-600 dark:bg-gray-700 focus:ring-green-500 dark:ring-offset-gray-800"
    >
    <span v-if="label" class="select-none text-sm text-gray-700 dark:text-gray-300">
      {{ label }}
    </span>
  </label>
</template>
