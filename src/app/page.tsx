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
  }
  gsc: {
    clicks: number
    impressions: number
    ctr: number
    avgPosition: number
  }
}

interface APIData {
  date: string
  lastUpdate: string
  sites: SiteData[]
}

export default function DashboardPage() {
  const [data, setData] = useState<APIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${WORKER_URL}/api/data`)
        if (!response.ok) throw new Error('Failed to fetch data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError('无法加载数据，请检查 Worker 是否正常运行')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const triggerSync = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${WORKER_URL}/api/sync`, { method: 'POST' })
      if (!response.ok) throw new Error('Sync failed')
      // 重新加载数据
      const dataResponse = await fetch(`${WORKER_URL}/api/data`)
      const result = await dataResponse.json()
      setData(result)
    } catch (err) {
      setError('同步失败')
    } finally {
      setLoading(false)
    }
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Analytics</h1>
          <p className="mt-2 text-gray-600">查看所有站点的 GA4/GSC 数据</p>
          {data && (
            <p className="text-sm text-gray-400 mt-1">
              最后更新: {new Date(data.lastUpdate).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
        <button
          onClick={triggerSync}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          立即同步
        </button>
      </div>

      {data?.sites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">暂无数据，请点击"立即同步"获取数据</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.sites.map(site => (
            <div key={site.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-500">{site.domain}</p>
                    <p className="text-xs text-gray-400">数据日期: {site.date}</p>
                  </div>
                  <Link
                    href={`/site?id=${site.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    查看详情 →
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* GA4 Metrics */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-900">
                      {site.ga4.sessions.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">Sessions</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-900">
                      {site.ga4.activeUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">Active Users</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-900">
                      {site.ga4.pageViews.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">Page Views</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-900">
                      {site.ga4.bounceRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-blue-600">Bounce Rate</p>
                  </div>

                  {/* GSC Metrics */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-900">
                      {site.gsc.clicks.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">Clicks</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-900">
                      {site.gsc.impressions.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">Impressions</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-900">
                      {(site.gsc.ctr * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-green-600">CTR</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-900">
                      {site.gsc.avgPosition.toFixed(1)}
                    </p>
                    <p className="text-xs text-green-600">Avg Position</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">API 端点</h3>
        <code className="text-sm text-gray-600 block">{WORKER_URL}/api/data</code>
        <p className="text-xs text-gray-500 mt-1">使用此端点获取数据生成日报</p>
      </div>
    </div>
  )
}
