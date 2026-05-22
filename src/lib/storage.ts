import { Site, SiteCredentials } from './types'

const SITES_KEY = 'site_analytics_sites'

// 获取所有站点
export function getSites(): Site[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(SITES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading sites from localStorage:', error)
    return []
  }
}

// 保存所有站点
export function saveSites(sites: Site[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SITES_KEY, JSON.stringify(sites))
  } catch (error) {
    console.error('Error saving sites to localStorage:', error)
  }
}

// 添加站点
export function addSite(site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Site {
  const sites = getSites()
  const newSite: Site = {
    ...site,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  sites.push(newSite)
  saveSites(sites)
  return newSite
}

// 更新站点
export function updateSite(id: string, updates: Partial<Site>): Site | null {
  const sites = getSites()
  const index = sites.findIndex(s => s.id === id)
  if (index === -1) return null
  
  sites[index] = {
    ...sites[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveSites(sites)
  return sites[index]
}

// 删除站点
export function deleteSite(id: string): boolean {
  const sites = getSites()
  const filtered = sites.filter(s => s.id !== id)
  if (filtered.length === sites.length) return false
  saveSites(filtered)
  return true
}

// 获取单个站点
export function getSite(id: string): Site | null {
  const sites = getSites()
  return sites.find(s => s.id === id) || null
}

// 更新站点凭证
export function updateSiteCredentials(id: string, credentials: SiteCredentials): Site | null {
  return updateSite(id, { credentials })
}

// 生成唯一ID
function generateId(): string {
  return `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
