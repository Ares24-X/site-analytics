'use client'

import { useEffect, useState } from 'react'
import { Site, CachedData } from '@/lib/types'
import { getSites } from '@/lib/storage'
import { getAllCachedData } from '@/lib/cache'

export default function DataExportPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [cache, setCache] = useState<CachedData[]>([])
  const [loading, setLoading] = useState(true)
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    const sitesData = getSites()
    const cacheData = getAllCachedData()
    setSites(sitesData)
    setCache(cacheData)
    setLoading(false)
  }, [])

  const exportData = {
    sites,
    cache,
    exportedAt: new Date().toISOString(),
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `site-analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

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
        <h1 className="text-3xl font-bold text-gray-900">数据导出</h1>
        <p className="mt-2 text-gray-600">查看和导出所有站点数据</p>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500">站点数量</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{sites.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500">缓存数据条目</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{cache.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm font-medium text-gray-500">导出时间</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">操作</h2>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下载 JSON 文件
            </button>
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {showRawData ? '隐藏原始数据' : '显示原始数据'}
            </button>
          </div>
        </div>
      </div>

      {/* 原始 JSON 数据 */}
      {showRawData && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">原始数据 (JSON)</h2>
          </div>
          <div className="px-6 py-4">
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm text-gray-800 max-h-96">
              {JSON.stringify(exportData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 站点列表 */}
      <div className="bg-white shadow rounded-lg mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">站点列表</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {sites.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              暂无站点数据
            </div>
          ) : (
            sites.map((site) => {
              const siteCache = cache.find((c) => c.siteId === site.id)
              return (
                <div key={site.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{site.name}</h3>
                      <p className="text-sm text-gray-500">{site.url}</p>
                    </div>
                    <div className="text-right">
                      {siteCache ? (
                        <div>
                          <p className="text-sm text-gray-900">
                            {siteCache.data.pageViews.toLocaleString()} 页面浏览
                          </p>
                          <p className="text-xs text-gray-500">
                            缓存于 {new Date(siteCache.fetchedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">无缓存数据</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
