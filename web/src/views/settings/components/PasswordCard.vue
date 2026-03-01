<script setup lang="ts">
defineProps<{
  saving: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

function handleSubmit() {
  emit('submit')
}

const passwordForm = defineModel<{ old: string, new: string, confirm: string }>('passwordForm', { required: true })
</script>

<template>
  <a-card variant="borderless" :classes="{ body: '!p-4' }">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2 text-base font-bold a-color-text">
        <div class="i-twemoji-locked text-base" />
        管理密码
        <span class="ml-1 text-sm font-normal a-color-text-tertiary">建议修改默认密码</span>
      </div>
      <a-button type="primary" size="small" :loading="saving" @click="handleSubmit">
        修改密码
      </a-button>
    </div>
    <a-form layout="vertical">
      <a-form-item label="当前密码">
        <a-input-password v-model:value="passwordForm.old" placeholder="当前管理密码" />
      </a-form-item>
      <a-form-item label="新密码">
        <a-input-password v-model:value="passwordForm.new" placeholder="至少 4 位" />
      </a-form-item>
      <a-form-item label="确认新密码">
        <a-input-password v-model:value="passwordForm.confirm" placeholder="再次输入" />
      </a-form-item>
    </a-form>
  </a-card>
</template>
