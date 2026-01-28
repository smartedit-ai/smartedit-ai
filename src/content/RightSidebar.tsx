import { useEffect } from 'react'
import { useRightSidebarStore, RightSidebarTab } from './store/rightSidebarStore'
import { QuickToolsPanel, NotesPanel, AIAssistPanel, PageInfoPanel } from './components/rightSidebar'

const SIDEBAR_WIDTH = 400

interface TabConfig {
  id: RightSidebarTab
  icon: string
  label: string
  component: React.ComponentType
}

const TABS: TabConfig[] = [
  { id: 'quickTools', icon: '🔧', label: '工具', component: QuickToolsPanel },
  { id: 'notes', icon: '📝', label: '笔记', component: NotesPanel },
  { id: 'aiAssist', icon: '✨', label: 'AI', component: AIAssistPanel },
  { id: 'pageInfo', icon: '📄', label: '信息', component: PageInfoPanel },
]

export default function RightSidebar() {
  const { isOpen, activeTab, setIsOpen, setActiveTab } = useRightSidebarStore()

  // 调整页面布局 - 推移式效果
  useEffect(() => {
    const bodyElement = document.body
    
    if (isOpen) {
      // 使用 padding-right 推移页面内容
      // 这是最简单可靠的方式
      bodyElement.style.paddingRight = `${SIDEBAR_WIDTH}px`
      bodyElement.style.transition = 'padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      
      // 防止出现横向滚动条
      bodyElement.style.overflowX = 'hidden'
      
      // 对于某些使用了 fixed 定位的元素，也需要调整
      // 获取所有 fixed 定位的元素（排除我们自己的侧边栏）
      const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el)
        return style.position === 'fixed' && 
               !el.id.includes('smartedit') &&
               el !== bodyElement
      }) as HTMLElement[]
      
      // 保存原始的 right 值
      const originalRightValues = new Map<HTMLElement, string>()
      fixedElements.forEach(el => {
        const style = window.getComputedStyle(el)
        originalRightValues.set(el, el.style.right || '')
        
        // 如果元素有 right 定位，需要调整
        if (style.right !== 'auto' && style.right !== '') {
          const currentRight = parseInt(style.right) || 0
          el.style.right = `${currentRight + SIDEBAR_WIDTH}px`
          el.style.transition = 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      })
      
      return () => {
        bodyElement.style.paddingRight = ''
        bodyElement.style.transition = ''
        bodyElement.style.overflowX = ''
        
        // 恢复 fixed 元素的 right 值
        fixedElements.forEach(el => {
          const originalRight = originalRightValues.get(el)
          if (originalRight !== undefined) {
            el.style.right = originalRight
            el.style.transition = ''
          }
        })
      }
    }
  }, [isOpen])

  // 监听 ESC 键关闭侧边栏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || QuickToolsPanel

  return (
    <div 
      className="fixed top-0 right-0 h-screen bg-white shadow-2xl z-[999998] flex flex-col"
      style={{
        width: `${SIDEBAR_WIDTH}px`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        borderLeft: '1px solid #e5e7eb'
      }}
    >
      {/* 头部 */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <span className="text-lg">📌</span>
          </div>
          <h2 className="text-white font-semibold text-base">智能助手</h2>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          title="关闭 (ESC)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab 导航 */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-medium transition-all flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <ActiveComponent />
      </div>

      {/* 底部状态栏 */}
      <div className="h-10 px-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>智编助手 v1.0</span>
        </div>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ⚙️ 设置
        </button>
      </div>
    </div>
  )
}
