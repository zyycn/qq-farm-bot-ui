<script setup lang="ts">
import LandCard from '@/components/LandCard.vue'

defineProps<{
  lands: any[]
  loading: boolean
}>()
</script>

<template>
  <div class="border-t border-t-solid px-4 py-3 a-bg-fill-tertiary a-border-t-border-sec">
    <a-spin v-if="loading" class="py-4 !block" />
    <a-empty
      v-else-if="!lands || lands.length === 0"
      description="无土地数据"
      :image-style="{ height: '36px' }"
    />
    <div v-else class="grid grid-cols-2 gap-2 lg:grid-cols-8 md:grid-cols-5 sm:grid-cols-4">
      <LandCard v-for="land in lands" :key="land.id" :land="land" />
    </div>
  </div>
</template>
