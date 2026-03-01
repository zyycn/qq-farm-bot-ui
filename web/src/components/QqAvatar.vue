<script setup lang="ts">
import { computed } from 'vue'
import { getPlatformIcon } from '@/stores'

const props = withDefaults(
  defineProps<{
    uin?: string | number
    src?: string
    size?: number
    ring?: boolean
    platform?: string
    customClass?: string
    customStyle?: string | Record<string, string>
  }>(),
  {
    size: 36,
    ring: false,
  },
)

const emit = defineEmits<{ error: [] }>()

function handleAvatarError(): boolean {
  emit('error')
  return true
}

const avatarSrc = computed(() => {
  if (props.src)
    return props.src
  const u = String(props.uin ?? '').trim()
  return u ? `https://q1.qlogo.cn/g?b=qq&nk=${u}&s=100` : undefined
})

const iconClass = computed(() => getPlatformIcon(props.platform))

const avatarClass = computed(() => {
  const base = 'shrink-0 bg-green-2'
  const withRing = props.ring ? `${base} ring-2` : base
  return props.customClass ? `${withRing} ${props.customClass}` : withRing
})
</script>

<template>
  <div class="relative flex">
    <a-avatar
      :size="size"
      :src="avatarSrc"
      :class="avatarClass"
      :style="customStyle"
      @error="handleAvatarError"
    >
      <template #icon>
        <div class="i-twemoji-farmer" :class="size >= 40 ? 'text-xl' : ''" />
      </template>
    </a-avatar>
    <div
      v-if="iconClass && platform"
      class="absolute shrink-0 text-[13px] text-primary -bottom-0.7 -right-1"
      :class="iconClass"
    />
  </div>
</template>
