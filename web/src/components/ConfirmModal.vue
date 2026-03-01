<script setup lang="ts">
defineProps<{
  show: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'primary'
  isAlert?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()
</script>

<template>
  <a-modal
    :open="show"
    :title="title || '确认操作'"
    :confirm-loading="loading"
    :ok-text="confirmText || '确定'"
    :cancel-text="cancelText || '取消'"
    :ok-button-props="type === 'danger' ? { danger: true } : undefined"
    :cancel-button-props="isAlert ? { style: { display: 'none' } } : undefined"
    :mask-closable="!loading"
    centered
    @ok="emit('confirm')"
    @cancel="emit('cancel'); emit('close')"
  >
    <div class="leading-relaxed a-color-text-secondary">
      {{ message || '确定要执行此操作吗？' }}
    </div>
  </a-modal>
</template>
