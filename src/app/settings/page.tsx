'use client'

import { useEffect, useState, useRef } from 'react'
import { Site, SiteCredentials, ImportData } from '@/lib/types'
import { getSites, addSite, deleteSite, updateSiteCredentials } from '@/lib/storage'
import { importData, exportAllData } from '@/lib/cache'

export default function SettingsPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSite, setNewSite] = useState({ name: '', url: '' })
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = () => {
    const sitesData = getSites()
    setSites(sitesData)
    setLoading(false)
  }

  const handleAddSite = () => {
    if (!newSite.name || !newSite.url) return
    
    addSite({
      name: newSite.name,
      url: newSite.url.startsWith('http') ? newSite.url : `https://${newSite.url}`,
    })
    
    setNewSite({ name: '', url: '' })
    setShowAddForm(false)
    loadSites()
  }

  const handleDeleteSite = (id: string) => {
    if (confirm('确定要删除这个站点吗？')) {
      deleteSite(id)
      loadSites()
    }
  }

  const handleCredentialUpload = (event: React.ChangeEvent<HTMLInputElement>, siteId: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const credentialData = JSON.parse(content)
        
        const credentials: SiteCredentials = {
          type: 'google',
          data: credentialData,
        }
        
        updateSiteCredentials(siteId, credentials)
        alert('凭证上传成功！')
        loadSites()
      } catch (error) {
        alert('无效的 JSON 文件')
      }
    }
    reader.readAsText(file)
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)
        
        importData({
          sites: data.sites ? JSON.stringify(data.sites) : undefined,
          cache: data.cache ? JSON.stringify(data.cache) : undefined,
        })
        
        alert('数据导入成功！')
        loadSites()
      } catch (error) {
        alert('无效的数据文件')
      }
    }
    reader.readAsText(file)
  }

  const handleExportData = () => {
    const data = exportAllData()
    const exportObj = {
      sites: JSON.parse(data.sites),
      cache: JSON.parse(data.cache),
    }
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `site-analytics-export-${new Date().toISOString().split('T')[0]}.json`
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
        <h1 className="text-3xl font-bold text-gray-900">设置</h1>
        <p className="mt-2 text-gray-600">管理站点和分析配置</p>
      </div>

      {/* 站点管理 */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">站点管理</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            {showAddForm ? '取消' : '添加站点'}
          </button>
        </div>

        {/* 添加站点表单 */}
        {showAddForm && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  站点名称
                </label>
                <input
                  type="text"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="我的网站"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  站点 URL
                </label>
                <input
                  type="text"
                  value={newSite.url}
                  onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="example.com"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddSite}
                  disabled={!newSite.name || !newSite.url}
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 站点列表 */}
        <div className="divide-y divide-gray-200">
          {sites.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              暂无站点，点击上方按钮添加
            </div>
          ) : (
            sites.map((site) => (
              <div key={site.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-500">{site.url}</p>
                    {site.credentials && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                        已配置凭证
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedSite(selectedSite === site.id ? null : site.id)}
                      className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-600 rounded-md"
                    >
                      上传凭证
                    </button>
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded-md"
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                {selectedSite === site.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">
                      上传 JSON 格式的凭证文件（如 Google Analytics 服务账号密钥）
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => handleCredentialUpload(e, site.id)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 数据导入导出 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">数据管理</h2>
        </div>
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导入数据
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
            
            <button
              onClick={handleExportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出数据
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            导入/导出站点配置和分析数据。导出的数据可用于备份或迁移到其他设备。
          </p>
        </div>
      </div>
    </div>
  )
}
