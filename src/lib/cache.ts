import { CachedData, AnalyticsData } from './types'

const CACHE_KEY = 'site_analytics_cache'

// 获取所有缓存数据
export function getAllCachedData(): CachedData[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(CACHE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading cache from localStorage:', error)
    return []
  }
}

// 保存所有缓存数据
export function saveAllCachedData(cache: CachedData[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error saving cache to localStorage:', error)
  }
}

// 获取站点的缓存数据
export function getCachedData(siteId: string): CachedData | null {
  const cache = getAllCachedData()
  const cached = cache.find(c => c.siteId === siteId)
  
  if (!cached) return null
  
  // 检查是否过期
  if (new Date(cached.expiresAt) < new Date()) {
    deleteCachedData(siteId)
    return null
  }
  
  return cached
}

// 设置站点的缓存数据
export function setCachedData(siteId: string, data: AnalyticsData, ttlMinutes: number = 60): void {
  const cache = getAllCachedData()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)
  
  const newCached: CachedData = {
    siteId,
    data,
    fetchedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
  
  // 更新或添加
  const index = cache.findIndex(c => c.siteId === siteId)
  if (index !== -1) {
    cache[index] = newCached
  } else {
    cache.push(newCached)
  }
  
  saveAllCachedData(cache)
}

// 删除站点的缓存数据
export function deleteCachedData(siteId: string): void {
  const cache = getAllCachedData()
  const filtered = cache.filter(c => c.siteId !== siteId)
  saveAllCachedData(filtered)
}

// 清除所有缓存
export function clearAllCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CACHE_KEY)
}

// 清除过期缓存
export function cleanExpiredCache(): void {
  const cache = getAllCachedData()
  const now = new Date()
  const valid = cache.filter(c => new Date(c.expiresAt) >= now)
  saveAllCachedData(valid)
}

// 导出所有数据
export function exportAllData(): { sites: string; cache: string } {
  const sites = localStorage.getItem('site_analytics_sites') || '[]'
  const cache = localStorage.getItem(CACHE_KEY) || '[]'
  return { sites, cache }
}

// 导入数据
export function importData(data: { sites?: string; cache?: string }): void {
  if (data.sites) {
    localStorage.setItem('site_analytics_sites', data.sites)
  }
  if (data.cache) {
    localStorage.setItem(CACHE_KEY, data.cache)
  }
}
