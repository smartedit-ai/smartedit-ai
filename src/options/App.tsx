import { useState, useEffect } from 'react'

// RSS 订阅源接口
interface RSSFeed {
  id: string
  name: string
  url: string
  category: string
  enabled: boolean
  lastFetched?: string
}

// Obsidian 配置接口
interface ObsidianConfig {
  enabled: boolean
  apiUrl: string
  apiKey: string
  defaultPath: string
  autoSync: boolean
}

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
  tavilyKey: string
  // 代理设置
  proxyEnabled: boolean
  proxyUrl: string
  proxyType: 'http' | 'socks5' | 'custom'
  // RSS 订阅设置
  rssFeeds: RSSFeed[]
  rssRefreshInterval: number
  // Obsidian 设置
  obsidian: ObsidianConfig
}

// 预设 RSS 源
const DEFAULT_RSS_FEEDS: RSSFeed[] = [
  { id: '1', name: '少数派', url: 'https://sspai.com/feed', category: '科技', enabled: true },
  { id: '2', name: '36氪', url: 'https://36kr.com/feed', category: '科技', enabled: false },
  { id: '3', name: '虎嗅', url: 'https://www.huxiu.com/rss/0.xml', category: '科技', enabled: false },
  { id: '4', name: '知乎日报', url: 'https://daily.zhihu.com/api/4/news/latest', category: '综合', enabled: false },
]

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
  tavilyKey: '',
  // 代理设置
  proxyEnabled: false,
  proxyUrl: '',
  proxyType: 'http',
  // RSS 订阅设置
  rssFeeds: DEFAULT_RSS_FEEDS,
  rssRefreshInterval: 30,
  // Obsidian 设置
  obsidian: {
    enabled: false,
    apiUrl: 'https://localhost:27124',
    apiKey: '',
    defaultPath: '公众号',
    autoSync: false
  }
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

  // 生成配置模板 Markdown
  const generateConfigTemplate = (currentSettings?: Settings) => {
    const config = currentSettings || defaultSettings
    return `# 智编助手 - 配置文件
# SmartEdit AI Configuration
# 
# 使用说明：
# 1. 填写下方配置项的值（替换 YOUR_xxx 占位符）
# 2. 保存文件后，在设置中心点击"导入配置"
# 3. 选择此文件即可自动更新所有配置
#
# 注意：请妥善保管此文件，其中包含 API 密钥等敏感信息
# ============================================================

## 通用设置
# 主题色（十六进制颜色值）
themeColor: ${config.themeColor || '#07C160'}

# 显示浮动工具栏（true/false）
showFloatingToolbar: ${config.showFloatingToolbar}

# 自动插入样式（true/false）
autoInsertStyle: ${config.autoInsertStyle}

# 显示选中文本工具栏（true/false）
showSelectionToolbar: ${config.showSelectionToolbar}

## AI 配置
# AI 服务提供商（openai/deepseek/moonshot/qwen/zhipu/custom）
aiProvider: ${config.aiProvider || 'openai'}

# API Key（必填）
apiKey: ${config.apiKey || 'YOUR_API_KEY'}

# 自定义 API Base URL（可选，使用自定义服务商时填写）
customBaseUrl: ${config.customBaseUrl || ''}

# 自定义模型名称（可选）
customModel: ${config.customModel || ''}

## 热点搜索配置
# Tavily API Key（用于热点资讯搜索）
# 获取地址：https://tavily.com/
tavilyKey: ${config.tavilyKey || 'YOUR_TAVILY_API_KEY'}

## 图片服务配置
# Unsplash Access Key（用于图片搜索）
# 获取地址：https://unsplash.com/developers
unsplashKey: ${config.unsplashKey || 'YOUR_UNSPLASH_ACCESS_KEY'}

# Pixabay API Key（用于图片搜索）
# 获取地址：https://pixabay.com/api/docs/
pixabayKey: ${config.pixabayKey || 'YOUR_PIXABAY_API_KEY'}

## 网络代理配置
# 启用代理（true/false）
proxyEnabled: ${config.proxyEnabled}

# 代理类型（http/socks5/custom）
proxyType: ${config.proxyType || 'http'}

# 代理地址（例如：http://127.0.0.1:7890）
proxyUrl: ${config.proxyUrl || ''}

# ============================================================
# 配置文件版本：1.0
# 生成时间：${new Date().toLocaleString()}
`
  }

  // 下载配置模板
  const downloadConfigTemplate = () => {
    const content = generateConfigTemplate()
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smartedit-config-template.md'
    a.click()
    URL.revokeObjectURL(url)
    showNotification('配置模板已下载')
  }

  // 导出当前配置
  const exportCurrentConfig = () => {
    const content = generateConfigTemplate(settings)
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smartedit-config-backup-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
    showNotification('配置已导出备份')
  }

  // 解析配置文件
  const parseConfigFile = (content: string): Partial<Settings> => {
    const config: Record<string, string | boolean> = {}
    const lines = content.split('\n')
    
    for (const line of lines) {
      // 跳过注释和空行
      if (line.startsWith('#') || line.trim() === '') continue
      
      const match = line.match(/^(\w+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        const trimmedValue = value.trim()
        
        // 转换布尔值
        if (trimmedValue === 'true') {
          config[key] = true
        } else if (trimmedValue === 'false') {
          config[key] = false
        } else if (!trimmedValue.startsWith('YOUR_')) {
          // 忽略未填写的占位符
          config[key] = trimmedValue
        }
      }
    }
    
    return config as Partial<Settings>
  }

  // 导入配置
  const importConfig = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const content = await file.text()
        const importedConfig = parseConfigFile(content)
        
        // 合并配置
        const newSettings = { ...settings, ...importedConfig }
        setSettings(newSettings as Settings)
        
        // 保存到 storage
        await chrome.storage.sync.set({ settings: newSettings })
        
        showNotification('配置导入成功！')
      } catch (error) {
        alert('配置文件解析失败：' + (error as Error).message)
      }
    }
    input.click()
  }

  const navItems = [
    { id: 'general', icon: '⚙️', label: '通用设置' },
    { id: 'ai', icon: '✨', label: 'AI 配置' },
    { id: 'search', icon: '🔍', label: '热点搜索' },
    { id: 'rss', icon: '📰', label: 'RSS 订阅' },
    { id: 'obsidian', icon: '💎', label: 'Obsidian' },
    { id: 'images', icon: '🖼️', label: '图片服务' },
    { id: 'proxy', icon: '🌐', label: '网络代理' },
    { id: 'backup', icon: '💾', label: '备份恢复' },
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

          {activeSection === 'search' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">热点搜索配置</h2>
              <div className="space-y-6">
                {/* Tavily 配置 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Tavily Search API</div>
                      <div className="text-xs text-gray-500">AI 驱动的实时搜索引擎</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Tavily 是专为 AI 应用设计的搜索 API，可检索最新的网络资讯和热点话题，帮助生成更具时效性的内容。
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-700 mb-1">API Key</div>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.tavilyKey}
                        onChange={(e) => setSettings({ ...settings, tavilyKey: e.target.value })}
                        placeholder="tvly-xxxxxxxxxxxxxxxx"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        {showApiKey ? '隐藏' : '显示'}
                      </button>
                    </div>
                  </div>
                  <a 
                    href="https://app.tavily.com/home" 
                    target="_blank" 
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    获取 API Key →
                  </a>
                </div>

                {/* 功能说明 */}
                <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                  <div className="text-sm font-medium text-purple-800 mb-3">🔥 热点写作功能</div>
                  <div className="space-y-3 text-sm text-purple-700">
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">1.</span>
                      <div>
                        <strong>热点检索</strong>
                        <p className="text-xs text-purple-600 mt-0.5">输入关键词，自动搜索最新相关资讯和热点话题</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">2.</span>
                      <div>
                        <strong>智能标题</strong>
                        <p className="text-xs text-purple-600 mt-0.5">结合热点内容，AI 生成更具吸引力的标题</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-purple-500">3.</span>
                      <div>
                        <strong>内容增强</strong>
                        <p className="text-xs text-purple-600 mt-0.5">将检索到的最新信息融入文章，提升内容时效性</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 使用提示 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-sm font-medium text-blue-800 mb-2">💡 使用说明</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 配置 API Key 后，可在侧边栏「写作」模块使用热点搜索功能</li>
                    <li>• Tavily 提供每月 1000 次免费搜索额度</li>
                    <li>• 搜索结果将自动整合到 AI 写作流程中</li>
                    <li>• API Key 仅存储在本地浏览器中，不会上传到任何服务器</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* RSS 订阅管理 */}
          {activeSection === 'rss' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">RSS 订阅管理</h2>
              <div className="space-y-6">
                {/* 刷新间隔设置 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">⏱️</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">自动刷新间隔</div>
                        <div className="text-xs text-gray-500">设置 RSS 源自动更新的时间间隔</div>
                      </div>
                    </div>
                    <select
                      value={settings.rssRefreshInterval}
                      onChange={(e) => setSettings({ ...settings, rssRefreshInterval: Number(e.target.value) })}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={15}>15 分钟</option>
                      <option value={30}>30 分钟</option>
                      <option value={60}>1 小时</option>
                      <option value={120}>2 小时</option>
                      <option value={360}>6 小时</option>
                    </select>
                  </div>
                </div>

                {/* 添加新订阅源 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">➕</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">添加订阅源</div>
                      <div className="text-xs text-gray-500">输入 RSS 源地址添加新订阅</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="newRssName"
                      placeholder="订阅名称"
                      className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="text"
                      id="newRssUrl"
                      placeholder="RSS 地址 (https://example.com/feed)"
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <select
                      id="newRssCategory"
                      className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="科技">科技</option>
                      <option value="财经">财经</option>
                      <option value="生活">生活</option>
                      <option value="综合">综合</option>
                      <option value="其他">其他</option>
                    </select>
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('newRssName') as HTMLInputElement
                        const urlInput = document.getElementById('newRssUrl') as HTMLInputElement
                        const categorySelect = document.getElementById('newRssCategory') as HTMLSelectElement
                        const name = nameInput?.value.trim()
                        const url = urlInput?.value.trim()
                        const category = categorySelect?.value || '其他'
                        
                        if (!name || !url) {
                          alert('请填写订阅名称和地址')
                          return
                        }
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                          alert('请输入有效的 RSS 地址')
                          return
                        }
                        
                        const newFeed: RSSFeed = {
                          id: Date.now().toString(),
                          name,
                          url,
                          category,
                          enabled: true
                        }
                        setSettings({ ...settings, rssFeeds: [...settings.rssFeeds, newFeed] })
                        nameInput.value = ''
                        urlInput.value = ''
                        alert('订阅源添加成功！')
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* 订阅源列表 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📰</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">订阅源列表</div>
                      <div className="text-xs text-gray-500">管理已添加的 RSS 订阅源（共 {settings.rssFeeds.length} 个）</div>
                    </div>
                  </div>
                  
                  {settings.rssFeeds.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <div>暂无订阅源，请添加</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {settings.rssFeeds.map((feed) => (
                        <div
                          key={feed.id}
                          className={`flex items-center justify-between p-3 bg-white rounded-lg border ${
                            feed.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const updatedFeeds = settings.rssFeeds.map(f =>
                                  f.id === feed.id ? { ...f, enabled: !f.enabled } : f
                                )
                                setSettings({ ...settings, rssFeeds: updatedFeeds })
                              }}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                feed.enabled
                                  ? 'bg-primary border-primary text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {feed.enabled && <span className="text-xs">✓</span>}
                            </button>
                            <div>
                              <div className="font-medium text-gray-800 text-sm">{feed.name}</div>
                              <div className="text-xs text-gray-400 truncate max-w-xs">{feed.url}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {feed.category}
                            </span>
                            <button
                              onClick={() => {
                                if (confirm(`确定删除订阅源「${feed.name}」吗？`)) {
                                  const updatedFeeds = settings.rssFeeds.filter(f => f.id !== feed.id)
                                  setSettings({ ...settings, rssFeeds: updatedFeeds })
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="删除"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 推荐订阅源 */}
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-blue-500">💡</span>
                    <span className="text-sm font-medium text-blue-700">推荐订阅源</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: '少数派', url: 'https://sspai.com/feed', category: '科技' },
                      { name: '36氪', url: 'https://36kr.com/feed', category: '科技' },
                      { name: '虎嗅', url: 'https://www.huxiu.com/rss/0.xml', category: '科技' },
                      { name: 'InfoQ', url: 'https://www.infoq.cn/feed', category: '技术' },
                      { name: '爱范儿', url: 'https://www.ifanr.com/feed', category: '科技' },
                      { name: '极客公园', url: 'https://www.geekpark.net/rss', category: '科技' },
                    ].map((rec) => {
                      const exists = settings.rssFeeds.some(f => f.url === rec.url)
                      return (
                        <button
                          key={rec.url}
                          disabled={exists}
                          onClick={() => {
                            const newFeed: RSSFeed = {
                              id: Date.now().toString(),
                              name: rec.name,
                              url: rec.url,
                              category: rec.category,
                              enabled: true
                            }
                            setSettings({ ...settings, rssFeeds: [...settings.rssFeeds, newFeed] })
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors ${
                            exists
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white hover:bg-blue-100 text-gray-700'
                          }`}
                        >
                          <span>{rec.name}</span>
                          <span className="text-xs">{exists ? '已添加' : '+ 添加'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 使用说明 */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-500">📖</span>
                    <span className="text-sm font-medium text-amber-700">使用说明</span>
                  </div>
                  <ul className="text-xs text-amber-600 space-y-1">
                    <li>• 添加 RSS 订阅源后，可在侧边栏「RSS」模块浏览最新文章</li>
                    <li>• 点击文章可查看详情，支持一键插入或引用到编辑器</li>
                    <li>• 启用/禁用订阅源可控制是否在列表中显示</li>
                    <li>• 部分网站可能因跨域限制无法直接获取，建议使用代理</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Obsidian 集成设置 */}
          {activeSection === 'obsidian' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">Obsidian 集成</h2>
              <div className="space-y-6">
                {/* 功能介绍 */}
                <div className="p-5 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">💎</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Obsidian Local REST API</div>
                      <div className="text-xs text-gray-500">将内容直接保存到 Obsidian 知识库</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    通过 Obsidian Local REST API 插件，可以直接将公众号草稿、收藏的文章保存到你的 Obsidian 知识库中，实现内容的统一管理。
                  </p>
                  <a 
                    href="https://github.com/coddingtonbear/obsidian-local-rest-api" 
                    target="_blank" 
                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline"
                  >
                    📦 安装 Obsidian 插件 →
                  </a>
                </div>

                {/* 启用开关 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-medium text-gray-800">启用 Obsidian 集成</div>
                      <div className="text-xs text-gray-500">开启后可在侧边栏直接保存内容到 Obsidian</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.obsidian?.enabled || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          obsidian: { ...settings.obsidian, enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* API 配置 */}
                {settings.obsidian?.enabled && (
                  <>
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                      <div className="font-medium text-gray-800 mb-2">API 配置</div>
                      
                      {/* API 地址 */}
                      <div>
                        <div className="text-sm text-gray-700 mb-1">API 地址</div>
                        <input
                          type="text"
                          value={settings.obsidian?.apiUrl || 'https://localhost:27124'}
                          onChange={(e) => setSettings({
                            ...settings,
                            obsidian: { ...settings.obsidian, apiUrl: e.target.value }
                          })}
                          placeholder="https://localhost:27124"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-sm"
                        />
                        <div className="text-xs text-gray-400 mt-1">默认端口为 27124，如有修改请对应调整</div>
                      </div>

                      {/* API Key */}
                      <div>
                        <div className="text-sm text-gray-700 mb-1">API Key</div>
                        <div className="flex gap-2">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={settings.obsidian?.apiKey || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              obsidian: { ...settings.obsidian, apiKey: e.target.value }
                            })}
                            placeholder="在 Obsidian 插件设置中获取"
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-sm"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                          >
                            {showApiKey ? '隐藏' : '显示'}
                          </button>
                        </div>
                      </div>

                      {/* 默认保存路径 */}
                      <div>
                        <div className="text-sm text-gray-700 mb-1">默认保存路径</div>
                        <input
                          type="text"
                          value={settings.obsidian?.defaultPath || '公众号'}
                          onChange={(e) => setSettings({
                            ...settings,
                            obsidian: { ...settings.obsidian, defaultPath: e.target.value }
                          })}
                          placeholder="公众号/草稿"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                        />
                        <div className="text-xs text-gray-400 mt-1">相对于 Vault 根目录的路径，如：公众号/草稿</div>
                      </div>

                      {/* 测试连接按钮 */}
                      <button
                        onClick={async () => {
                          if (!settings.obsidian?.apiUrl || !settings.obsidian?.apiKey) {
                            alert('请先填写 API 地址和 API Key')
                            return
                          }
                          try {
                            const response = await fetch(`${settings.obsidian.apiUrl}/`, {
                              method: 'GET',
                              headers: { 'Authorization': `Bearer ${settings.obsidian.apiKey}` }
                            })
                            if (response.ok) {
                              const data = await response.json()
                              alert(`✅ 连接成功！\n\nVault: ${data.name || 'Unknown'}\n认证状态: ${data.authenticated ? '已认证' : '未认证'}`)
                            } else if (response.status === 401) {
                              alert('❌ API Key 无效，请检查配置')
                            } else {
                              alert(`❌ 连接失败: HTTP ${response.status}`)
                            }
                          } catch (error) {
                            alert(`❌ 无法连接到 Obsidian\n\n可能原因：\n1. Obsidian 未运行\n2. Local REST API 插件未启用\n3. API 地址配置错误\n\n错误信息: ${(error as Error).message}`)
                          }
                        }}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        🔗 测试连接
                      </button>
                    </div>

                    {/* 同步设置 */}
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">自动同步</div>
                          <div className="text-xs text-gray-500">保存草稿时自动同步到 Obsidian</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.obsidian?.autoSync || false}
                            onChange={(e) => setSettings({
                              ...settings,
                              obsidian: { ...settings.obsidian, autoSync: e.target.checked }
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* 使用说明 */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-500">📖</span>
                    <span className="text-sm font-medium text-amber-700">配置步骤</span>
                  </div>
                  <ol className="text-xs text-amber-600 space-y-1 list-decimal list-inside">
                    <li>在 Obsidian 中安装 "Local REST API" 插件</li>
                    <li>启用插件并在设置中获取 API Key</li>
                    <li>将 API Key 填入上方配置</li>
                    <li>点击「测试连接」验证配置是否正确</li>
                    <li>配置完成后，可在侧边栏「存储」模块中使用「保存到 Obsidian」功能</li>
                  </ol>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'images' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">图片服务配置</h2>
              <div className="space-y-6">
                {/* Unsplash 配置 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">U</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Unsplash</div>
                      <div className="text-xs text-gray-500">高质量免费图片库</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Unsplash 提供海量高质量免费图片，适合公众号配图使用。
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-700 mb-1">Access Key</div>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.unsplashKey}
                        onChange={(e) => setSettings({ ...settings, unsplashKey: e.target.value })}
                        placeholder="输入 Unsplash Access Key"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        {showApiKey ? '隐藏' : '显示'}
                      </button>
                    </div>
                  </div>
                  <a 
                    href="https://unsplash.com/developers" 
                    target="_blank" 
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    获取 API Key →
                  </a>
                </div>

                {/* Pixabay 配置 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Pixabay</div>
                      <div className="text-xs text-gray-500">免版权图片素材库</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Pixabay 提供丰富的免版权图片、插画和矢量图素材。
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-gray-700 mb-1">API Key</div>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.pixabayKey}
                        onChange={(e) => setSettings({ ...settings, pixabayKey: e.target.value })}
                        placeholder="输入 Pixabay API Key"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        {showApiKey ? '隐藏' : '显示'}
                      </button>
                    </div>
                  </div>
                  <a 
                    href="https://pixabay.com/api/docs/" 
                    target="_blank" 
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    获取 API Key →
                  </a>
                </div>

                {/* 使用提示 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-sm font-medium text-blue-800 mb-2">💡 使用说明</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 配置 API Key 后，可在侧边栏「配图」模块搜索并插入图片</li>
                    <li>• Unsplash 和 Pixabay 图片均可免费商用，无需额外授权</li>
                    <li>• API Key 仅存储在本地浏览器中，不会上传到任何服务器</li>
                    <li>• 建议至少配置一个图片服务以使用配图功能</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'proxy' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">网络代理设置</h2>
              <div className="space-y-6">
                {/* 代理开关 */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">🌐</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">启用网络代理</div>
                        <div className="text-xs text-gray-500">通过代理服务器访问第三方 API</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, proxyEnabled: !settings.proxyEnabled })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.proxyEnabled ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          settings.proxyEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {settings.proxyEnabled && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      {/* 代理类型 */}
                      <div>
                        <div className="text-sm text-gray-700 mb-2">代理类型</div>
                        <div className="flex gap-2">
                          {[
                            { id: 'http', label: 'HTTP/HTTPS', desc: '通用代理' },
                            { id: 'socks5', label: 'SOCKS5', desc: '高级代理' },
                            { id: 'custom', label: '自定义', desc: '完整 URL' },
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => setSettings({ ...settings, proxyType: type.id as 'http' | 'socks5' | 'custom' })}
                              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                settings.proxyType === type.id
                                  ? 'border-primary bg-primary-light'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`text-sm font-medium ${settings.proxyType === type.id ? 'text-primary' : 'text-gray-700'}`}>
                                {type.label}
                              </div>
                              <div className="text-xs text-gray-500">{type.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 代理地址 */}
                      <div>
                        <div className="text-sm text-gray-700 mb-1">
                          {settings.proxyType === 'custom' ? '完整代理 URL' : '代理服务器地址'}
                        </div>
                        <input
                          type="text"
                          value={settings.proxyUrl}
                          onChange={(e) => setSettings({ ...settings, proxyUrl: e.target.value })}
                          placeholder={
                            settings.proxyType === 'http' 
                              ? '例如: 127.0.0.1:7890 或 proxy.example.com:8080'
                              : settings.proxyType === 'socks5'
                              ? '例如: 127.0.0.1:1080'
                              : '例如: http://user:pass@proxy.example.com:8080'
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {settings.proxyType === 'http' && '支持 HTTP 和 HTTPS 代理协议'}
                          {settings.proxyType === 'socks5' && '适用于需要 SOCKS5 代理的网络环境'}
                          {settings.proxyType === 'custom' && '输入完整的代理 URL，支持认证信息'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 代理说明 */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-sm font-medium text-amber-800 mb-2">⚠️ 重要说明</div>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• 代理设置将应用于所有第三方 API 请求（AI 服务、图片搜索等）</li>
                    <li>• 由于浏览器扩展限制，代理功能需要配合系统代理或代理扩展使用</li>
                    <li>• 建议使用 AI 服务商提供的「自定义 Base URL」功能替代代理</li>
                    <li>• 如遇网络问题，请检查代理服务器是否正常运行</li>
                  </ul>
                </div>

                {/* 使用建议 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-sm font-medium text-blue-800 mb-2">💡 推荐方案</div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>国内用户：</strong>推荐使用 DeepSeek、阿里云百炼、硅基流动等国内服务</li>
                    <li>• <strong>需要 OpenAI：</strong>可使用第三方中转服务，在 AI 配置中设置自定义 Base URL</li>
                    <li>• <strong>企业用户：</strong>可部署私有代理网关，统一管理 API 访问</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* 备份恢复 */}
          {activeSection === 'backup' && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200">备份与恢复</h2>
              <div className="space-y-6">
                {/* 导出配置 */}
                <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-2xl">📤</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-lg">导出当前配置</div>
                      <div className="text-sm text-gray-600">备份所有已填写的配置项，方便迁移到其他设备</div>
                    </div>
                  </div>
                  <button
                    onClick={exportCurrentConfig}
                    className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>💾</span> 导出配置备份
                  </button>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    将下载包含所有配置的 Markdown 文件
                  </div>
                </div>

                {/* 导入配置 */}
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-2xl">📥</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-lg">导入配置文件</div>
                      <div className="text-sm text-gray-600">从备份文件恢复配置，快速完成设置</div>
                    </div>
                  </div>
                  <button
                    onClick={importConfig}
                    className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📂</span> 选择配置文件导入
                  </button>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    支持 .md 和 .txt 格式的配置文件
                  </div>
                </div>

                {/* 下载模板 */}
                <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-2xl">📄</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-lg">下载配置模板</div>
                      <div className="text-sm text-gray-600">获取空白配置模板，手动填写后导入</div>
                    </div>
                  </div>
                  <button
                    onClick={downloadConfigTemplate}
                    className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>⬇️</span> 下载配置模板
                  </button>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    模板包含所有配置项说明和示例值
                  </div>
                </div>

                {/* 配置说明 */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-sm font-medium text-amber-800 mb-2">📋 配置文件说明</div>
                  <ul className="text-xs text-amber-700 space-y-1.5">
                    <li>• 配置文件采用 Markdown 格式，便于阅读和编辑</li>
                    <li>• 以 <code className="bg-amber-100 px-1 rounded">#</code> 开头的行为注释，不会被解析</li>
                    <li>• 配置格式为 <code className="bg-amber-100 px-1 rounded">key: value</code>，冒号后需有空格</li>
                    <li>• 以 <code className="bg-amber-100 px-1 rounded">YOUR_</code> 开头的占位符会被忽略</li>
                    <li>• 导入配置会与现有配置合并，不会清空未包含的项</li>
                  </ul>
                </div>

                {/* 安全提示 */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-sm font-medium text-red-800 mb-2">🔐 安全提示</div>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• 配置文件包含 API 密钥等敏感信息，请妥善保管</li>
                    <li>• 不要将配置文件上传到公开的代码仓库或网盘</li>
                    <li>• 建议使用加密存储或密码管理器保存配置文件</li>
                  </ul>
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
