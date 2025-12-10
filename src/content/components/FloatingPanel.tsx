// 智编助手 - 现代化浮窗组件
import { useState, useEffect, useRef } from 'react'
import { aiRequest } from '../utils'
import { addCollection } from '../../lib/storage'
import { ObsidianClient, formatAsObsidianNote, ObsidianConfig } from '../../lib/obsidian'

interface FloatingPanelProps {
  isOpen: boolean
  onClose: () => void
  initialText?: string
  initialAction?: 'translate' | 'rewrite' | 'explain'
  position?: { x: number; y: number }
}

// 获取页面信息
function getPageInfo() {
  return {
    title: document.title || '未知页面',
    url: window.location.href,
    hostname: window.location.hostname
  }
}

export default function FloatingPanel({ 
  isOpen, 
  onClose, 
  initialText = '', 
  initialAction = 'translate',
  position 
}: FloatingPanelProps) {
  const [activeTab, setActiveTab] = useState<'translate' | 'rewrite' | 'explain'>(initialAction)
  const [inputText, setInputText] = useState(initialText)
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showActions, setShowActions] = useState(false)
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const pageInfo = useRef(getPageInfo())

  // 初始化位置
  useEffect(() => {
    if (isOpen) {
      if (position) {
        // 确保面板不超出视口
        const panelWidth = 420
        const panelHeight = 500
        const x = Math.min(position.x, window.innerWidth - panelWidth - 20)
        const y = Math.min(position.y, window.innerHeight - panelHeight - 20)
        setPanelPosition({ x: Math.max(20, x), y: Math.max(20, y) })
      } else {
        // 默认居中偏右上
        setPanelPosition({ 
          x: window.innerWidth - 460, 
          y: 100 
        })
      }
      setInputText(initialText)
      setOutputText('')
      
      // 自动开始翻译
      if (initialText && initialAction === 'translate') {
        handleTranslate(initialText)
      }
    }
  }, [isOpen, position, initialText, initialAction])

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.panel-header')) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPanelPosition({
          x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 420)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100))
        })
      }
    }
    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // 翻译处理
  const handleTranslate = async (text?: string) => {
    const textToTranslate = text || inputText
    if (!textToTranslate.trim()) return

    setIsLoading(true)
    setOutputText('')
    try {
      const result = await aiRequest('smart-translate', textToTranslate)
      setOutputText(result || '翻译失败，请重试')
    } catch (error) {
      setOutputText('翻译失败：' + (error as Error).message)
    }
    setIsLoading(false)
  }

  // 复制结果
  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText)
      // 显示复制成功提示
      const btn = document.querySelector('.copy-btn')
      if (btn) {
        btn.textContent = '✓ 已复制'
        setTimeout(() => { btn.textContent = '复制' }, 1500)
      }
    }
  }

  // 检测语言
  const detectLanguage = (text: string) => {
    const chineseRatio = (text.match(/[\u4e00-\u9fa5]/g) || []).length / text.length
    return chineseRatio > 0.3 ? '中文 → 英文' : '英文 → 中文'
  }

  // 生成标题格式：[主域名]-[页面标题]-yyyy-MM-dd-HH-mm-ss
  const generateTitle = (prefix?: string) => {
    const info = pageInfo.current
    const now = new Date()
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`
    // 提取主域名（去掉 www. 前缀）
    const domain = info.hostname.replace(/^www\./, '').split('.')[0]
    // 清理页面标题（去掉特殊字符，限制长度）
    const cleanTitle = info.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 50)
    const titlePrefix = prefix ? `${prefix}-` : ''
    return `${titlePrefix}${domain}-${cleanTitle}-${timestamp}`
  }

  // 收藏到素材库
  const handleCollect = async () => {
    if (!outputText) return
    
    setActionStatus({ type: 'loading', message: '正在收藏...' })
    try {
      const info = pageInfo.current
      const title = generateTitle('翻译')
      await addCollection({
        type: 'quote',
        title,
        content: `## 原文\n${inputText}\n\n## 译文\n${outputText}`,
        source: info.title,
        sourceUrl: info.url,
        tags: ['翻译', info.hostname]
      })
      setActionStatus({ type: 'success', message: '已收藏到素材库' })
      setShowActions(false)
      setTimeout(() => setActionStatus(null), 2000)
    } catch (error) {
      setActionStatus({ type: 'error', message: '收藏失败：' + (error as Error).message })
      setTimeout(() => setActionStatus(null), 3000)
    }
  }

  // 保存到 Obsidian
  const handleSaveToObsidian = async () => {
    if (!outputText) return
    
    setActionStatus({ type: 'loading', message: '正在保存到 Obsidian...' })
    try {
      // 获取 Obsidian 配置
      const result = await chrome.storage.sync.get(['settings'])
      const obsidianConfig: ObsidianConfig = result.settings?.obsidian
      
      if (!obsidianConfig?.enabled) {
        setActionStatus({ type: 'error', message: '请先在设置中启用 Obsidian 集成' })
        setTimeout(() => setActionStatus(null), 3000)
        return
      }

      const client = new ObsidianClient(obsidianConfig)
      const info = pageInfo.current
      
      // 生成笔记标题：[主域名]-[页面标题]-yyyy-MM-dd-HH-mm-ss
      const noteTitle = generateTitle('翻译')
      const noteContent = formatAsObsidianNote(
        noteTitle,
        `## 原文\n\n${inputText}\n\n## 译文\n\n${outputText}\n\n---\n\n*翻译时间：${new Date().toLocaleString()}*`,
        {
          type: '翻译',
          source: info.title,
          sourceUrl: info.url,
          tags: ['翻译', 'AI翻译']
        }
      )

      // 保存到 Obsidian
      const fileName = `${obsidianConfig.defaultPath}/翻译/${noteTitle}`
      const saveResult = await client.saveNote(fileName, noteContent)
      
      if (saveResult.success) {
        setActionStatus({ type: 'success', message: '已保存到 Obsidian' })
        setShowActions(false)
      } else {
        setActionStatus({ type: 'error', message: saveResult.error || '保存失败' })
      }
      setTimeout(() => setActionStatus(null), 2000)
    } catch (error) {
      setActionStatus({ type: 'error', message: '保存失败：' + (error as Error).message })
      setTimeout(() => setActionStatus(null), 3000)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      ref={panelRef}
      className="fixed z-[999999] select-none"
      style={{ 
        left: panelPosition.x, 
        top: panelPosition.y,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 主面板 */}
      <div className="w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
           style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
        
        {/* 头部 - 可拖拽区域 */}
        <div className="panel-header bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-4 cursor-move">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-xl">🌐</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">智能翻译</h3>
                <p className="text-white/70 text-xs">{inputText ? detectLanguage(inputText) : '自动检测语言'}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {[
            { id: 'translate', icon: '🌐', label: '翻译' },
            { id: 'rewrite', icon: '✨', label: '润色' },
            { id: 'explain', icon: '💡', label: '解释' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'text-indigo-600 border-b-2 border-indigo-500 bg-white' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-4 space-y-4">
          {/* 原文输入 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">原文</label>
              <span className="text-xs text-gray-400">{inputText.length} 字</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入或粘贴要翻译的文字..."
              className="w-full h-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
              style={{ lineHeight: '1.6' }}
            />
          </div>

          {/* 翻译按钮 */}
          <button
            onClick={() => handleTranslate()}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>翻译中...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>开始翻译</span>
              </>
            )}
          </button>

          {/* 译文输出 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">译文</label>
              {outputText && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopy}
                    className="copy-btn text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                  >
                    复制
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowActions(!showActions)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors flex items-center gap-1"
                    >
                      更多
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {/* 下拉菜单 */}
                    {showActions && (
                      <div className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10">
                        <button
                          onClick={handleCollect}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                        >
                          <span>⭐</span> 收藏到素材库
                        </button>
                        <button
                          onClick={handleSaveToObsidian}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2 transition-colors"
                        >
                          <span>💎</span> 保存到 Obsidian
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div 
              className={`w-full min-h-[120px] max-h-[200px] overflow-y-auto px-4 py-3 rounded-xl text-sm leading-relaxed ${
                outputText 
                  ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-gray-700' 
                  : 'bg-gray-50 border border-gray-200 text-gray-400'
              }`}
              style={{ lineHeight: '1.8' }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>AI 正在翻译...</span>
                </div>
              ) : outputText || '译文将显示在这里...'}
            </div>
          </div>
        </div>

        {/* 状态提示 */}
        {actionStatus && (
          <div className={`px-4 py-2 text-sm flex items-center gap-2 ${
            actionStatus.type === 'success' ? 'bg-green-50 text-green-700' :
            actionStatus.type === 'error' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {actionStatus.type === 'loading' && (
              <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            )}
            {actionStatus.type === 'success' && <span>✓</span>}
            {actionStatus.type === 'error' && <span>✗</span>}
            <span>{actionStatus.message}</span>
          </div>
        )}

        {/* 来源信息 */}
        {outputText && (
          <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="truncate max-w-[300px]" title={pageInfo.current.url}>
                来源：{pageInfo.current.title}
              </span>
            </div>
          </div>
        )}

        {/* 底部工具栏 */}
        <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>AI 翻译官</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setInputText(''); setOutputText(''); setShowActions(false) }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
            >
              清空
            </button>
            <button 
              onClick={() => {
                if (outputText) {
                  setInputText(outputText)
                  setOutputText('')
                  setShowActions(false)
                }
              }}
              disabled={!outputText}
              className="px-3 py-1.5 text-xs text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              互换
            </button>
          </div>
        </div>
      </div>

      {/* 拖拽提示 */}
      {isDragging && (
        <div className="fixed inset-0 cursor-move z-[-1]" />
      )}
    </div>
  )
}
