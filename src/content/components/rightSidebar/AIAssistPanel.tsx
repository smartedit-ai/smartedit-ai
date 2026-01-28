import { useState } from 'react'
import { aiRequest } from '../../utils'

export default function AIAssistPanel() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<string>('summarize')

  const actions = [
    { id: 'summarize', icon: '📝', name: '总结', desc: '生成内容摘要' },
    { id: 'translate', icon: '🌐', name: '翻译', desc: '中英互译' },
    { id: 'rewrite', icon: '✨', name: '润色', desc: '优化表达' },
    { id: 'expand', icon: '📖', name: '扩写', desc: '增加细节' },
  ]

  const handleProcess = async () => {
    if (!inputText.trim()) {
      alert('请输入要处理的文本')
      return
    }

    setIsLoading(true)
    setOutputText('')
    
    try {
      const result = await aiRequest(activeAction, inputText)
      setOutputText(result || '处理失败，请重试')
    } catch (error) {
      setOutputText('处理失败：' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText)
      alert('✅ 已复制到剪贴板')
    }
  }

  const handleUseSelection = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SELECTION' }, (response) => {
          if (response?.text) {
            setInputText(response.text)
          }
        })
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">AI 智能助手</h3>
        <p className="text-xs text-gray-500">快速处理文本内容</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 操作选择 */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">选择操作</label>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setActiveAction(action.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    activeAction === action.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{action.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{action.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">{action.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 输入区域 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">输入文本</label>
              <button
                onClick={handleUseSelection}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
              >
                使用选中文字
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入或粘贴要处理的文本..."
              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
              style={{ lineHeight: '1.6' }}
            />
            <div className="text-xs text-gray-400 mt-1">{inputText.length} 字符</div>
          </div>

          {/* 处理按钮 */}
          <button
            onClick={handleProcess}
            disabled={isLoading || !inputText.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium text-sm hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>开始处理</span>
              </>
            )}
          </button>

          {/* 输出区域 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">处理结果</label>
              {outputText && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                >
                  复制结果
                </button>
              )}
            </div>
            <div 
              className={`w-full min-h-[120px] max-h-[200px] overflow-y-auto px-3 py-3 rounded-lg text-sm leading-relaxed ${
                outputText 
                  ? 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 text-gray-700' 
                  : 'bg-gray-50 border border-gray-200 text-gray-400'
              }`}
              style={{ lineHeight: '1.8' }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>AI 正在处理...</span>
                </div>
              ) : outputText || '处理结果将显示在这里...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
