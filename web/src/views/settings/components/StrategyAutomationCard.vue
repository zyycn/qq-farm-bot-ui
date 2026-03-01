<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { analyticsApi } from '@/api'
import { ANALYTICS_SORT_BY_MAP, FERTILIZER_OPTIONS, PLANTING_STRATEGY_OPTIONS } from '../constants'

const props = defineProps<{
  seeds: any[] | null
  currentAccountId: string | null
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
}>()

function handleSave() {
  emit('save')
}

const localSettings = defineModel<{
  plantingStrategy: string
  preferredSeedId: number
  intervals: { farmMin: number, farmMax: number, friendMin: number, friendMax: number }
  friendQuietHours: { enabled: boolean, start: string, end: string }
  stealCropBlacklist: number[]
  automation: Record<string, boolean | string>
}>('localSettings', { required: true })

const preferredSeedOptions = computed(() => {
  const options = [{ label: '自动选择', value: 0 }]
  if (props.seeds) {
    options.push(
      ...props.seeds.map((seed: any) => ({
        label: `${seed.requiredLevel}级 ${seed.name} (${seed.price}金)`,
        value: seed.seedId,
        disabled: seed.locked || seed.soldOut,
      })),
    )
  }
  return options
})

const stealBlacklistOptions = computed(() => {
  if (!props.seeds || props.seeds.length === 0)
    return []
  return props.seeds.map((seed: any) => ({
    label: `${seed.requiredLevel}级 ${seed.name}`,
    value: seed.seedId,
  }))
})

const strategyPreviewLabel = ref<string | null>(null)

watchEffect(async () => {
  const strategy = localSettings.value.plantingStrategy
  if (strategy === 'preferred') {
    strategyPreviewLabel.value = null
    return
  }
  if (!props.seeds || props.seeds.length === 0) {
    strategyPreviewLabel.value = null
    return
  }
  const available = props.seeds.filter((s: any) => !s.locked && !s.soldOut)
  if (available.length === 0) {
    strategyPreviewLabel.value = '暂无可用种子'
    return
  }
  if (strategy === 'level') {
    const best = [...available].sort((a: any, b: any) => b.requiredLevel - a.requiredLevel)[0]
    strategyPreviewLabel.value = best ? `${best.requiredLevel}级 ${best.name}` : null
    return
  }
  const sortBy = ANALYTICS_SORT_BY_MAP[strategy]
  if (sortBy && props.currentAccountId) {
    try {
      const res = await analyticsApi.fetchAnalytics(sortBy)
      const rankings: any[] = Array.isArray(res) ? res : []
      const availableIds = new Set(available.map((s: any) => s.seedId))
      const match = rankings.find((r: any) => availableIds.has(Number(r.seedId)))
      if (match) {
        const seed = available.find((s: any) => s.seedId === Number(match.seedId))
        strategyPreviewLabel.value = seed ? `${seed.requiredLevel}级 ${seed.name}` : null
      }
      else {
        strategyPreviewLabel.value = '暂无匹配种子'
      }
    }
    catch {
      strategyPreviewLabel.value = null
    }
  }
})
</script>

<template>
  <a-card variant="borderless" class="shrink-0" :classes="{ body: '!p-4' }">
    <div class="mb-3 flex items-center justify-between gap-2 text-base font-bold a-color-text">
      <div class="flex items-center gap-2">
        <div class="i-twemoji-seedling text-base" />
        种植策略与间隔
      </div>
      <a-button type="primary" size="small" :loading="saving" @click="handleSave">
        保存账号设置
      </a-button>
    </div>
    <div class="grid grid-cols-2 gap-x-3 lg:grid-cols-6 md:grid-cols-3">
      <a-form layout="vertical" class="lg:col-span-2">
        <a-form-item label="种植策略">
          <a-select v-model:value="localSettings.plantingStrategy" :options="PLANTING_STRATEGY_OPTIONS" />
        </a-form-item>
      </a-form>
      <a-form v-if="localSettings.plantingStrategy === 'preferred'" layout="vertical" class="lg:col-span-2">
        <a-form-item label="优先种子">
          <a-select v-model:value="localSettings.preferredSeedId" :options="preferredSeedOptions" />
        </a-form-item>
      </a-form>
      <a-form v-else layout="vertical">
        <a-form-item label="策略预览">
          <a-input :value="strategyPreviewLabel ?? '加载中...'" disabled />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="农场最小(秒)">
          <a-input-number v-model:value="localSettings.intervals.farmMin" :min="1" style="width: 100%" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="农场最大(秒)">
          <a-input-number v-model:value="localSettings.intervals.farmMax" :min="1" style="width: 100%" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="好友最小(秒)">
          <a-input-number v-model:value="localSettings.intervals.friendMin" :min="1" style="width: 100%" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="好友最大(秒)">
          <a-input-number v-model:value="localSettings.intervals.friendMax" :min="1" style="width: 100%" />
        </a-form-item>
      </a-form>
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.friendQuietHours.enabled" size="small" />
        <span>好友静默时段</span>
      </label>
      <div class="flex items-center gap-2">
        <a-input
          v-model:value="localSettings.friendQuietHours.start"
          type="time"
          class="w-28"
          :disabled="!localSettings.friendQuietHours.enabled"
        />
        <span class="a-color-text-tertiary">—</span>
        <a-input
          v-model:value="localSettings.friendQuietHours.end"
          type="time"
          class="w-28"
          :disabled="!localSettings.friendQuietHours.enabled"
        />
      </div>
    </div>

    <a-divider />

    <div class="mb-3 flex items-center gap-2 text-base font-bold a-color-text">
      <div class="i-twemoji-robot text-base" />
      自动控制
    </div>
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-5 md:grid-cols-4">
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.farm" size="small" /><span>自动种植收获</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.task" size="small" /><span>自动做任务</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.sell" size="small" /><span>自动卖果实</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.friend" size="small" /><span>自动好友互动</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.farm_push" size="small" /><span>推送触发巡田</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.land_upgrade" size="small" /><span>自动升级土地</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.email" size="small" /><span>自动领取邮件</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.free_gifts" size="small" /><span>自动商城礼包</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.share_reward" size="small" /><span>自动分享奖励</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.vip_gift" size="small" /><span>自动VIP礼包</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.month_card" size="small" /><span>自动月卡奖励</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.open_server_gift" size="small" /><span>自动开服红包</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.fertilizer_gift" size="small" /><span>自动填充化肥</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.fertilizer_buy" size="small" /><span>自动购买化肥</span>
      </label>
    </div>
    <div
      v-if="localSettings.automation.friend"
      class="mt-2 flex flex-wrap gap-6 py-2"
    >
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.friend_steal" size="small" /><span>偷菜</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.friend_help" size="small" /><span>帮忙</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.friend_bad" size="small" /><span>捣乱</span>
      </label>
      <label class="flex cursor-pointer items-center gap-2">
        <a-switch v-model:checked="localSettings.automation.friend_help_exp_limit" size="small" /><span>经验上限停帮</span>
      </label>
    </div>
    <div class="grid grid-cols-1 mt-3 w-full gap-x-3 md:grid-cols-2">
      <a-form layout="vertical">
        <a-form-item label="施肥策略">
          <a-select v-model:value="localSettings.automation.fertilizer" :options="FERTILIZER_OPTIONS" />
        </a-form-item>
      </a-form>
      <a-form layout="vertical">
        <a-form-item label="偷取作物黑名单">
          <a-select
            v-model:value="localSettings.stealCropBlacklist"
            mode="multiple"
            :options="stealBlacklistOptions"
            placeholder="选择不偷取的作物..."
            allow-clear
            :max-tag-count="5"
          />
        </a-form-item>
      </a-form>
    </div>
  </a-card>
</template>
