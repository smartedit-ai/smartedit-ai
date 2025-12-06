import { useState, useEffect } from 'react'
import { NAV_ITEMS } from './constants'
import { TemplatePanel, MarkdownPanel, AIWritingPanel, ImagePanel, ToolPanel } from './components'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('template')
  const [themeColor, setThemeColor] = useState('#07C160')

  // 注册控制函数到全局
  useEffect(() => {
    const register = (window as unknown as { __SMARTEDIT_REGISTER__?: (ref: { setIsOpen: (open: boolean) => void; setActiveTab: (tab: string) => void }) => void }).__SMARTEDIT_REGISTER__
    if (register) {
      register({ 
        setIsOpen, 
        setActiveTab: (tab: string) => {
          setActiveNav(tab === 'ai' ? 'ai' : tab === 'format' ? 'tool' : 'template')
        }
      })
    }
  }, [])

  return (
    <>
      {/* 左侧固定侧边栏 */}
      <div className={`fixed top-0 left-0 h-screen flex z-[999999] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* 导航栏 */}
        <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3 shadow-sm">
          {/* Logo */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center text-white mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>

          {/* 导航按钮 */}
          <div className="flex-1 flex flex-col gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${
                  activeNav === item.id
                    ? 'bg-[#e8f8ef] text-[#07C160]'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-[9px] mt-0.5">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 底部设置按钮 */}
          <button
            onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
            className="w-10 h-10 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-lg">
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-gray-100">
            <span className="font-medium text-gray-800">
              {NAV_ITEMS.find(n => n.id === activeNav)?.label || '排版'}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          </div>

          {/* 内容面板 */}
          <div className="flex-1 overflow-y-auto">
            {activeNav === 'template' && (
              <TemplatePanel themeColor={themeColor} setThemeColor={setThemeColor} />
            )}

            {activeNav === 'markdown' && (
              <MarkdownPanel themeColor={themeColor} />
            )}

            {activeNav === 'ai' && (
              <AIWritingPanel themeColor={themeColor} />
            )}

            {activeNav === 'image' && (
              <ImagePanel />
            )}

            {activeNav === 'tool' && (
              <ToolPanel themeColor={themeColor} />
            )}
          </div>
        </div>
      </div>

      {/* 右侧悬浮触发按钮（侧边栏关闭时显示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 w-8 h-20 bg-[#07C160] text-white rounded-r-lg shadow-lg flex items-center justify-center hover:bg-[#06AD56] transition-colors z-[999998]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}
    </>
  )
}
