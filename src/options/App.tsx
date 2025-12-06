import { useState, useEffect } from 'react'

interface Settings {
  themeColor: string
  showFloatingToolbar: boolean
  autoInsertStyle: boolean
  showSelectionToolbar: boolean
  aiProvider: string
  apiKey: string
  customBaseUrl: string
  customModel: string
  unsplashKey: string
  pixabayKey: string
}

const defaultSettings: Settings = {
  themeColor: '#07C160',
  showFloatingToolbar: true,
  autoInsertStyle: true,
  showSelectionToolbar: true,
  aiProvider: 'openai',
  apiKey: '',
  customBaseUrl: '',
  customModel: '',
  unsplashKey: '',
  pixabayKey: '',
}

// AI 服务提供商配置
const AI_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    description: 'GPT-3.5 / GPT-4 / GPT-4o',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx',
    docUrl: 'https://platform.openai.com/api-keys'
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    description: 'DeepSeek-V3 / DeepSeek-Chat',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx',
    docUrl: 'https://platform.deepseek.com/api_keys'
  },
  { 
    id: 'aliyun', 
    name: '阿里云百炼', 
    description: 'Qwen-Max / Qwen-Plus / Qwen-Turbo',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long'],
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx',
    docUrl: 'https://bailian.console.aliyun.com/'
  },
  { 
    id: 'siliconflow', 
    name: '硅基流动', 
    description: 'Qwen / DeepSeek / GLM 等多模型',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
    models: ['Qwen/Qwen2.5-7B-Instruct', 'deepseek-ai/DeepSeek-V3', 'THUDM/glm-4-9b-chat'],
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx',
    docUrl: 'https://cloud.siliconflow.cn/account/ak'
  },
  { 
    id: 'moonshot', 
    name: '月之暗面 Kimi', 
    description: 'Moonshot-v1 系列',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx',
    docUrl: 'https://platform.moonshot.cn/console/api-keys'
  },
  { 
    id: 'zhipu', 
    name: '智谱 AI', 
    description: 'GLM-4 / GLM-4-Flash',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: ['glm-4', 'glm-4-flash', 'glm-4-plus'],
    keyPlaceholder: 'xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx',
    docUrl: 'https://open.bigmodel.cn/usercenter/apikeys'
  },
  { 
    id: 'custom', 
    name: '自定义配置', 
    description: '自定义 API 地址和模型',
    baseUrl: '',
    defaultModel: '',
    models: [],
    keyPlaceholder: 'your-api-key',
    docUrl: ''
  },
]

export default function App() {
  const [activeSection, setActiveSection] = useState('general')
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null)

  useEffect(() => {
    chrome.storage.sync.get('settings', (result) => {
      if (result.settings) {
        setSettings({ ...defaultSettings, ...result.settings })
      }
    })
  }, [])

  const saveSettings = async () => {
    await chrome.storage.sync.set({ settings })
    showNotification('设置已保存')
  }

  const resetSettings = async () => {
    if (confirm('确定要恢复默认设置吗？')) {
      setSettings(defaultSettings)
      await chrome.storage.sync.set({ settings: defaultSettings })
      showNotification('已恢复默认设置')
    }
  }

  const testAI = async () => {
    // 先验证必填项
    if (!settings.apiKey) {
      setTestResult({ status: 'error', message: '✗ 请先填写 API Key' })
      return
    }
    if (settings.aiProvider === 'custom' && !settings.customBaseUrl) {
      setTestResult({ status: 'error', message: '✗ 请先填写 Base URL' })
      return
    }
    if (settings.aiProvider === 'custom' && !settings.customModel) {
      setTestResult({ status: 'error', message: '✗ 请先填写模型名称' })
      return
    }

    setTestResult({ status: 'loading', message: '测试中...' })
    
    try {
      // 先保存当前设置，再测试
      await chrome.storage.sync.set({ settings })
      
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        data: { action: 'test', text: '你好' }
      })
      if (response.success) {
        setTestResult({ status: 'success', message: '✓ 连接成功！' })
      } else {
        setTestResult({ status: 'error', message: `✗ ${response.error}` })
      }
    } catch (error) {
      setTestResult({ status: 'error', message: `✗ ${(error as Error).message}` })
    }
  }

  const showNotification = (message: string) => {
    const notification = document.createElement('div')
    notification.className = 'fixed top-5 right-5 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in'
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2000)
  }

  const navItems = [
    { id: 'general', icon: '⚙️', label: '通用设置' },
    { id: 'ai', icon: '✨', label: 'AI 配置' },
    { id: 'images', icon: '🖼️', label: '图片服务' },
    { id: 'about', icon: 'ℹ️', label: '关于' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <div>
            <h1 className="text-2xl font-semibold">智编助手</h1>
            <p className="text-sm opacity-90">SmartEdit AI - 设置中心</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto flex bg-white shadow-sm min-h-[600px]">
        {/* Sidebar */}
        <nav className="w-56 bg-gray-50 border-r border-gray-200 py-5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3.5 text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-primary-light text-primary border-r-2 border-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-8">
          {activeSection === 'general' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">通用设置</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-800">默认主题色</div>
                    <div className="text-sm text-gray-500">设置样式库的默认主题颜色</div>
                  </div>
                  <input
                    type="color"
                    value={settings.themeColor}
                    onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                    className="w-12 h-9 border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-800">显示悬浮工具栏</div>
                    <div className="text-sm text-gray-500">在微信编辑器页面左侧显示快捷工具栏</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showFloatingToolbar}
                      onChange={(e) => setSettings({ ...settings, showFloatingToolbar: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-800">划词工具栏</div>
                    <div className="text-sm text-gray-500">选中文字时显示 AI 改写工具栏</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showSelectionToolbar}
                      onChange={(e) => setSettings({ ...settings, showSelectionToolbar: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'ai' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">AI 配置</h2>
              <div className="space-y-6">
                {/* AI 服务提供商选择 */}
                <div className="py-4 border-b border-gray-100">
                  <div className="font-medium text-gray-800 mb-3">AI 服务提供商</div>
                  <div className="grid grid-cols-2 gap-3">
                    {AI_PROVIDERS.map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => setSettings({ ...settings, aiProvider: provider.id })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          settings.aiProvider === provider.id
                            ? 'border-primary bg-primary-light'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="font-medium text-gray-800">{provider.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{provider.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 当前选择的提供商信息 */}
                {(() => {
                  const currentProvider = AI_PROVIDERS.find(p => p.id === settings.aiProvider)
                  if (!currentProvider) return null
                  
                  return (
                    <>
                      {/* API Key */}
                      <div className="py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-800">API Key</div>
                          {currentProvider.docUrl && (
                            <a 
                              href={currentProvider.docUrl} 
                              target="_blank" 
                              className="text-xs text-primary hover:underline"
                            >
                              获取 API Key →
                            </a>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">本地存储，不会上传到任何服务器</div>
                        <div className="flex gap-2">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={settings.apiKey}
                            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                            placeholder={currentProvider.keyPlaceholder}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            {showApiKey ? '隐藏' : '显示'}
                          </button>
                        </div>
                      </div>

                      {/* 自定义配置 */}
                      {settings.aiProvider === 'custom' ? (
                        <>
                          <div className="py-4 border-b border-gray-100">
                            <div className="font-medium text-gray-800 mb-2">Base URL</div>
                            <div className="text-sm text-gray-500 mb-2">API 接口地址（OpenAI 兼容格式）</div>
                            <input
                              type="text"
                              value={settings.customBaseUrl}
                              onChange={(e) => setSettings({ ...settings, customBaseUrl: e.target.value })}
                              placeholder="https://api.example.com/v1"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                            />
                          </div>
                          <div className="py-4 border-b border-gray-100">
                            <div className="font-medium text-gray-800 mb-2">模型名称</div>
                            <div className="text-sm text-gray-500 mb-2">要使用的模型 ID</div>
                            <input
                              type="text"
                              value={settings.customModel}
                              onChange={(e) => setSettings({ ...settings, customModel: e.target.value })}
                              placeholder="gpt-3.5-turbo"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* 模型选择 */}
                          {currentProvider.models.length > 0 && (
                            <div className="py-4 border-b border-gray-100">
                              <div className="font-medium text-gray-800 mb-2">模型选择</div>
                              <select
                                value={settings.customModel || currentProvider.defaultModel}
                                onChange={(e) => setSettings({ ...settings, customModel: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                              >
                                {currentProvider.models.map(model => (
                                  <option key={model} value={model}>{model}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* 高级设置：自定义 Base URL */}
                          <div className="py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-800">自定义 Base URL（可选）</div>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">
                              如需使用代理或自建服务，可覆盖默认地址。留空使用官方地址。
                            </div>
                            <input
                              type="text"
                              value={settings.customBaseUrl}
                              onChange={(e) => setSettings({ ...settings, customBaseUrl: e.target.value })}
                              placeholder={currentProvider.baseUrl}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )
                })()}

                {/* 测试连接 */}
                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl">
                  <button onClick={testAI} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark">
                    测试 AI 连接
                  </button>
                  {testResult && (
                    <span className={testResult.status === 'success' ? 'text-primary' : testResult.status === 'error' ? 'text-red-500' : 'text-gray-500'}>
                      {testResult.message}
                    </span>
                  )}
                </div>

                {/* 使用提示 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-sm font-medium text-blue-800 mb-2">💡 使用提示</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 所有 API Key 仅存储在本地浏览器中，不会上传到任何服务器</li>
                    <li>• 推荐使用 DeepSeek 或硅基流动，性价比高且国内访问稳定</li>
                    <li>• 自定义配置支持任何 OpenAI 兼容的 API 接口</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'images' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">图片服务配置</h2>
              <div className="space-y-6">
                <div className="py-4 border-b border-gray-100">
                  <div className="font-medium text-gray-800 mb-2">Unsplash API Key</div>
                  <div className="text-sm text-gray-500 mb-2">
                    获取地址：<a href="https://unsplash.com/developers" target="_blank" className="text-primary hover:underline">unsplash.com/developers</a>
                  </div>
                  <input
                    type="password"
                    value={settings.unsplashKey}
                    onChange={(e) => setSettings({ ...settings, unsplashKey: e.target.value })}
                    placeholder="Access Key"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="py-4 border-b border-gray-100">
                  <div className="font-medium text-gray-800 mb-2">Pixabay API Key</div>
                  <div className="text-sm text-gray-500 mb-2">
                    获取地址：<a href="https://pixabay.com/api/docs/" target="_blank" className="text-primary hover:underline">pixabay.com/api/docs</a>
                  </div>
                  <input
                    type="password"
                    value={settings.pixabayKey}
                    onChange={(e) => setSettings({ ...settings, pixabayKey: e.target.value })}
                    placeholder="API Key"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </section>
          )}

          {activeSection === 'about' && (
            <section className="text-center py-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" className="w-16 h-16 mx-auto mb-4">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">智编助手 SmartEdit AI</h3>
              <p className="text-gray-500 mb-6">版本 1.0.0</p>
              <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                基于微信公众平台的 AI 增强编辑器插件，提供样式库、AI 写作、配图中心、一键排版等功能。
              </p>
              <div className="bg-gray-50 rounded-xl p-6 max-w-sm mx-auto text-left">
                <h4 className="font-semibold text-gray-800 mb-4">核心功能</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>📝 丰富的样式库，一键插入精美排版</li>
                  <li>🎨 一键换色，快速统一文章风格</li>
                  <li>✨ AI 标题生成，提升文章点击率</li>
                  <li>🔄 AI 划词改写，润色/扩写/缩写</li>
                  <li>🖼️ 配图中心，海量免费图片素材</li>
                </ul>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto flex justify-end gap-3 py-4 px-8 bg-white border-t border-gray-200">
        <button onClick={resetSettings} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
          恢复默认
        </button>
        <button onClick={saveSettings} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark">
          保存设置
        </button>
      </footer>
    </div>
  )
}
