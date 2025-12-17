/**
 * X.com 推文监控面板
 */
import { useState, useEffect, useCallback } from 'react'
import { 
  XMonitorConfig, 
  TopicConfig, 
  Tweet, 
  ScanResult,
  defaultXMonitorConfig,
  extractTweetsFromPage,
  filterTweetsByKeywords,
  generateSummaryPrompt,
  formatScanResultAsNote,
  autoScrollToLoadTweets,
  isXPage,
  getXPageType
} from '../../lib/xMonitor'
import { ObsidianClient, ObsidianConfig } from '../../lib/obsidian'

interface XMonitorPanelProps {
  themeColor: string
}

export default function XMonitorPanel({ themeColor: _themeColor }: XMonitorPanelProps) {
  const [config, setConfig] = useState<XMonitorConfig>(defaultXMonitorConfig)
  const [obsidianConfig, setObsidianConfig] = useState<ObsidianConfig | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [currentTweets, setCurrentTweets] = useState<Tweet[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'scan' | 'results' | 'settings'>('scan')
  const [editingTopic, setEditingTopic] = useState<TopicConfig | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [batchKeywords, setBatchKeywords] = useState('')
  const [showBatchInput, setShowBatchInput] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [importText, setImportText] = useState('')

  // 加载配置
  useEffect(() => {
    chrome.storage.sync.get(['settings', 'xMonitorConfig', 'xScanResults'], (result) => {
      if (result.xMonitorConfig) {
        setConfig({ ...defaultXMonitorConfig, ...result.xMonitorConfig })
      }
      if (result.settings?.obsidian) {
        setObsidianConfig(result.settings.obsidian)
      }
      if (result.xScanResults) {
        setScanResults(result.xScanResults.slice(0, 10)) // 只保留最近10条
      }
    })
  }, [])

  // 保存配置
  const saveConfig = useCallback(async (newConfig: XMonitorConfig) => {
    setConfig(newConfig)
    await chrome.storage.sync.set({ xMonitorConfig: newConfig })
  }, [])

  // 执行扫描
  const runScan = useCallback(async () => {
    if (!isXPage()) {
      setError('请在 X.com 页面使用此功能')
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      // 自动滚动加载更多推文
      await autoScrollToLoadTweets(3, 1500)
      
      // 提取推文
      const tweets = extractTweetsFromPage()
      setCurrentTweets(tweets)
      console.log(`提取到 ${tweets.length} 条推文`)

      if (tweets.length === 0) {
        setError('未能提取到推文，请确保页面已完全加载')
        setIsScanning(false)
        return
      }

      // 对每个启用的主题进行分析
      const enabledTopics = config.topics.filter(t => t.enabled)
      const results: ScanResult[] = []

      for (const topic of enabledTopics) {
        const matchedTweets = filterTweetsByKeywords(tweets, topic.keywords)
        
        if (matchedTweets.length > 0) {
          const result: ScanResult = {
            topic,
            tweets: matchedTweets,
            matchedCount: matchedTweets.length,
            scanTime: new Date().toISOString()
          }

          // 使用 AI 生成总结
          try {
            const prompt = generateSummaryPrompt(topic, matchedTweets)
            const response = await chrome.runtime.sendMessage({
              type: 'AI_REQUEST',
              data: { action: 'custom', text: prompt }
            })
            
            if (response.success && response.result) {
              result.summary = response.result
            }
          } catch (err) {
            console.error('AI 总结失败:', err)
          }

          results.push(result)

          // 自动保存到 Obsidian
          if (config.autoSaveToObsidian && obsidianConfig?.enabled) {
            try {
              const noteContent = formatScanResultAsNote(result)
              const client = new ObsidianClient(obsidianConfig)
              const date = new Date().toISOString().slice(0, 10)
              const notePath = `${config.obsidianPath}/${topic.name}/${date}`
              await client.saveNote(notePath, noteContent)
              console.log(`已保存到 Obsidian: ${notePath}`)
            } catch (err) {
              console.error('保存到 Obsidian 失败:', err)
            }
          }
        }
      }

      // 更新结果
      const allResults = [...results, ...scanResults].slice(0, 20)
      setScanResults(allResults)
      await chrome.storage.sync.set({ xScanResults: allResults })

      if (results.length === 0) {
        setError('未找到匹配的推文，请尝试调整关键词')
      }

    } catch (err) {
      console.error('扫描失败:', err)
      setError('扫描失败: ' + (err as Error).message)
    }

    setIsScanning(false)
  }, [config, obsidianConfig, scanResults])

  // 快速提取当前页面推文
  const quickExtract = useCallback(() => {
    if (!isXPage()) {
      setError('请在 X.com 页面使用此功能')
      return
    }
    const tweets = extractTweetsFromPage()
    setCurrentTweets(tweets)
    if (tweets.length === 0) {
      setError('未能提取到推文')
    } else {
      setError(null)
    }
  }, [])

  // 添加主题
  const addTopic = useCallback(() => {
    const newTopic: TopicConfig = {
      id: Date.now().toString(),
      name: '新主题',
      keywords: [],
      enabled: true
    }
    const newConfig = {
      ...config,
      topics: [...config.topics, newTopic]
    }
    saveConfig(newConfig)
    setEditingTopic(newTopic)
  }, [config, saveConfig])

  // 更新主题
  const updateTopic = useCallback((topic: TopicConfig) => {
    const newConfig = {
      ...config,
      topics: config.topics.map(t => t.id === topic.id ? topic : t)
    }
    saveConfig(newConfig)
  }, [config, saveConfig])

  // 删除主题
  const deleteTopic = useCallback((topicId: string) => {
    if (confirm('确定删除此主题？')) {
      const newConfig = {
        ...config,
        topics: config.topics.filter(t => t.id !== topicId)
      }
      saveConfig(newConfig)
      if (editingTopic?.id === topicId) {
        setEditingTopic(null)
      }
    }
  }, [config, saveConfig, editingTopic])

  // 添加关键词
  const addKeyword = useCallback(() => {
    if (!editingTopic || !newKeyword.trim()) return
    const updatedTopic = {
      ...editingTopic,
      keywords: [...editingTopic.keywords, newKeyword.trim()]
    }
    updateTopic(updatedTopic)
    setEditingTopic(updatedTopic)
    setNewKeyword('')
  }, [editingTopic, newKeyword, updateTopic])

  // 删除关键词
  const removeKeyword = useCallback((keyword: string) => {
    if (!editingTopic) return
    const updatedTopic = {
      ...editingTopic,
      keywords: editingTopic.keywords.filter(k => k !== keyword)
    }
    updateTopic(updatedTopic)
    setEditingTopic(updatedTopic)
  }, [editingTopic, updateTopic])

  // 批量添加关键词
  const addBatchKeywords = useCallback(() => {
    if (!editingTopic || !batchKeywords.trim()) return
    // 支持逗号、分号、换行分隔
    const keywords = batchKeywords
      .split(/[,;，；\n]+/)
      .map(k => k.trim())
      .filter(k => k && !editingTopic.keywords.includes(k))
    
    if (keywords.length === 0) return
    
    const updatedTopic = {
      ...editingTopic,
      keywords: [...editingTopic.keywords, ...keywords]
    }
    updateTopic(updatedTopic)
    setEditingTopic(updatedTopic)
    setBatchKeywords('')
    setShowBatchInput(false)
  }, [editingTopic, batchKeywords, updateTopic])

  // 清空所有关键词
  const clearAllKeywords = useCallback(() => {
    if (!editingTopic) return
    if (!confirm('确定清空所有关键词？')) return
    const updatedTopic = {
      ...editingTopic,
      keywords: []
    }
    updateTopic(updatedTopic)
    setEditingTopic(updatedTopic)
  }, [editingTopic, updateTopic])

  // 复制主题
  const duplicateTopic = useCallback((topic: TopicConfig) => {
    const newTopic: TopicConfig = {
      id: Date.now().toString(),
      name: `${topic.name} (副本)`,
      keywords: [...topic.keywords],
      enabled: false
    }
    const newConfig = {
      ...config,
      topics: [...config.topics, newTopic]
    }
    saveConfig(newConfig)
    setEditingTopic(newTopic)
  }, [config, saveConfig])

  // 主题排序 - 上移
  const moveTopicUp = useCallback((topicId: string) => {
    const index = config.topics.findIndex(t => t.id === topicId)
    if (index <= 0) return
    const newTopics = [...config.topics]
    ;[newTopics[index - 1], newTopics[index]] = [newTopics[index], newTopics[index - 1]]
    saveConfig({ ...config, topics: newTopics })
  }, [config, saveConfig])

  // 主题排序 - 下移
  const moveTopicDown = useCallback((topicId: string) => {
    const index = config.topics.findIndex(t => t.id === topicId)
    if (index < 0 || index >= config.topics.length - 1) return
    const newTopics = [...config.topics]
    ;[newTopics[index], newTopics[index + 1]] = [newTopics[index + 1], newTopics[index]]
    saveConfig({ ...config, topics: newTopics })
  }, [config, saveConfig])

  // 全部启用/禁用
  const toggleAllTopics = useCallback((enabled: boolean) => {
    const newConfig = {
      ...config,
      topics: config.topics.map(t => ({ ...t, enabled }))
    }
    saveConfig(newConfig)
  }, [config, saveConfig])

  // 导出配置
  const exportConfig = useCallback(() => {
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      topics: config.topics
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `x-monitor-topics-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [config])

  // 导入配置
  const importConfig = useCallback(() => {
    try {
      const data = JSON.parse(importText)
      if (!data.topics || !Array.isArray(data.topics)) {
        alert('无效的配置格式')
        return
      }
      // 合并主题，避免重复
      const existingIds = new Set(config.topics.map(t => t.id))
      const newTopics = data.topics.filter((t: TopicConfig) => !existingIds.has(t.id))
      
      if (newTopics.length === 0) {
        alert('没有新的主题可导入')
        return
      }
      
      const newConfig = {
        ...config,
        topics: [...config.topics, ...newTopics]
      }
      saveConfig(newConfig)
      setImportText('')
      setShowImportExport(false)
      alert(`成功导入 ${newTopics.length} 个主题`)
    } catch {
      alert('配置解析失败，请检查格式')
    }
  }, [config, importText, saveConfig])

  // 预设主题模板
  const presetTopics: TopicConfig[] = [
    { id: 'preset-ai', name: 'AI/人工智能', keywords: ['AI', 'GPT', 'LLM', 'Claude', 'OpenAI', 'Anthropic', 'ChatGPT', '人工智能', '大模型', 'AGI'], enabled: false },
    { id: 'preset-crypto', name: '加密货币', keywords: ['Bitcoin', 'BTC', 'ETH', 'Crypto', 'Web3', 'NFT', '比特币', '以太坊', '区块链'], enabled: false },
    { id: 'preset-startup', name: '创业投资', keywords: ['startup', 'VC', 'funding', 'YC', 'Series A', '创业', '融资', '投资', '独角兽'], enabled: false },
    { id: 'preset-dev', name: '软件开发', keywords: ['React', 'Vue', 'TypeScript', 'Rust', 'Go', 'Python', 'JavaScript', '开源', 'GitHub'], enabled: false },
    { id: 'preset-product', name: '产品设计', keywords: ['Product', 'UX', 'UI', 'Design', 'Figma', '产品', '设计', '用户体验'], enabled: false },
  ]

  // 添加预设主题
  const addPresetTopic = useCallback((preset: TopicConfig) => {
    const existingNames = config.topics.map(t => t.name)
    if (existingNames.includes(preset.name)) {
      alert('该主题已存在')
      return
    }
    const newTopic = {
      ...preset,
      id: Date.now().toString(),
      enabled: true
    }
    const newConfig = {
      ...config,
      topics: [...config.topics, newTopic]
    }
    saveConfig(newConfig)
  }, [config, saveConfig])

  const pageType = isXPage() ? getXPageType() : null

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 标签栏 */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'scan', label: '🔍 扫描', icon: '🔍' },
          { id: 'results', label: '📊 结果', icon: '📊' },
          { id: 'settings', label: '⚙️ 设置', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 扫描标签页 */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            {/* 页面状态 */}
            <div className={`p-3 rounded-lg ${isXPage() ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{isXPage() ? '✅' : '⚠️'}</span>
                <div>
                  <p className={`text-sm font-medium ${isXPage() ? 'text-green-700' : 'text-yellow-700'}`}>
                    {isXPage() ? 'X.com 页面已就绪' : '请先打开 X.com'}
                  </p>
                  {pageType && (
                    <p className="text-xs text-gray-500">
                      页面类型: {pageType === 'home' ? '首页' : pageType === 'search' ? '搜索' : pageType === 'profile' ? '个人主页' : pageType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={runScan}
                disabled={isScanning || !isXPage()}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isScanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> 扫描中...
                  </span>
                ) : (
                  '🚀 开始扫描'
                )}
              </button>
              <button
                onClick={quickExtract}
                disabled={!isXPage()}
                className="py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                📋 提取
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 启用的主题 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">监控主题</h3>
              {config.topics.filter(t => t.enabled).map(topic => (
                <div key={topic.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{topic.name}</span>
                    <span className="text-xs text-gray-500">{topic.keywords.length} 个关键词</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {topic.keywords.slice(0, 5).map(kw => (
                      <span key={kw} className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                        {kw}
                      </span>
                    ))}
                    {topic.keywords.length > 5 && (
                      <span className="text-xs text-gray-400">+{topic.keywords.length - 5}</span>
                    )}
                  </div>
                </div>
              ))}
              {config.topics.filter(t => t.enabled).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  暂无启用的主题，请在设置中添加
                </p>
              )}
            </div>

            {/* 当前提取的推文 */}
            {currentTweets.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  已提取 {currentTweets.length} 条推文
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {currentTweets.slice(0, 10).map(tweet => (
                    <div key={tweet.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">@{tweet.authorHandle}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(tweet.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{tweet.content}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>👍 {tweet.likes}</span>
                        <span>🔄 {tweet.retweets}</span>
                        <span>💬 {tweet.replies}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 结果标签页 */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {scanResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>暂无扫描结果</p>
                <p className="text-sm">开始扫描后，结果将显示在这里</p>
              </div>
            ) : (
              scanResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{result.topic.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.scanTime).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      匹配 {result.matchedCount} 条推文
                    </div>
                  </div>
                  {result.summary && (
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">📝 AI 总结</h4>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">
                        {result.summary.slice(0, 500)}
                        {result.summary.length > 500 && '...'}
                      </div>
                    </div>
                  )}
                  <div className="p-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">🐦 热门推文</h4>
                    <div className="space-y-2">
                      {result.tweets.slice(0, 3).map(tweet => (
                        <div key={tweet.id} className="text-sm">
                          <span className="text-blue-600">@{tweet.authorHandle}</span>
                          <span className="text-gray-600 ml-2">{tweet.content.slice(0, 100)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 设置标签页 */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* 主题管理头部 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">监控主题 ({config.topics.length})</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAllTopics(true)}
                    className="text-xs text-green-600 hover:text-green-700"
                    title="全部启用"
                  >
                    全开
                  </button>
                  <button
                    onClick={() => toggleAllTopics(false)}
                    className="text-xs text-gray-500 hover:text-gray-600"
                    title="全部禁用"
                  >
                    全关
                  </button>
                  <button
                    onClick={addTopic}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + 添加
                  </button>
                </div>
              </div>
              
              {/* 主题列表 */}
              <div className="space-y-2">
                {config.topics.map((topic, index) => (
                  <div 
                    key={topic.id} 
                    className={`p-3 rounded-lg border transition-colors ${
                      editingTopic?.id === topic.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => setEditingTopic(editingTopic?.id === topic.id ? null : topic)}
                      >
                        <input
                          type="checkbox"
                          checked={topic.enabled}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateTopic({ ...topic, enabled: e.target.checked })
                          }}
                          className="rounded"
                        />
                        <span className={topic.enabled ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                          {topic.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({topic.keywords.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* 排序按钮 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTopicUp(topic.id) }}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="上移"
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveTopicDown(topic.id) }}
                          disabled={index === config.topics.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          title="下移"
                        >
                          ↓
                        </button>
                        {/* 复制按钮 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateTopic(topic) }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="复制主题"
                        >
                          📋
                        </button>
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id) }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {/* 关键词预览 */}
                    {topic.keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {topic.keywords.slice(0, 4).map(kw => (
                          <span key={kw} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                            {kw}
                          </span>
                        ))}
                        {topic.keywords.length > 4 && (
                          <span className="text-xs text-gray-400">+{topic.keywords.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 编辑主题 */}
            {editingTopic && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800">✏️ 编辑主题</h4>
                  <button
                    onClick={() => setEditingTopic(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">主题名称</label>
                  <input
                    type="text"
                    value={editingTopic.name}
                    onChange={(e) => {
                      const updated = { ...editingTopic, name: e.target.value }
                      setEditingTopic(updated)
                      updateTopic(updated)
                    }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-gray-600">关键词 ({editingTopic.keywords.length})</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowBatchInput(!showBatchInput)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        {showBatchInput ? '单个添加' : '批量添加'}
                      </button>
                      {editingTopic.keywords.length > 0 && (
                        <button
                          onClick={clearAllKeywords}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          清空
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 单个添加 */}
                  {!showBatchInput && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        placeholder="输入关键词后回车"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={addKeyword}
                        disabled={!newKeyword.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        添加
                      </button>
                    </div>
                  )}
                  
                  {/* 批量添加 */}
                  {showBatchInput && (
                    <div className="space-y-2">
                      <textarea
                        value={batchKeywords}
                        onChange={(e) => setBatchKeywords(e.target.value)}
                        placeholder="输入多个关键词，用逗号、分号或换行分隔&#10;例如：AI, GPT, 人工智能"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                      />
                      <button
                        onClick={addBatchKeywords}
                        disabled={!batchKeywords.trim()}
                        className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        批量添加
                      </button>
                    </div>
                  )}
                  
                  {/* 关键词列表 */}
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                    {editingTopic.keywords.map(kw => (
                      <span 
                        key={kw} 
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-sm group"
                      >
                        {kw}
                        <button
                          onClick={() => removeKeyword(kw)}
                          className="text-blue-400 hover:text-red-500 opacity-50 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {editingTopic.keywords.length === 0 && (
                      <span className="text-sm text-gray-400">暂无关键词，请添加</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 预设主题模板 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">📦 预设主题模板</h3>
              <div className="grid grid-cols-2 gap-2">
                {presetTopics.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => addPresetTopic(preset)}
                    className="p-2 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-700">{preset.name}</div>
                    <div className="text-xs text-gray-400">{preset.keywords.length} 个关键词</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 导入导出 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">📤 导入/导出</h3>
                <button
                  onClick={() => setShowImportExport(!showImportExport)}
                  className="text-xs text-blue-600"
                >
                  {showImportExport ? '收起' : '展开'}
                </button>
              </div>
              
              {showImportExport && (
                <div className="space-y-2">
                  <button
                    onClick={exportConfig}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                  >
                    📥 导出主题配置
                  </button>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="粘贴导出的 JSON 配置..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-20 resize-none"
                  />
                  <button
                    onClick={importConfig}
                    disabled={!importText.trim()}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    📤 导入配置
                  </button>
                </div>
              )}
            </div>

            {/* 其他设置 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">其他设置</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">自动保存到 Obsidian</span>
                <input
                  type="checkbox"
                  checked={config.autoSaveToObsidian}
                  onChange={(e) => saveConfig({ ...config, autoSaveToObsidian: e.target.checked })}
                  className="rounded"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Obsidian 保存路径</label>
                <input
                  type="text"
                  value={config.obsidianPath}
                  onChange={(e) => saveConfig({ ...config, obsidianPath: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">每次扫描最大推文数</label>
                <input
                  type="number"
                  value={config.maxTweetsPerScan}
                  onChange={(e) => saveConfig({ ...config, maxTweetsPerScan: parseInt(e.target.value) || 50 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Obsidian 状态 */}
            <div className={`p-3 rounded-lg ${obsidianConfig?.enabled ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center gap-2">
                <span>{obsidianConfig?.enabled ? '✅' : '⚠️'}</span>
                <span className={`text-sm ${obsidianConfig?.enabled ? 'text-green-700' : 'text-yellow-700'}`}>
                  {obsidianConfig?.enabled ? 'Obsidian 已连接' : '请先在设置中配置 Obsidian'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
