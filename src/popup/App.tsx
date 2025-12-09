import { useState, useEffect } from 'react'

interface Stats {
  styles: number
  ai: number
  images: number
}

export default function App() {
  const [isActive, setIsActive] = useState(false)
  const [stats, setStats] = useState<Stats>({ styles: 0, ai: 0, images: 0 })

  useEffect(() => {
    // 检查当前标签页状态（排除浏览器内置页面）
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      const url = tab?.url || ''
      const isExcluded = url.startsWith('chrome://') || 
                         url.startsWith('chrome-extension://') || 
                         url.startsWith('edge://') ||
                         url.startsWith('about:') ||
                         url === 'about:blank' ||
                         !url
      setIsActive(!isExcluded)
    })

    // 加载统计数据
    chrome.storage.local.get(['statsStyles', 'statsAI', 'statsImages'], (result) => {
      setStats({
        styles: result.statsStyles || 0,
        ai: result.statsAI || 0,
        images: result.statsImages || 0,
      })
    })
  }, [])

  const sendMessage = async (type: string, tab?: string) => {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!isActive) {
      alert('当前页面不支持使用智编助手')
      return
    }
    if (currentTab?.id) {
      try {
        await chrome.tabs.sendMessage(currentTab.id, { type, tab })
        window.close()
      } catch (error) {
        // Content script 可能未加载，尝试注入
        try {
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content/content.js']
          })
          await chrome.scripting.insertCSS({
            target: { tabId: currentTab.id },
            files: ['content/content.css']
          })
          // 重新发送消息
          setTimeout(async () => {
            await chrome.tabs.sendMessage(currentTab.id!, { type, tab })
            window.close()
          }, 500)
        } catch (injectError) {
          alert('无法加载插件，请刷新页面后重试')
        }
      }
    }
  }

  return (
    <div className="w-80 bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="text-lg font-semibold">智编助手</span>
        </div>
        <span className="text-xs opacity-80 bg-white/20 px-2 py-1 rounded-full">v1.0.0</span>
      </header>

      <main className="p-4">
        {/* Status Card */}
        <div className={`flex items-center gap-3.5 p-4 bg-white rounded-xl shadow-sm mb-4 ${isActive ? 'ring-2 ring-primary/20' : ''}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-400'}`}>
            {isActive ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-800">{isActive ? '已激活' : '不可用'}</div>
            <div className="text-sm text-gray-500">{isActive ? '智编助手已在当前页面运行' : '当前页面不支持'}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">快捷功能</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => sendMessage('TOGGLE_SIDEBAR')} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:bg-primary-light/30 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">打开侧边栏</span>
            </button>
            <button onClick={() => sendMessage('OPEN_TAB', 'ai')} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:bg-primary-light/30 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">AI 标题</span>
            </button>
            <button onClick={() => sendMessage('OPEN_TAB', 'styles')} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:bg-primary-light/30 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">样式库</span>
            </button>
            <button onClick={() => sendMessage('OPEN_TAB', 'format')} className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:bg-primary-light/30 transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary">
                <path d="M21 10H3M21 6H3M21 14H3M21 18H3"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">一键排版</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">使用统计</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.styles}</div>
              <div className="text-xs text-gray-500">样式使用</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.ai}</div>
              <div className="text-xs text-gray-500">AI 生成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.images}</div>
              <div className="text-xs text-gray-500">图片插入</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex gap-2.5 p-3 bg-white border-t border-gray-200">
        <button onClick={() => chrome.runtime.openOptionsPage()} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          设置
        </button>
        <button onClick={() => chrome.tabs.create({ url: 'https://github.com/smartedit/help' })} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          帮助
        </button>
      </footer>
    </div>
  )
}
