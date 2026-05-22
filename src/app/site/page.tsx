'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const WORKER_URL = 'https://site-analytics-worker.rmgtlrx.workers.dev'

interface SiteData {
  id: string
  name: string
  domain: string
  date: string
  ga4: {
    sessions: number
    activeUsers: number
    pageViews: number
    avgSessionDuration: number
    bounceRate: number
    topPages: { path: string; views: number }[]
    topCountries: { country: string; users: number }[]
    trafficSources: { source: string; sessions: number }[]
    devices: { device: string; users: number }[]
  }
  gsc: {
    clicks: number
    impressions: number
    ctr: number
    avgPosition: number
    topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
    topPages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[]
  }
}

export default function SiteDetailPage() {
  const [siteId, setSiteId] = useState<string>('')
  const [siteData, setSiteData] = useState<SiteData | null>(null)
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setSiteId(id)
      fetchSiteData(id, date)
    }
  }, [date])

  const fetchSiteData = async (id: string, dataDate: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${WORKER_URL}/api/data?date=${dataDate}`)
      if (!response.ok) throw new Error('Failed to fetch data')
      const result = await response.json()
      const site = result.sites.find((s: SiteData) => s.id === id)
      if (site) {
        setSiteData(site)
      } else {
        setSiteData(null)
      }
    } catch (err) {
      setError('无法加载数据')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}m ${s}s`
  }

  // 获取最近7天的日期
  const getLast7Days = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!siteData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/" className="text-blue-600 hover:underline">← 返回仪表板</Link>
        <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">该日期暂无数据</p>
          <div className="mt-4 flex justify-center gap-2">
            {getLast7Days().map(d => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`px-3 py-1 rounded text-sm ${
                  d === date ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d.slice(5)}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline text-sm">← 返回仪表板</Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{siteData.name}</h1>
            <p className="text-gray-500">{siteData.domain}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">选择日期:</span>
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              {getLast7Days().map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">数据日期: {siteData.date}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Sessions</div>
          <div className="text-2xl font-bold text-gray-900">{siteData.ga4.sessions.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Users</div>
          <div className="text-2xl font-bold text-gray-900">{siteData.ga4.activeUsers.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Clicks</div>
          <div className="text-2xl font-bold text-gray-900">{siteData.gsc.clicks.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Impressions</div>
          <div className="text-2xl font-bold text-gray-900">{siteData.gsc.impressions.toLocaleString()}</div>
        </div>
      </div>

      {/* GA4 Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">GA4 详细数据</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">概览</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions</span>
                <span className="font-medium">{siteData.ga4.sessions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-medium">{siteData.ga4.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Page Views</span>
                <span className="font-medium">{siteData.ga4.pageViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Duration</span>
                <span className="font-medium">{formatDuration(siteData.ga4.avgSessionDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bounce Rate</span>
                <span className="font-medium">{siteData.ga4.bounceRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">热门页面</h3>
            {siteData.ga4.topPages?.length > 0 ? (
              <div className="space-y-2 text-sm">
                {siteData.ga4.topPages.slice(0, 5).map((page, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600 truncate max-w-[200px]">{page.path}</span>
                    <span className="font-medium">{page.views}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无数据</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">流量来源</h3>
            {siteData.ga4.trafficSources?.length > 0 ? (
              <div className="space-y-2 text-sm">
                {siteData.ga4.trafficSources.slice(0, 5).map((source, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600">{source.source}</span>
                    <span className="font-medium">{source.sessions}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无数据</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">国家/地区</h3>
            {siteData.ga4.topCountries?.length > 0 ? (
              <div className="space-y-2 text-sm">
                {siteData.ga4.topCountries.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600">{c.country}</span>
                    <span className="font-medium">{c.users}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      {/* GSC Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">GSC 详细数据</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">概览</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Clicks</span>
                <span className="font-medium">{siteData.gsc.clicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impressions</span>
                <span className="font-medium">{siteData.gsc.impressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CTR</span>
                <span className="font-medium">{(siteData.gsc.ctr * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Position</span>
                <span className="font-medium">{siteData.gsc.avgPosition.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">热门搜索词</h3>
            {siteData.gsc.topQueries?.length > 0 ? (
              <div className="space-y-2 text-sm">
                {siteData.gsc.topQueries.slice(0, 5).map((q, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-600 truncate max-w-[150px]">{q.query}</span>
                    <span className="font-medium">{q.clicks} clicks</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无数据</p>
            )}
          </div>

          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-700 mb-2">热门页面</h3>
            {siteData.gsc.topPages?.length > 0 ? (
              <div className="space-y-2 text-sm">
                {siteData.gsc.topPages.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-600 truncate max-w-[300px]">{p.page}</span>
                    <div className="text-right">
                      <span className="font-medium">{p.clicks} clicks</span>
                      <span className="text-gray-400 ml-2">pos {p.position.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
