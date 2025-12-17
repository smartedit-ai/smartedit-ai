/**
 * 信息聚合面板 - 多源信息监控和聚合
 */
import { useState, useEffect, useCallback } from 'react'
import {
  AggregatorConfig,
  SourceConfig,
  TopicConfig,
  AggregatedItem,
  ScanResult,
  defaultAggregatorConfig,
  detectCurrentSource,
  getSourceName,
  getSourceIcon,
  extractFromSource,
  filterByKeywords,
  generateSummaryPrompt,
  formatAsObsidianNote,
  autoScrollToLoad,
  scanIntervalOptions
} from '../../lib/infoAggregator'
import { ObsidianClient, ObsidianConfig } from '../../lib/obsidian'

interface InfoAggregatorPanelProps {
  themeColor: string
}

export default function InfoAggregatorPanel({ themeColor: _themeColor }: InfoAggregatorPanelProps) {
  const [config, setConfig] = useState<AggregatorConfig>(defaultAggregatorConfig)
  const [obsidianConfig, setObsidianConfig] = useState<ObsidianConfig | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [currentItems, setCurrentItems] = useState<AggregatedItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'scan' | 'results' | 'sources' | 'topics'>('scan')
  const [editingSource, setEditingSource] = useState<SourceConfig | null>(null)
  const [editingTopic, setEditingTopic] = useState<TopicConfig | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [batchKeywords, setBatchKeywords] = useState('')
  const [showBatchInput, setShowBatchInput] = useState(false)

  // 当前页面检测
  const currentSource = detectCurrentSource()

  // 加载配置
  useEffect(() => {
    chrome.storage.sync.get(['settings', 'aggregatorConfig', 'aggregatorResults'], (result) => {
      if (result.aggregatorConfig) {
        setConfig({ ...defaultAggregatorConfig, ...result.aggregatorConfig })
      }
      if (result.settings?.obsidian) {
        setObsidianConfig(result.settings.obsidian)
      }
      if (result.aggregatorResults) {
        setScanResults(result.aggregatorResults.slice(0, 20))
      }
    })
  }, [])

  // 保存配置
  const saveConfig = useCallback(async (newConfig: AggregatorConfig) => {
    setConfig(newConfig)
    await chrome.storage.sync.set({ aggregatorConfig: newConfig })
  }, [])

  // 保存扫描结果
  const saveScanResults = useCallback(async (results: ScanResult[]) => {
    const limitedResults = results.slice(0, 20)
    setScanResults(limitedResults)
    await chrome.storage.sync.set({ aggregatorResults: limitedResults })
  }, [])

  // 执行扫描
  const runScan = useCallback(async () => {
    if (!currentSource) {
      setError('当前页面不是支持的信息源')
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      // 自动滚动加载更多
      await autoScrollToLoad(3, 1500)

      // 提取内容
      const items = extractFromSource(currentSource)
      setCurrentItems(items)
      console.log(`从 ${getSourceName(currentSource)} 提取到 ${items.length} 条内容`)

      if (items.length === 0) {
        setError('未能提取到内容，请确保页面已完全加载')
        setIsScanning(false)
        return
      }

      // 对每个启用的主题进行分析
      const enabledTopics = config.topics.filter(t => t.enabled)
      const results: ScanResult[] = []

      for (const topic of enabledTopics) {
        const matchedItems = filterByKeywords(items, topic.keywords)

        if (matchedItems.length > 0) {
          const result: ScanResult = {
            sourceType: currentSource,
            sourceName: getSourceName(currentSource),
            topic,
            items: matchedItems,
            matchedCount: matchedItems.length,
            scanTime: new Date().toISOString()
          }

          // AI 总结
          try {
            const prompt = generateSummaryPrompt(matchedItems, topic)
            const response = await chrome.runtime.sendMessage({
              type: 'AI_REQUEST',
              payload: { prompt }
            })

            if (response?.success && response?.data) {
              result.summary = response.data
            }
          } catch (e) {
            console.error('AI 总结失败:', e)
          }

          // 保存到 Obsidian
          if (config.autoSaveToObsidian && obsidianConfig?.enabled) {
            try {
              const noteContent = formatAsObsidianNote(matchedItems, result.summary || '', topic)
              const notePath = `${config.obsidianPath}/${topic.name}/${new Date().toISOString().slice(0, 10)}`
              const client = new ObsidianClient(obsidianConfig)
              await client.saveNote(notePath, noteContent)
            } catch (e) {
              console.error('保存到 Obsidian 失败:', e)
            }
          }

          results.push(result)
        }
      }

      // 如果没有启用主题，保存全部内容
      if (enabledTopics.length === 0 && items.length > 0) {
        const result: ScanResult = {
          sourceType: currentSource,
          sourceName: getSourceName(currentSource),
          items,
          matchedCount: items.length,
          scanTime: new Date().toISOString()
        }

        try {
          const prompt = generateSummaryPrompt(items)
          const response = await chrome.runtime.sendMessage({
            type: 'AI_REQUEST',
            payload: { prompt }
          })
          if (response?.success && response?.data) {
            result.summary = response.data
          }
        } catch (e) {
          console.error('AI 总结失败:', e)
        }

        results.push(result)
      }

      // 更新源的最后扫描时间
      const updatedSources = config.sources.map(s =>
        s.type === currentSource ? { ...s, lastScanTime: new Date().toISOString() } : s
      )
      saveConfig({ ...config, sources: updatedSources })

      // 保存结果
      await saveScanResults([...results, ...scanResults])

      setIsScanning(false)
      if (results.length > 0) {
        setActiveTab('results')
      }
    } catch (err) {
      setError(`扫描失败: ${(err as Error).message}`)
      setIsScanning(false)
    }
  }, [currentSource, config, obsidianConfig, scanResults, saveConfig, saveScanResults])

  // 快速提取
  const quickExtract = useCallback(() => {
    if (!currentSource) {
      setError('当前页面不是支持的信息源')
      return
    }
    const items = extractFromSource(currentSource)
    setCurrentItems(items)
    if (items.length === 0) {
      setError('未能提取到内容')
    } else {
      setError(null)
    }
  }, [currentSource])

  // 更新信息源
  const updateSource = useCallback((source: SourceConfig) => {
    const newConfig = {
      ...config,
      sources: config.sources.map(s => s.id === source.id ? source : s)
    }
    saveConfig(newConfig)
  }, [config, saveConfig])

  // 切换信息源启用状态
  const toggleSource = useCallback((sourceId: string) => {
    const newConfig = {
      ...config,
      sources: config.sources.map(s =>
        s.id === sourceId ? { ...s, enabled: !s.enabled } : s
      )
    }
    saveConfig(newConfig)
  }, [config, saveConfig])

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

  // 批量添加关键词
  const addBatchKeywords = useCallback(() => {
    if (!editingTopic || !batchKeywords.trim()) return
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 标签栏 */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'scan', label: '🔍 扫描' },
          { id: 'results', label: '📊 结果' },
          { id: 'sources', label: '📡 信息源' },
          { id: 'topics', label: '🏷️ 主题' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
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
      <div className="flex-1 overflow-y-auto p-3">
        {/* 扫描标签页 */}
        {activeTab === 'scan' && (
          <div className="space-y-3">
            {/* 当前页面状态 */}
            <div className={`p-3 rounded-lg ${currentSource ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentSource ? getSourceIcon(currentSource) : '⚠️'}</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${currentSource ? 'text-green-700' : 'text-yellow-700'}`}>
                    {currentSource ? `${getSourceName(currentSource)} 已就绪` : '当前页面不是支持的信息源'}
                  </p>
                  {currentSource && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {config.sources.find(s => s.type === currentSource)?.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={runScan}
                disabled={isScanning || !currentSource}
                className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                disabled={!currentSource}
                className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
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
            <div>
              <h3 className="text-xs font-medium text-gray-500 mb-2">启用的主题过滤</h3>
              <div className="flex flex-wrap gap-1.5">
                {config.topics.filter(t => t.enabled).map(topic => (
                  <span key={topic.id} className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                    {topic.name}
                  </span>
                ))}
                {config.topics.filter(t => t.enabled).length === 0 && (
                  <span className="text-xs text-gray-400">未启用主题，将提取全部内容</span>
                )}
              </div>
            </div>

            {/* 提取的内容预览 */}
            {currentItems.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-2">
                  提取到 {currentItems.length} 条内容
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {currentItems.slice(0, 10).map((item, i) => (
                    <div key={item.id} className="p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-gray-400">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{item.content}</p>
                          {(item.score !== undefined || item.comments !== undefined) && (
                            <div className="flex gap-2 mt-1 text-xs text-gray-400">
                              {item.score !== undefined && <span>👍 {item.score}</span>}
                              {item.comments !== undefined && <span>💬 {item.comments}</span>}
                            </div>
                          )}
                        </div>
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
          <div className="space-y-3">
            {scanResults.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">暂无扫描结果</p>
              </div>
            ) : (
              scanResults.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{getSourceIcon(result.sourceType)}</span>
                      <span className="font-medium text-sm text-gray-800">
                        {result.topic?.name || result.sourceName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(result.scanTime).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    匹配 {result.matchedCount} 条内容
                  </div>
                  {result.summary && (
                    <div className="p-2 bg-white rounded border border-gray-200 text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {result.summary}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 信息源标签页 */}
        {activeTab === 'sources' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">信息源管理</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newConfig = { ...config, sources: config.sources.map(s => ({ ...s, enabled: true })) }
                    saveConfig(newConfig)
                  }}
                  className="text-xs text-green-600 hover:text-green-700"
                >
                  全开
                </button>
                <button
                  onClick={() => {
                    const newConfig = { ...config, sources: config.sources.map(s => ({ ...s, enabled: false })) }
                    saveConfig(newConfig)
                  }}
                  className="text-xs text-gray-500 hover:text-gray-600"
                >
                  全关
                </button>
              </div>
            </div>

            {/* 信息源列表 */}
            <div className="space-y-2">
              {config.sources.map(source => (
                <div
                  key={source.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    editingSource?.id === source.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                      onClick={() => setEditingSource(editingSource?.id === source.id ? null : source)}
                    >
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSource(source.id)
                        }}
                        className="rounded"
                      />
                      <span className="text-lg">{source.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${source.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                          {source.name}
                        </span>
                        {source.type === currentSource && (
                          <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-600 text-xs rounded">当前</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-7">{source.description}</p>
                  
                  {/* 扫描间隔 */}
                  <div className="flex items-center justify-between mt-2 ml-7">
                    <span className="text-xs text-gray-400">
                      扫描间隔: {scanIntervalOptions.find(o => o.value === source.scanInterval)?.label || '未设置'}
                    </span>
                    {source.lastScanTime && (
                      <span className="text-xs text-gray-400">
                        上次: {new Date(source.lastScanTime).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 编辑信息源 */}
            {editingSource && (
              <div className="p-3 bg-gray-50 rounded-lg border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800 text-sm">⚙️ 设置 {editingSource.name}</h4>
                  <button onClick={() => setEditingSource(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div>
                  <label className="text-xs text-gray-600">定时扫描间隔</label>
                  <select
                    value={editingSource.scanInterval}
                    onChange={(e) => {
                      const updated = { ...editingSource, scanInterval: parseInt(e.target.value) }
                      setEditingSource(updated)
                      updateSource(updated)
                    }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {scanIntervalOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-600">自定义关键词过滤（可选）</label>
                  <input
                    type="text"
                    value={editingSource.keywords.join(', ')}
                    onChange={(e) => {
                      const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      const updated = { ...editingSource, keywords }
                      setEditingSource(updated)
                      updateSource(updated)
                    }}
                    placeholder="用逗号分隔多个关键词"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <a
                  href={editingSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  🔗 打开 {editingSource.name}
                </a>
              </div>
            )}

            {/* 全局设置 */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">全局设置</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">后台定时扫描</span>
                <input
                  type="checkbox"
                  checked={config.backgroundScanEnabled}
                  onChange={(e) => saveConfig({ ...config, backgroundScanEnabled: e.target.checked })}
                  className="rounded"
                />
              </div>

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

              {/* Obsidian 状态 */}
              <div className={`p-2 rounded-lg ${obsidianConfig?.enabled ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center gap-2">
                  <span>{obsidianConfig?.enabled ? '✅' : '⚠️'}</span>
                  <span className={`text-xs ${obsidianConfig?.enabled ? 'text-green-700' : 'text-yellow-700'}`}>
                    {obsidianConfig?.enabled ? 'Obsidian 已连接' : '请先配置 Obsidian'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 主题标签页 */}
        {activeTab === 'topics' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">主题管理 ({config.topics.length})</h3>
              <button
                onClick={addTopic}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + 添加
              </button>
            </div>

            {/* 主题列表 */}
            <div className="space-y-2">
              {config.topics.map(topic => (
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
                      <span className={`text-sm font-medium ${topic.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                        {topic.name}
                      </span>
                      <span className="text-xs text-gray-400">({topic.keywords.length})</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id) }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      🗑️
                    </button>
                  </div>
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

            {/* 编辑主题 */}
            {editingTopic && (
              <div className="p-3 bg-gray-50 rounded-lg border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800 text-sm">✏️ 编辑主题</h4>
                  <button onClick={() => setEditingTopic(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div>
                  <label className="text-xs text-gray-600">主题名称</label>
                  <input
                    type="text"
                    value={editingTopic.name}
                    onChange={(e) => {
                      const updated = { ...editingTopic, name: e.target.value }
                      setEditingTopic(updated)
                      updateTopic(updated)
                    }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600">关键词 ({editingTopic.keywords.length})</label>
                    <button
                      onClick={() => setShowBatchInput(!showBatchInput)}
                      className="text-xs text-blue-600"
                    >
                      {showBatchInput ? '单个添加' : '批量添加'}
                    </button>
                  </div>

                  {!showBatchInput ? (
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
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        添加
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={batchKeywords}
                        onChange={(e) => setBatchKeywords(e.target.value)}
                        placeholder="输入多个关键词，用逗号或换行分隔"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-16 resize-none"
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

                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
                    {editingTopic.keywords.map(kw => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs group"
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
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
