import { useState, useEffect } from 'react'

interface PageInfo {
  title: string
  url: string
  hostname: string
  protocol: string
  pathname: string
  description: string
  keywords: string
  author: string
  publishDate: string
  wordCount: number
  imageCount: number
  linkCount: number
}

export default function PageInfoPanel() {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    extractPageInfo()
  }, [])

  const extractPageInfo = () => {
    setIsLoading(true)
    
    try {
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
      const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
      const metaAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content') || ''
      const metaPublishDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || ''
      
      const bodyText = document.body.innerText
      const wordCount = bodyText.replace(/\s/g, '').length
      const imageCount = document.querySelectorAll('img').length
      const linkCount = document.querySelectorAll('a').length

      setPageInfo({
        title: document.title,
        url: window.location.href,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        pathname: window.location.pathname,
        description: metaDescription,
        keywords: metaKeywords,
        author: metaAuthor,
        publishDate: metaPublishDate,
        wordCount,
        imageCount,
        linkCount
      })
    } catch (error) {
      console.error('提取页面信息失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`✅ ${label}已复制`)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">加载页面信息...</p>
        </div>
      </div>
    )
  }

  if (!pageInfo) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <span className="text-4xl mb-2 block">❌</span>
          <p className="text-sm text-gray-500">无法获取页面信息</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">页面信息</h3>
        <p className="text-xs text-gray-500">当前页面的详细信息</p>
      </div>

      <div className="p-4 space-y-4">
        {/* 基本信息 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <span>📄</span>
            <span>基本信息</span>
          </h4>
          
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">标题</div>
              <div className="flex items-start gap-2">
                <div className="flex-1 text-sm text-gray-800 break-words">{pageInfo.title}</div>
                <button
                  onClick={() => copyToClipboard(pageInfo.title, '标题')}
                  className="text-blue-500 hover:text-blue-600 text-xs"
                >
                  复制
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">URL</div>
              <div className="flex items-start gap-2">
                <div className="flex-1 text-xs text-gray-600 break-all">{pageInfo.url}</div>
                <button
                  onClick={() => copyToClipboard(pageInfo.url, 'URL')}
                  className="text-blue-500 hover:text-blue-600 text-xs whitespace-nowrap"
                >
                  复制
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">域名</div>
              <div className="text-sm text-gray-800">{pageInfo.hostname}</div>
            </div>
          </div>
        </div>

        {/* 元数据 */}
        {(pageInfo.description || pageInfo.keywords || pageInfo.author) && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <span>🏷️</span>
              <span>元数据</span>
            </h4>
            
            <div className="space-y-3">
              {pageInfo.description && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">描述</div>
                  <div className="text-sm text-gray-700 leading-relaxed">{pageInfo.description}</div>
                </div>
              )}

              {pageInfo.keywords && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">关键词</div>
                  <div className="text-sm text-gray-700">{pageInfo.keywords}</div>
                </div>
              )}

              {pageInfo.author && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">作者</div>
                  <div className="text-sm text-gray-700">{pageInfo.author}</div>
                </div>
              )}

              {pageInfo.publishDate && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">发布时间</div>
                  <div className="text-sm text-gray-700">
                    {new Date(pageInfo.publishDate).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 统计信息 */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>统计信息</span>
          </h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{pageInfo.wordCount}</div>
              <div className="text-xs text-gray-600 mt-1">字符数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{pageInfo.imageCount}</div>
              <div className="text-xs text-gray-600 mt-1">图片数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{pageInfo.linkCount}</div>
              <div className="text-xs text-gray-600 mt-1">链接数</div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={extractPageInfo}
            className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 刷新信息
          </button>
          <button
            onClick={() => {
              const info = `标题: ${pageInfo.title}\nURL: ${pageInfo.url}\n字符数: ${pageInfo.wordCount}\n图片数: ${pageInfo.imageCount}\n链接数: ${pageInfo.linkCount}`
              copyToClipboard(info, '页面信息')
            }}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            📋
          </button>
        </div>
      </div>
    </div>
  )
}
