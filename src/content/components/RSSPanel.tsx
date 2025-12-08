import { useState, useEffect } from 'react'

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  source: string
}

interface RSSPanelProps {
  themeColor: string
}

export default function RSSPanel({ themeColor }: RSSPanelProps) {
  const [items, setItems] = useState<RSSItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<RSSItem | null>(null)
  const [filterSource, setFilterSource] = useState<string>('all')

  // 获取 RSS 内容
  const fetchRSS = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      if (!chrome?.runtime?.sendMessage) {
        throw new Error('扩展连接已断开，请刷新页面')
      }
      
      const response = await chrome.runtime.sendMessage({ type: 'FETCH_RSS' })
      
      if (response?.success) {
        setItems(response.data || [])
        if (response.data?.length === 0) {
          setError('暂无内容，请先在设置中添加 RSS 订阅源')
        }
      } else {
        throw new Error(response?.error || '获取失败')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    fetchRSS()
  }, [])

  // 获取所有来源
  const sources = Array.from(new Set(items.map(item => item.source)))

  // 过滤后的列表
  const filteredItems = filterSource === 'all' 
    ? items 
    : items.filter(item => item.source === filterSource)

  // 格式化时间
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(hours / 24)
      
      if (hours < 1) return '刚刚'
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`
      return date.toLocaleDateString('zh-CN')
    } catch {
      return dateStr
    }
  }

  // 插入标题到编辑器
  const insertTitle = (title: string) => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }
    
    const html = `<p style="font-size:16px;font-weight:bold;color:${themeColor};margin:16px 0">${title}</p>`
    
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        document.execCommand('insertHTML', false, html)
        return
      }
    }
    editor.innerHTML += html
  }

  // 插入摘要到编辑器
  const insertContent = (item: RSSItem) => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }
    
    const html = `
      <section style="margin:20px 0;padding:16px;background:#f8f9fa;border-left:4px solid ${themeColor};border-radius:4px">
        <p style="font-size:15px;font-weight:bold;color:#333;margin:0 0 8px 0">${item.title}</p>
        <p style="font-size:14px;color:#666;margin:0 0 8px 0;line-height:1.6">${item.description}</p>
        <p style="font-size:12px;color:#999;margin:0">来源：${item.source}</p>
      </section>
    `
    
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        document.execCommand('insertHTML', false, html)
        return
      }
    }
    editor.innerHTML += html
  }

  // 复制内容
  const copyContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('已复制到剪贴板')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部操作栏 */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">📰 RSS 订阅</span>
          <span className="text-xs text-gray-400">({filteredItems.length})</span>
        </div>
        <button
          onClick={fetchRSS}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="刷新"
        >
          <span className={isLoading ? 'animate-spin inline-block' : ''}>🔄</span>
        </button>
      </div>

      {/* 来源筛选 */}
      {sources.length > 1 && (
        <div className="px-4 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              filterSource === 'all'
                ? 'bg-[#07C160] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {sources.map(source => (
            <button
              key={source}
              onClick={() => setFilterSource(source)}
              className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                filterSource === source
                  ? 'bg-[#07C160] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#07C160] rounded-full animate-spin mb-3"></div>
            <span className="text-sm">正在获取订阅内容...</span>
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <span className="text-3xl mb-2">📭</span>
            <span className="text-sm text-center px-4">{error}</span>
            <button
              onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
              className="mt-3 text-xs text-[#07C160] hover:underline"
            >
              前往设置添加订阅源
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredItems.map((item, index) => (
              <div
                key={`${item.link}-${index}`}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded">{item.source}</span>
                      <span>{formatDate(item.pubDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 文章详情弹窗 */}
      {selectedItem && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          {/* 弹窗头部 */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setSelectedItem(null)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              ← 返回
            </button>
            <a
              href={selectedItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#07C160] hover:underline"
            >
              查看原文 ↗
            </a>
          </div>

          {/* 弹窗内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              {selectedItem.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{selectedItem.source}</span>
              <span>{formatDate(selectedItem.pubDate)}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {selectedItem.description}
            </p>
          </div>

          {/* 弹窗操作栏 */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => insertTitle(selectedItem.title)}
                className="py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                📝 插入标题
              </button>
              <button
                onClick={() => insertContent(selectedItem)}
                className="py-2 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] transition-colors"
              >
                📄 插入引用
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copyContent(selectedItem.title)}
                className="py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                📋 复制标题
              </button>
              <button
                onClick={() => copyContent(`${selectedItem.title}\n\n${selectedItem.description}\n\n来源：${selectedItem.source}`)}
                className="py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                📋 复制全部
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
