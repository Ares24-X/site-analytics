'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Site, CachedData } from '@/lib/types'
import { getSites } from '@/lib/storage'
import { getCachedData } from '@/lib/cache'

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [cachedData, setCachedData] = useState<Record<string, CachedData>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      const sitesData = getSites()
      setSites(sitesData)
      
      const cache: Record<string, CachedData> = {}
      sitesData.forEach(site => {
        const cached = getCachedData(site.id)
        if (cached) {
          cache[site.id] = cached
        }
      })
      setCachedData(cache)
      setLoading(false)
    }
    
    loadData()
  }, [])

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
        <p className="mt-2 text-gray-600">查看所有站点的分析数据</p>
      </div>

      {sites.length === 0 ? (
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无站点</h3>
          <p className="mt-1 text-sm text-gray-500">请先添加站点以查看分析数据</p>
          <div className="mt-6">
            <Link
              href="/settings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              添加站点
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map(site => {
            const cached = cachedData[site.id]
            return (
              <Link
                key={site.id}
                href={`/site?id=${site.id}`}
                className="block bg-white rounded-lg shadow card-hover overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {site.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      活跃
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 truncate">{site.url}</p>
                  
                  {cached ? (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {cached.data.pageViews.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">页面浏览</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {cached.data.visitors.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">访客数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {cached.data.sessions.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">会话数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {(cached.data.bounceRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">跳出率</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-center py-4 text-gray-400">
                      <p className="text-sm">暂无缓存数据</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      更新于: {new Date(site.updatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
