import { useState } from 'react'

export default function QuickToolsPanel() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const tools = [
    {
      id: 'word-count',
      icon: '📊',
      name: '字数统计',
      desc: '统计页面文字数量',
      action: () => {
        const text = document.body.innerText
        const charCount = text.replace(/\s/g, '').length
        const wordCount = text.trim().split(/\s+/).filter(w => w).length
        alert(`字符数：${charCount}\n词数：${wordCount}`)
      }
    },
    {
      id: 'copy-url',
      icon: '🔗',
      name: '复制链接',
      desc: '复制当前页面链接',
      action: () => {
        navigator.clipboard.writeText(window.location.href)
        alert('✅ 链接已复制')
      }
    },
    {
      id: 'copy-title',
      icon: '📝',
      name: '复制标题',
      desc: '复制页面标题',
      action: () => {
        navigator.clipboard.writeText(document.title)
        alert('✅ 标题已复制')
      }
    },
    {
      id: 'screenshot',
      icon: '📸',
      name: '截图工具',
      desc: '截取页面内容',
      action: () => {
        alert('截图功能开发中...')
      }
    },
    {
      id: 'qrcode',
      icon: '📱',
      name: '生成二维码',
      desc: '生成当前页面二维码',
      action: () => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`
        window.open(qrUrl, '_blank')
      }
    },
    {
      id: 'translate-page',
      icon: '🌐',
      name: '翻译页面',
      desc: '使用 Google 翻译',
      action: () => {
        window.open(`https://translate.google.com/translate?sl=auto&tl=zh-CN&u=${encodeURIComponent(window.location.href)}`, '_blank')
      }
    }
  ]

  return (
    <div className="p-4 space-y-3">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">快捷工具</h3>
        <p className="text-xs text-gray-500">常用的页面操作工具</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setSelectedTool(tool.id)
              tool.action()
              setTimeout(() => setSelectedTool(null), 300)
            }}
            className={`p-3 bg-white border rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left group ${
              selectedTool === tool.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-2xl">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                  {tool.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {tool.desc}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-1">提示</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              点击工具卡片即可快速执行相应操作。更多工具正在开发中...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
