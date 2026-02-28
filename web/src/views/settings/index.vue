<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { analyticsApi } from '@/api'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useAccountStore } from '@/stores/account'
import { useFarmStore } from '@/stores/farm'
import { useSettingStore } from '@/stores/setting'

const settingStore = useSettingStore()
const accountStore = useAccountStore()
const farmStore = useFarmStore()

const { settings, loading } = storeToRefs(settingStore)
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { seeds } = storeToRefs(farmStore)

const saving = ref(false)
const passwordSaving = ref(false)
const offlineSaving = ref(false)

const modalVisible = ref(false)
const modalConfig = ref({
  title: '',
  message: '',
  type: 'primary' as 'primary' | 'danger',
  isAlert: true,
})

function showAlert(message: string, type: 'primary' | 'danger' = 'primary') {
  modalConfig.value = {
    title: type === 'danger' ? '错误' : '提示',
    message,
    type,
    isAlert: true,
  }
  modalVisible.value = true
}

const currentAccountName = computed(() => {
  const acc = currentAccount.value
  return acc ? acc.name || acc.nick || acc.id : null
})

const currentAccountUin = computed(() => currentAccount.value?.uin)
const currentAccountAvatar = computed(() => {
  const uin = currentAccountUin.value
  return uin ? `https://q1.qlogo.cn/g?b=qq&nk=${uin}&s=100` : undefined
})

const localSettings = ref({
  plantingStrategy: 'preferred',
  preferredSeedId: 0,
  intervals: { farmMin: 2, farmMax: 2, friendMin: 10, friendMax: 10 },
  friendQuietHours: { enabled: false, start: '23:00', end: '07:00' },
  automation: {
    farm: false,
    task: false,
    sell: false,
    friend: false,
    farm_push: false,
    land_upgrade: false,
    friend_steal: false,
    friend_help: false,
    friend_bad: false,
    friend_help_exp_limit: false,
    email: false,
    fertilizer_gift: false,
    fertilizer_buy: false,
    free_gifts: false,
    share_reward: false,
    vip_gift: false,
    month_card: false,
    open_server_gift: false,
    fertilizer: 'none',
  },
})

const localOffline = ref({
  channel: 'webhook',
  reloginUrlMode: 'none',
  endpoint: '',
  token: '',
  title: '',
  msg: '',
  offlineDeleteSec: 120,
})

const passwordForm = ref({
  old: '',
  new: '',
  confirm: '',
})

function syncLocalSettings() {
  if (settings.value) {
    localSettings.value = JSON.parse(
      JSON.stringify({
        plantingStrategy: settings.value.plantingStrategy,
        preferredSeedId: settings.value.preferredSeedId,
        intervals: settings.value.intervals,
        friendQuietHours: settings.value.friendQuietHours,
        automation: settings.value.automation,
      }),
    )

    if (!localSettings.value.automation) {
      localSettings.value.automation = {
        farm: false,
        task: false,
        sell: false,
        friend: false,
        farm_push: false,
        land_upgrade: false,
        friend_steal: false,
        friend_help: false,
        friend_bad: false,
        friend_help_exp_limit: false,
        email: false,
        fertilizer_gift: false,
        fertilizer_buy: false,
        free_gifts: false,
        share_reward: false,
        vip_gift: false,
        month_card: false,
        open_server_gift: false,
        fertilizer: 'none',
      }
    }
    else {
      const defaults = {
        farm: false,
        task: false,
        sell: false,
        friend: false,
        farm_push: false,
        land_upgrade: false,
        friend_steal: false,
        friend_help: false,
        friend_bad: false,
        friend_help_exp_limit: false,
        email: false,
        fertilizer_gift: false,
        fertilizer_buy: false,
        free_gifts: false,
        share_reward: false,
        vip_gift: false,
        month_card: false,
        open_server_gift: false,
        fertilizer: 'none',
      }
      localSettings.value.automation = {
        ...defaults,
        ...localSettings.value.automation,
      }
    }

    if (settings.value.offlineReminder) {
      localOffline.value = JSON.parse(JSON.stringify(settings.value.offlineReminder))
    }
  }
}

async function loadData() {
  if (currentAccountId.value) {
    await settingStore.fetchSettings(currentAccountId.value)
    syncLocalSettings()
    await farmStore.fetchSeeds(currentAccountId.value)
  }
}

onMounted(() => {
  loadData()
})

watch(currentAccountId, () => {
  loadData()
})

const fertilizerOptions = [
  { label: '普通 + 有机', value: 'both' },
  { label: '仅普通化肥', value: 'normal' },
  { label: '仅有机化肥', value: 'organic' },
  { label: '不施肥', value: 'none' },
]

const plantingStrategyOptions = [
  { label: '优先种植种子', value: 'preferred' },
  { label: '最高等级作物', value: 'level' },
  { label: '最大经验/时', value: 'max_exp' },
  { label: '最大普通肥经验/时', value: 'max_fert_exp' },
  { label: '最大净利润/时', value: 'max_profit' },
  { label: '最大普通肥净利润/时', value: 'max_fert_profit' },
]

const channelOptions = [
  { label: 'Webhook(自定义接口)', value: 'webhook' },
  { label: 'Qmsg 酱', value: 'qmsg' },
  { label: 'Server 酱', value: 'serverchan' },
  { label: 'Push Plus', value: 'pushplus' },
  { label: 'Push Plus Hxtrip', value: 'pushplushxtrip' },
  { label: '钉钉', value: 'dingtalk' },
  { label: '企业微信', value: 'wecom' },
  { label: 'Bark', value: 'bark' },
  { label: 'Go-cqhttp', value: 'gocqhttp' },
  { label: 'OneBot', value: 'onebot' },
  { label: 'Atri', value: 'atri' },
  { label: 'PushDeer', value: 'pushdeer' },
  { label: 'iGot', value: 'igot' },
  { label: 'Telegram', value: 'telegram' },
  { label: '飞书', value: 'feishu' },
  { label: 'IFTTT', value: 'ifttt' },
  { label: '企业微信群机器人', value: 'wecombot' },
  { label: 'Discord', value: 'discord' },
  { label: 'WxPusher', value: 'wxpusher' },
]

const reloginUrlModeOptions = [
  { label: '不需要', value: 'none' },
  { label: 'QQ直链', value: 'qq_link' },
  { label: '二维码链接', value: 'qr_link' },
]

const CHANNEL_DOCS: Record<string, string> = {
  webhook: '',
  qmsg: 'https://qmsg.zendee.cn/',
  serverchan: 'https://sct.ftqq.com/',
  pushplus: 'https://www.pushplus.plus/',
  pushplushxtrip: 'https://pushplus.hxtrip.com/',
  dingtalk: 'https://open.dingtalk.com/document/group/custom-robot-access',
  wecom: 'https://guole.fun/posts/626/',
  wecombot: 'https://developer.work.weixin.qq.com/document/path/91770',
  bark: 'https://github.com/Finb/Bark',
  gocqhttp: 'https://docs.go-cqhttp.org/api/',
  onebot: 'https://docs.go-cqhttp.org/api/',
  atri: 'https://blog.tianli0.top/',
  pushdeer: 'https://www.pushdeer.com/',
  igot: 'https://push.hellyw.com/',
  telegram: 'https://core.telegram.org/bots',
  feishu: 'https://www.feishu.cn/hc/zh-CN/articles/360024984973',
  ifttt: 'https://ifttt.com/maker_webhooks',
  discord: 'https://discord.com/developers/docs/resources/webhook#execute-webhook',
  wxpusher: 'https://wxpusher.zjiecode.com/docs/#/',
}

const currentChannelDocUrl = computed(() => {
  const key = String(localOffline.value.channel || '')
    .trim()
    .toLowerCase()
  return CHANNEL_DOCS[key] || ''
})

function openChannelDocs() {
  const url = currentChannelDocUrl.value
  if (!url)
    return
  window.open(url, '_blank', 'noopener,noreferrer')
}

const preferredSeedOptions = computed(() => {
  const options = [{ label: '自动选择', value: 0 }]
  if (seeds.value) {
    options.push(
      ...seeds.value.map(seed => ({
        label: `${seed.requiredLevel}级 ${seed.name} (${seed.price}金)`,
        value: seed.seedId,
        disabled: seed.locked || seed.soldOut,
      })),
    )
  }
  return options
})

const analyticsSortByMap: Record<string, string> = {
  max_exp: 'exp',
  max_fert_exp: 'fert',
  max_profit: 'profit',
  max_fert_profit: 'fert_profit',
}

const strategyPreviewLabel = ref<string | null>(null)

watchEffect(async () => {
  const strategy = localSettings.value.plantingStrategy
  if (strategy === 'preferred') {
    strategyPreviewLabel.value = null
    return
  }
  if (!seeds.value || seeds.value.length === 0) {
    strategyPreviewLabel.value = null
    return
  }
  const available = seeds.value.filter(s => !s.locked && !s.soldOut)
  if (available.length === 0) {
    strategyPreviewLabel.value = '暂无可用种子'
    return
  }
  if (strategy === 'level') {
    const best = [...available].sort((a, b) => b.requiredLevel - a.requiredLevel)[0]
    strategyPreviewLabel.value = best ? `${best.requiredLevel}级 ${best.name}` : null
    return
  }
  const sortBy = analyticsSortByMap[strategy]
  if (sortBy && currentAccountId.value) {
    try {
      const res = await analyticsApi.fetchAnalytics(sortBy)
      const rankings: any[] = res.data.ok ? res.data.data || [] : []
      const availableIds = new Set(available.map(s => s.seedId))
      const match = rankings.find(r => availableIds.has(Number(r.seedId)))
      if (match) {
        const seed = available.find(s => s.seedId === Number(match.seedId))
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

async function saveAccountSettings() {
  if (!currentAccountId.value)
    return
  saving.value = true
  try {
    const res = await settingStore.saveSettings(currentAccountId.value, localSettings.value)
    if (res.ok) {
      showAlert('账号设置已保存')
    }
    else {
      showAlert(`保存失败: ${res.error}`, 'danger')
    }
  }
  finally {
    saving.value = false
  }
}

async function handleChangePassword() {
  if (!passwordForm.value.old || !passwordForm.value.new) {
    showAlert('请填写完整', 'danger')
    return
  }
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    showAlert('两次密码输入不一致', 'danger')
    return
  }
  if (passwordForm.value.new.length < 4) {
    showAlert('密码长度至少4位', 'danger')
    return
  }

  passwordSaving.value = true
  try {
    const res = await settingStore.changeAdminPassword(passwordForm.value.old, passwordForm.value.new)

    if (res.ok) {
      showAlert('密码修改成功')
      passwordForm.value = { old: '', new: '', confirm: '' }
    }
    else {
      showAlert(`修改失败: ${res.error || '未知错误'}`, 'danger')
    }
  }
  finally {
    passwordSaving.value = false
  }
}

async function handleSaveOffline() {
  offlineSaving.value = true
  try {
    const res = await settingStore.saveOfflineConfig(localOffline.value)

    if (res.ok) {
      showAlert('下线提醒设置已保存')
    }
    else {
      showAlert(`保存失败: ${res.error || '未知错误'}`, 'danger')
    }
  }
  finally {
    offlineSaving.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 overflow-y-auto">
    <a-spin v-if="loading" class="flex-1 items-center justify-center !flex" />

    <template v-else>
      <!-- Section 1: Account Info -->
      <a-card variant="borderless" class="shrink-0" :classes="{ body: '!px-4 !py-3' }">
        <div v-if="currentAccountId" class="flex items-center gap-4">
          <a-avatar
            :size="44"
            :src="currentAccountAvatar"
            class="shrink-0 ring-2"
            style="--un-ring-color: var(--ant-color-primary-bg)"
          >
            <template #icon>
              <div class="i-twemoji-farmer text-xl" />
            </template>
          </a-avatar>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-base font-bold a-color-text">{{ currentAccountName }}</span>
              <a-badge v-if="currentAccount?.running" status="success" text="运行中" />
              <a-badge v-else status="default" text="未运行" />
            </div>
            <div class="mt-0.5 text-sm a-color-text-tertiary">
              UIN: {{ currentAccountUin || '-' }}
            </div>
          </div>
          <a-button type="primary" :loading="saving" @click="saveAccountSettings">
            <div class="i-twemoji-floppy-disk mr-1.5 text-base" />
            保存账号设置
          </a-button>
        </div>
        <div v-else class="flex items-center gap-3 py-1">
          <div class="i-twemoji-gear text-2xl opacity-40" />
          <div>
            <div class="text-base font-medium a-color-text-secondary">
              未选择账号
            </div>
            <div class="text-sm a-color-text-tertiary">
              请先在侧边栏选择一个账号来配置设置
            </div>
          </div>
        </div>
      </a-card>

      <!-- Section 2: Strategy -->
      <a-card v-if="currentAccountId" variant="borderless" class="shrink-0" :classes="{ body: '!p-4' }">
        <div class="mb-3 flex items-center gap-2 text-base font-bold a-color-text">
          <div class="i-twemoji-seedling text-base" />
          种植策略与间隔
        </div>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-6 md:grid-cols-3">
          <a-form layout="vertical" class="lg:col-span-2">
            <a-form-item label="种植策略">
              <a-select v-model:value="localSettings.plantingStrategy" :options="plantingStrategyOptions" />
            </a-form-item>
          </a-form>
          <a-form v-if="localSettings.plantingStrategy === 'preferred'" layout="vertical" class="lg:col-span-2">
            <a-form-item label="优先种子">
              <a-select v-model:value="localSettings.preferredSeedId" :options="preferredSeedOptions" />
            </a-form-item>
          </a-form>
          <div v-else class="flex flex-col gap-1 lg:col-span-2">
            <span class="text-sm a-color-text-secondary">策略预览</span>
            <div class="h-8 flex items-center rounded-lg px-3 text-base a-color-text a-bg-fill-tertiary">
              {{ strategyPreviewLabel ?? '加载中...' }}
            </div>
          </div>
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
        <div class="flex flex-wrap items-center gap-4 border-t border-t-solid pt-3 a-border-t-border-sec">
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
      </a-card>

      <!-- Section 3: Automation -->
      <a-card v-if="currentAccountId" variant="borderless" class="shrink-0" :classes="{ body: '!p-4' }">
        <div class="mb-3 flex items-center gap-2 text-base font-bold a-color-text">
          <div class="i-twemoji-robot text-base" />
          自动控制
        </div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-1 lg:grid-cols-5 md:grid-cols-4">
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.farm" size="small" /><span>自动种植收获</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.task" size="small" /><span>自动做任务</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.sell" size="small" /><span>自动卖果实</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.friend" size="small" /><span>自动好友互动</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.farm_push" size="small" /><span>推送触发巡田</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.land_upgrade" size="small" /><span>自动升级土地</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.email" size="small" /><span>自动领取邮件</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.free_gifts" size="small" /><span>自动商城礼包</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.share_reward" size="small" /><span>自动分享奖励</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.vip_gift" size="small" /><span>自动VIP礼包</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.month_card" size="small" /><span>自动月卡奖励</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.open_server_gift" size="small" /><span>自动开服红包</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.fertilizer_gift" size="small" /><span>自动填充化肥</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors">
            <a-switch v-model:checked="localSettings.automation.fertilizer_buy" size="small" /><span>自动购买化肥</span>
          </label>
        </div>

        <div
          v-if="localSettings.automation.friend"
          class="mt-2 flex flex-wrap gap-3 rounded-lg px-3 py-2 a-bg-primary-bg"
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
            <a-switch v-model:checked="localSettings.automation.friend_help_exp_limit" size="small" /><span
              class="text-base"
            >经验上限停帮</span>
          </label>
        </div>

        <div class="mt-3 w-full md:w-1/4">
          <a-form layout="vertical">
            <a-form-item label="施肥策略">
              <a-select v-model:value="localSettings.automation.fertilizer" :options="fertilizerOptions" />
            </a-form-item>
          </a-form>
        </div>
      </a-card>

      <!-- Section 4: System -->
      <div class="grid grid-cols-1 shrink-0 gap-3 md:grid-cols-2">
        <!-- Password -->
        <a-card variant="borderless" :classes="{ body: '!p-4' }">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-2 text-base font-bold a-color-text">
              <div class="i-twemoji-locked text-base" />
              管理密码
              <span class="ml-1 text-sm font-normal a-color-text-tertiary">建议修改默认密码</span>
            </div>
            <a-button type="primary" :loading="passwordSaving" @click="handleChangePassword">
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

        <!-- Offline Reminder -->
        <a-card variant="borderless" :classes="{ body: '!p-4' }">
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-2 text-base font-bold a-color-text">
              <div class="i-twemoji-bell text-base" />
              下线提醒
            </div>
            <a-button type="primary" :loading="offlineSaving" @click="handleSaveOffline">
              保存提醒设置
            </a-button>
          </div>
          <a-form layout="vertical">
            <div class="grid grid-cols-2 gap-x-3">
              <a-form-item label="推送渠道">
                <div class="flex items-center gap-2">
                  <a-select v-model:value="localOffline.channel" :options="channelOptions" class="flex-1" />
                  <a-tooltip v-if="currentChannelDocUrl" title="查看渠道文档" placement="top">
                    <a-button size="small" @click="openChannelDocs">
                      <div class="i-twemoji-open-book" />
                    </a-button>
                  </a-tooltip>
                </div>
              </a-form-item>
              <a-form-item label="重登录链接">
                <a-select v-model:value="localOffline.reloginUrlMode" :options="reloginUrlModeOptions" />
              </a-form-item>
            </div>
            <div class="grid grid-cols-2 gap-x-3">
              <a-form-item label="接口地址">
                <a-input v-model:value="localOffline.endpoint" :disabled="localOffline.channel !== 'webhook'" />
              </a-form-item>
              <a-form-item label="Token">
                <a-input v-model:value="localOffline.token" placeholder="接收端 token" />
              </a-form-item>
            </div>
            <div class="grid grid-cols-3 gap-x-3">
              <a-form-item label="标题">
                <a-input v-model:value="localOffline.title" placeholder="提醒标题" />
              </a-form-item>
              <a-form-item label="离线删除(秒)">
                <a-input-number
                  v-model:value="localOffline.offlineDeleteSec"
                  :min="1"
                  placeholder="120"
                  style="width: 100%"
                />
              </a-form-item>
              <a-form-item label="内容">
                <a-input v-model:value="localOffline.msg" placeholder="提醒内容" />
              </a-form-item>
            </div>
          </a-form>
        </a-card>
      </div>
    </template>

    <ConfirmModal
      :show="modalVisible"
      :title="modalConfig.title"
      :message="modalConfig.message"
      :type="modalConfig.type"
      :is-alert="modalConfig.isAlert"
      confirm-text="知道了"
      @confirm="modalVisible = false"
      @cancel="modalVisible = false"
    />
  </div>
</template>
