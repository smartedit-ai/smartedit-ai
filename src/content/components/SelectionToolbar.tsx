// 智编助手 - 划词工具栏组件
import { useState, useEffect, useRef, useCallback } from 'react'
import { addCollection } from '../../lib/storage'
import { ObsidianClient, formatAsObsidianNote, ObsidianConfig } from '../../lib/obsidian'

interface SelectionToolbarProps {
  onTranslate: (text: string, position: { x: number; y: number }) => void
}

// 获取页面信息
function getPageInfo() {
  return {
    title: document.title || '未知页面',
    url: window.location.href,
    hostname: window.location.hostname
  }
}

// 生成标题格式
function generateTitle(prefix: string, hostname: string, pageTitle: string) {
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`
  const domain = hostname.replace(/^www\./, '').split('.')[0]
  const cleanTitle = pageTitle.replace(/[\\/:*?"<>|]/g, '-').slice(0, 50)
  return `${prefix}-${domain}-${cleanTitle}-${timestamp}`
}

export default function SelectionToolbar({ onTranslate }: SelectionToolbarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [tooltip, setTooltip] = useState<string | null>(null)
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(['settings'], (result) => {
      setIsEnabled(result.settings?.showSelectionToolbar !== false)
    })

    // 监听设置变化
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.settings?.newValue) {
        setIsEnabled(changes.settings.newValue.showSelectionToolbar !== false)
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  // 监听选中事件
  useEffect(() => {
    if (!isEnabled) return

    const handleMouseUp = (e: MouseEvent) => {
      // 延迟检查，确保选中完成
      setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim()

        // 如果点击在工具栏内，不处理
        if (toolbarRef.current?.contains(e.target as Node)) {
          return
        }

        if (text && text.length > 0) {
          const range = selection?.getRangeAt(0)
          if (range) {
            const rect = range.getBoundingClientRect()
            // 定位到选中文字的右上角
            setPosition({
              x: rect.right + window.scrollX,
              y: rect.top + window.scrollY - 10
            })
            setSelectedText(text)
            setIsVisible(true)
          }
        } else {
          // 点击空白处隐藏
          hideToolbar()
        }
      }, 10)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideToolbar()
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEnabled])

  const hideToolbar = useCallback(() => {
    setIsVisible(false)
    setSelectedText('')
    setTooltip(null)
    setActionStatus(null)
  }, [])

  // 翻译功能
  const handleTranslate = () => {
    if (!selectedText) return
    onTranslate(selectedText, position)
    hideToolbar()
  }

  // 收藏功能
  const handleCollect = async () => {
    if (!selectedText) return
    
    setActionStatus({ type: 'loading', message: '收藏中...' })
    try {
      const info = getPageInfo()
      const title = generateTitle('收藏', info.hostname, info.title)
      await addCollection({
        type: 'quote',
        title,
        content: selectedText,
        source: info.title,
        sourceUrl: info.url,
        tags: ['划词收藏', info.hostname]
      })
      setActionStatus({ type: 'success', message: '已收藏' })
      setTimeout(() => {
        hideToolbar()
      }, 1000)
    } catch (error) {
      setActionStatus({ type: 'error', message: '收藏失败' })
      setTimeout(() => setActionStatus(null), 2000)
    }
  }

  // 保存到 Obsidian
  const handleSaveToObsidian = async () => {
    if (!selectedText) return
    
    setActionStatus({ type: 'loading', message: '保存中...' })
    try {
      const result = await chrome.storage.sync.get(['settings'])
      const obsidianConfig: ObsidianConfig = result.settings?.obsidian
      
      if (!obsidianConfig?.enabled) {
        setActionStatus({ type: 'error', message: '请先启用 Obsidian' })
        setTimeout(() => setActionStatus(null), 2000)
        return
      }

      const client = new ObsidianClient(obsidianConfig)
      const info = getPageInfo()
      const noteTitle = generateTitle('笔记', info.hostname, info.title)
      
      const noteContent = formatAsObsidianNote(
        noteTitle,
        `${selectedText}\n\n---\n\n*收藏时间：${new Date().toLocaleString()}*`,
        {
          type: '划词笔记',
          source: info.title,
          sourceUrl: info.url,
          tags: ['划词收藏']
        }
      )

      const fileName = `${obsidianConfig.defaultPath}/划词笔记/${noteTitle}`
      const saveResult = await client.saveNote(fileName, noteContent)
      
      if (saveResult.success) {
        setActionStatus({ type: 'success', message: '已保存' })
        setTimeout(() => {
          hideToolbar()
        }, 1000)
      } else {
        setActionStatus({ type: 'error', message: '保存失败' })
        setTimeout(() => setActionStatus(null), 2000)
      }
    } catch (error) {
      setActionStatus({ type: 'error', message: '保存失败' })
      setTimeout(() => setActionStatus(null), 2000)
    }
  }

  if (!isVisible || !isEnabled) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[999998] animate-fade-in"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* 主工具栏 */}
      <div className="flex items-center gap-1 px-1.5 py-1.5 bg-white rounded-xl shadow-lg border border-gray-100"
           style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
        
        {/* 翻译按钮 */}
        <button
          onClick={handleTranslate}
          onMouseEnter={() => setTooltip('智能翻译')}
          onMouseLeave={() => setTooltip(null)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-500 hover:text-indigo-600 transition-all group"
          title="智能翻译"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-gray-200" />

        {/* 收藏按钮 */}
        <button
          onClick={handleCollect}
          onMouseEnter={() => setTooltip('收藏到素材库')}
          onMouseLeave={() => setTooltip(null)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-all"
          title="收藏到素材库"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Obsidian 按钮 */}
        <button
          onClick={handleSaveToObsidian}
          onMouseEnter={() => setTooltip('保存到 Obsidian')}
          onMouseLeave={() => setTooltip(null)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-50 text-purple-500 hover:text-purple-600 transition-all"
          title="保存到 Obsidian"
        >
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && !actionStatus && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2.5 py-1 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
          {tooltip}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}

      {/* 状态提示 */}
      {actionStatus && (
        <div className={`absolute left-1/2 -translate-x-1/2 -top-8 px-2.5 py-1 text-xs rounded-lg whitespace-nowrap shadow-lg flex items-center gap-1.5 ${
          actionStatus.type === 'success' ? 'bg-green-500 text-white' :
          actionStatus.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {actionStatus.type === 'loading' && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {actionStatus.type === 'success' && <span>✓</span>}
          {actionStatus.type === 'error' && <span>✗</span>}
          {actionStatus.message}
          <div className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
            actionStatus.type === 'success' ? 'border-t-green-500' :
            actionStatus.type === 'error' ? 'border-t-red-500' :
            'border-t-blue-500'
          }`} />
        </div>
      )}

      {/* 小三角指示器 */}
      <div className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-45 -translate-x-1/2"
           style={{ boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.05)' }} />
    </div>
  )
}
