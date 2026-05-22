'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Site, CachedData, AnalyticsData } from '@/lib/types'
import { getSite } from '@/lib/storage'
import { getCachedData } from '@/lib/cache'

function SiteDetailContent() {
  const searchParams = useSearchParams()
  const siteId = searchParams.get('id')
  
  const [site, setSite] = useState<Site | null>(null)
  const [cachedData, setCachedData] = useState<CachedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!siteId) {
      setLoading(false)
      return
    }

    const siteData = getSite(siteId)
    setSite(siteData)
    
    if (siteData) {
      const cached = getCachedData(siteId)
      setCachedData(cached)
    }
    
    setLoading(false)
  }, [siteId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!siteId || !site) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">站点未找到</h3>
          <p className="mt-1 text-sm text-gray-500">请检查 URL 参数是否正确</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              返回仪表板
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const data: AnalyticsData = cachedData?.data || {
    pageViews: 0,
    visitors: 0,
    sessions: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topPages: [],
    topReferrers: [],
    deviceStats: [],
    dailyStats: [],
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 返回按钮和标题 */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回仪表板
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{site.name}</h1>
        <p className="mt-2 text-gray-600">{site.url}</p>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="页面浏览量" value={data.pageViews.toLocaleString()} />
        <StatCard title="访客数" value={data.visitors.toLocaleString()} />
        <StatCard title="会话数" value={data.sessions.toLocaleString()} />
        <StatCard title="跳出率" value={`${(data.bounceRate * 100).toFixed(1)}%`} />
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热门页面 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">热门页面</h2>
          </div>
          <div className="px-6 py-4">
            {data.topPages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无数据</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.topPages.map((page, index) => (
                  <li key={index} className="py-3 flex justify-between">
                    <span className="text-sm text-gray-900 truncate">{page.path}</span>
                    <span className="text-sm text-gray-500 ml-4">{page.views.toLocaleString()} 次浏览</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 流量来源 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">流量来源</h2>
          </div>
          <div className="px-6 py-4">
            {data.topReferrers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无数据</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.topReferrers.map((ref, index) => (
                  <li key={index} className="py-3 flex justify-between">
                    <span className="text-sm text-gray-900">{ref.source}</span>
                    <span className="text-sm text-gray-500">{ref.percentage.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 设备分布 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">设备分布</h2>
          </div>
          <div className="px-6 py-4">
            {data.deviceStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {data.deviceStats.map((stat, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-900 capitalize">{stat.device}</span>
                      <span className="text-gray-500">{stat.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 每日趋势 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">每日趋势（最近7天）</h2>
          </div>
          <div className="px-6 py-4">
            {data.dailyStats.length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-2">
                {data.dailyStats.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{day.date}</span>
                    <div className="flex space-x-4">
                      <span className="text-gray-900">{day.pageViews} 浏览</span>
                      <span className="text-gray-500">{day.visitors} 访客</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 缓存信息 */}
      {cachedData && (
        <div className="mt-8 text-sm text-gray-500 text-center">
          数据缓存时间: {new Date(cachedData.fetchedAt).toLocaleString('zh-CN')}
          <br />
          过期时间: {new Date(cachedData.expiresAt).toLocaleString('zh-CN')}
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载中...</p>
      </div>
    </div>
  )
}

export default function SiteDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SiteDetailContent />
    </Suspense>
  )
}
