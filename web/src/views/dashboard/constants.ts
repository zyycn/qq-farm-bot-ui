export const MODULES = [
  { label: '所有模块', value: '' },
  { label: '农场', value: 'farm' },
  { label: '好友', value: 'friend' },
  { label: '仓库', value: 'warehouse' },
  { label: '任务', value: 'task' },
  { label: '系统', value: 'system' },
]

export const EVENTS = [
  { label: '所有事件', value: '' },
  { label: '农场巡查', value: 'farm_cycle' },
  { label: '收获作物', value: 'harvest_crop' },
  { label: '清理枯株', value: 'remove_plant' },
  { label: '种植种子', value: 'plant_seed' },
  { label: '施加化肥', value: 'fertilize' },
  { label: '土地推送', value: 'lands_notify' },
  { label: '选择种子', value: 'seed_pick' },
  { label: '购买种子', value: 'seed_buy' },
  { label: '购买化肥', value: 'fertilizer_buy' },
  { label: '开启礼包', value: 'fertilizer_gift_open' },
  { label: '获取任务', value: 'task_scan' },
  { label: '完成任务', value: 'task_claim' },
  { label: '免费礼包', value: 'mall_free_gifts' },
  { label: '分享奖励', value: 'daily_share' },
  { label: '会员礼包', value: 'vip_daily_gift' },
  { label: '月卡礼包', value: 'month_card_gift' },
  { label: '开服红包', value: 'open_server_gift' },
  { label: '图鉴奖励', value: 'illustrated_rewards' },
  { label: '邮箱领取', value: 'email_rewards' },
  { label: '出售成功', value: 'sell_success' },
  { label: '土地升级', value: 'upgrade_land' },
  { label: '土地解锁', value: 'unlock_land' },
  { label: '好友巡查', value: 'friend_cycle' },
  { label: '访问好友', value: 'visit_friend' },
]

export const LOG_LEVELS = [
  { label: '所有等级', value: '' },
  { label: '普通', value: 'info' },
  { label: '警告', value: 'warn' },
]

export const OP_META: Record<string, { label: string, icon: string }> = {
  harvest: { label: '收获', icon: 'i-twemoji-sheaf-of-rice' },
  water: { label: '浇水', icon: 'i-twemoji-droplet' },
  weed: { label: '除草', icon: 'i-twemoji-herb' },
  bug: { label: '除虫', icon: 'i-twemoji-bug' },
  fertilize: { label: '施肥', icon: 'i-twemoji-test-tube' },
  plant: { label: '种植', icon: 'i-twemoji-seedling' },
  upgrade: { label: '土地升级', icon: 'i-twemoji-building-construction' },
  levelUp: { label: '账号升级', icon: 'i-twemoji-star' },
  steal: { label: '偷菜', icon: 'i-twemoji-ninja' },
  helpWater: { label: '帮浇水', icon: 'i-twemoji-sweat-droplets' },
  helpWeed: { label: '帮除草', icon: 'i-twemoji-four-leaf-clover' },
  helpBug: { label: '帮除虫', icon: 'i-twemoji-lady-beetle' },
  taskClaim: { label: '任务', icon: 'i-twemoji-check-mark-button' },
  sell: { label: '出售', icon: 'i-twemoji-coin' },
}
