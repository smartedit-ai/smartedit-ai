import { useState } from 'react'
import { QuickToolsPanel, NotesPanel, AIAssistPanel, PageInfoPanel } from '../content/components/rightSidebar'

type TabId = 'quickTools' | 'notes' | 'aiAssist' | 'pageInfo'

interface TabConfig {
  id: TabId
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

export default function SidePanel() {
  const [activeTab, setActiveTab] = useState<TabId>('quickTools')

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || QuickToolsPanel

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <span className="text-lg">📌</span>
          </div>
          <h2 className="text-white font-semibold text-base">智能助手</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/80">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>v1.0</span>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
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
      <div className="h-10 px-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>智编助手</span>
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
