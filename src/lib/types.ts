// 站点配置接口
export interface Site {
  id: string
  name: string
  url: string
  credentials?: SiteCredentials
  createdAt: string
  updatedAt: string
}

// 站点凭证接口
export interface SiteCredentials {
  type: 'google' | 'custom'
  data: Record<string, unknown>
}

// 缓存的分析数据
export interface CachedData {
  siteId: string
  data: AnalyticsData
  fetchedAt: string
  expiresAt: string
}

// 分析数据接口
export interface AnalyticsData {
  pageViews: number
  visitors: number
  sessions: number
  bounceRate: number
  avgSessionDuration: number
  topPages: PageStat[]
  topReferrers: ReferrerStat[]
  deviceStats: DeviceStat[]
  dailyStats: DailyStat[]
}

// 页面统计
export interface PageStat {
  path: string
  views: number
  avgTime: number
}

// 来源统计
export interface ReferrerStat {
  source: string
  visits: number
  percentage: number
}

// 设备统计
export interface DeviceStat {
  device: 'desktop' | 'mobile' | 'tablet'
  sessions: number
  percentage: number
}

// 每日统计
export interface DailyStat {
  date: string
  pageViews: number
  visitors: number
  sessions: number
}

// 导入数据格式
export interface ImportData {
  sites?: Site[]
  cachedData?: CachedData[]
}
