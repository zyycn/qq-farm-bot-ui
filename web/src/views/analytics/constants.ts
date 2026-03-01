export const SORT_OPTIONS = [
  { value: 'exp', label: '经验/小时' },
  { value: 'fert', label: '普通肥经验/小时' },
  { value: 'profit', label: '利润/小时' },
  { value: 'fert_profit', label: '普通肥利润/小时' },
  { value: 'level', label: '等级' },
]

export const SORT_ICONS: Record<string, string> = {
  exp: 'i-twemoji-star',
  fert: 'i-twemoji-test-tube',
  profit: 'i-twemoji-coin',
  fert_profit: 'i-twemoji-money-bag',
  level: 'i-twemoji-trophy',
}

export const METRIC_MAP: Record<string, string> = {
  exp: 'expPerHour',
  fert: 'normalFertilizerExpPerHour',
  profit: 'profitPerHour',
  fert_profit: 'normalFertilizerProfitPerHour',
  level: 'level',
}

export const COLUMNS = [
  { title: '#', key: 'rank', width: 50, align: 'center' as const, fixed: 'left' as const },
  { title: '作物', dataIndex: 'name', key: 'name', fixed: 'left' as const, width: 150 },
  { title: '生长时间', dataIndex: 'growTime', key: 'growTime', width: 110 },
  { title: '经验/时', dataIndex: 'expPerHour', key: 'expPerHour', width: 100 },
  { title: '肥料经验/时', dataIndex: 'normalFertilizerExpPerHour', key: 'normalFertilizerExpPerHour', width: 120 },
  { title: '净利润/时', dataIndex: 'profitPerHour', key: 'profitPerHour', width: 110 },
  { title: '肥料利润/时', dataIndex: 'normalFertilizerProfitPerHour', key: 'normalFertilizerProfitPerHour', width: 150 },
]

export const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  exp: 'var(--ant-color-info)',
  fert: 'var(--ant-color-info)',
  profit: 'var(--ant-color-warning)',
  fert_profit: 'var(--ant-color-success)',
}
