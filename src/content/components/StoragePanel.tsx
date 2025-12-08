import { useState, useEffect } from 'react'
import {
  Draft,
  Collection,
  getAllDrafts,
  saveDraft,
  deleteDraft,
  getAllCollections,
  deleteCollection,
  exportAllData,
  importData,
  draftToMarkdown,
  collectionToMarkdown,
  getStorageStats
} from '../../lib/storage'
import { ObsidianClient, formatAsObsidianNote, ObsidianConfig } from '../../lib/obsidian'

interface StoragePanelProps {
  themeColor: string
}

type TabType = 'drafts' | 'collections' | 'export'
type CollectionFilter = 'all' | 'article' | 'image' | 'title' | 'quote' | 'template'

export default function StoragePanel({ themeColor }: StoragePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('drafts')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all')
  const [selectedDraftsForExport, setSelectedDraftsForExport] = useState<Set<string>>(new Set())
  const [selectedCollectionsForExport, setSelectedCollectionsForExport] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ draftsCount: 0, collectionsCount: 0, historyCount: 0 })
  const [obsidianConfig, setObsidianConfig] = useState<ObsidianConfig | null>(null)
  const [obsidianStatus, setObsidianStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  // 加载数据
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [draftsData, collectionsData, statsData] = await Promise.all([
        getAllDrafts(),
        getAllCollections(),
        getStorageStats()
      ])
      setDrafts(draftsData)
      setCollections(collectionsData)
      setStats(statsData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // 加载 Obsidian 配置（从 settings.obsidian 读取）
    chrome.storage.sync.get(['settings'], (result) => {
      const obsidian = result.settings?.obsidian
      if (obsidian) {
        setObsidianConfig(obsidian)
        // 测试连接状态
        if (obsidian.enabled && obsidian.apiKey) {
          const client = new ObsidianClient(obsidian)
          client.testConnection().then(status => {
            setObsidianStatus(status.connected && status.authenticated ? 'connected' : 'disconnected')
          }).catch(() => {
            setObsidianStatus('disconnected')
          })
        }
      }
    })
  }, [])

  // 保存到 Obsidian
  const saveToObsidian = async (title: string, content: string, type: 'draft' | 'collection', metadata?: { source?: string; sourceUrl?: string; tags?: string[] }) => {
    if (!obsidianConfig?.enabled || !obsidianConfig?.apiKey) {
      alert('请先在设置中配置 Obsidian 连接')
      return false
    }

    const client = new ObsidianClient(obsidianConfig)
    const note = formatAsObsidianNote(title, content, {
      type,
      source: metadata?.source,
      sourceUrl: metadata?.sourceUrl,
      tags: metadata?.tags,
      created: new Date().toISOString()
    })

    const safeName = title.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 50)
    const path = `${obsidianConfig.defaultPath}/${safeName}`
    
    const result = await client.saveNote(path, note)
    if (result.success) {
      alert(`✅ 已保存到 Obsidian\n\n路径: ${path}.md`)
      return true
    } else {
      alert(`❌ 保存失败: ${result.error}`)
      return false
    }
  }

  // 批量保存到 Obsidian
  const saveSelectedToObsidian = async () => {
    if (!obsidianConfig?.enabled || !obsidianConfig?.apiKey) {
      alert('请先在设置中配置 Obsidian 连接')
      return
    }

    const selectedDraftsList = drafts.filter(d => selectedDraftsForExport.has(d.id))
    const selectedCollectionsList = collections.filter(c => selectedCollectionsForExport.has(c.id))
    
    if (selectedDraftsList.length === 0 && selectedCollectionsList.length === 0) {
      alert('请先选择要保存的内容')
      return
    }

    const client = new ObsidianClient(obsidianConfig)
    let successCount = 0
    let failCount = 0

    for (const draft of selectedDraftsList) {
      const note = formatAsObsidianNote(draft.title, draft.content, {
        type: 'draft',
        tags: draft.tags,
        created: draft.createdAt
      })
      const safeName = draft.title.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 50)
      const path = `${obsidianConfig.defaultPath}/草稿/${safeName}`
      const result = await client.saveNote(path, note)
      if (result.success) successCount++
      else failCount++
    }

    for (const item of selectedCollectionsList) {
      const note = formatAsObsidianNote(item.title, item.content, {
        type: item.type,
        source: item.source,
        sourceUrl: item.sourceUrl,
        tags: item.tags,
        created: item.createdAt
      })
      const safeName = item.title.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 50)
      const path = `${obsidianConfig.defaultPath}/收藏/${safeName}`
      const result = await client.saveNote(path, note)
      if (result.success) successCount++
      else failCount++
    }

    alert(`保存完成！\n✅ 成功: ${successCount}\n❌ 失败: ${failCount}`)
  }

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  // 保存当前编辑器内容为草稿
  const saveCurrentAsDraft = async () => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }

    const content = editor.innerText || ''
    const htmlContent = editor.innerHTML || ''
    
    // 尝试获取标题
    const titleInput = document.querySelector('input[placeholder*="标题"]') as HTMLInputElement
    const title = titleInput?.value || content.substring(0, 30) || '未命名草稿'

    try {
      await saveDraft({
        title,
        content,
        htmlContent
      })
      alert('草稿保存成功！')
      loadData()
    } catch (error) {
      alert('保存失败：' + (error as Error).message)
    }
  }

  // 插入草稿到编辑器
  const insertDraftToEditor = (draft: Draft) => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }

    if (draft.htmlContent) {
      editor.innerHTML = draft.htmlContent
    } else {
      editor.innerText = draft.content
    }
    
    // 触发 input 事件
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    setSelectedDraft(null)
    alert('草稿已插入编辑器')
  }

  // 插入收藏内容到编辑器
  const insertCollectionToEditor = (item: Collection) => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }

    let html = ''
    switch (item.type) {
      case 'title':
        html = `<h2 style="font-size:18px;font-weight:bold;color:${themeColor};margin:20px 0">${item.content}</h2>`
        break
      case 'quote':
        html = `<blockquote style="background:#f8f9fa;border-left:4px solid ${themeColor};padding:16px;margin:20px 0;font-style:italic;color:#666">${item.content}</blockquote>`
        break
      case 'image':
        html = `<p style="text-align:center;margin:20px 0"><img src="${item.imageUrl || item.content}" style="max-width:100%;border-radius:8px" alt="${item.title}"></p>`
        break
      default:
        html = `<section style="margin:20px 0;padding:16px;background:#f8f9fa;border-radius:8px">
          <p style="font-size:15px;font-weight:bold;color:#333;margin:0 0 8px 0">${item.title}</p>
          <p style="font-size:14px;color:#666;line-height:1.6;margin:0">${item.content}</p>
          <p style="font-size:12px;color:#999;margin:8px 0 0 0">来源：${item.source}</p>
        </section>`
    }

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        document.execCommand('insertHTML', false, html)
        setSelectedCollection(null)
        return
      }
    }
    editor.innerHTML += html
    setSelectedCollection(null)
  }

  // 导出数据
  const handleExport = async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `smartedit-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('导出失败：' + (error as Error).message)
    }
  }

  // 导入数据
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const result = await importData(data, true)
        alert(`导入成功！\n草稿：${result.drafts} 条\n收藏：${result.collections} 条`)
        loadData()
      } catch (error) {
        alert('导入失败：' + (error as Error).message)
      }
    }
    input.click()
  }

  // 导出草稿为 Markdown
  const exportDraftAsMarkdown = (draft: Draft) => {
    const md = draftToMarkdown(draft)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${draft.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导出收藏为 Markdown
  const exportCollectionAsMarkdown = (item: Collection) => {
    const md = collectionToMarkdown(item)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 批量导出为 Markdown 文件（打包成单个文件）
  const exportSelectedAsMarkdown = () => {
    const selectedDraftsList = drafts.filter(d => selectedDraftsForExport.has(d.id))
    const selectedCollectionsList = collections.filter(c => selectedCollectionsForExport.has(c.id))
    
    if (selectedDraftsList.length === 0 && selectedCollectionsList.length === 0) {
      alert('请先选择要导出的内容')
      return
    }

    let content = `# 智编助手导出内容\n\n导出时间：${new Date().toLocaleString('zh-CN')}\n\n---\n\n`

    if (selectedDraftsList.length > 0) {
      content += `# 草稿 (${selectedDraftsList.length}篇)\n\n`
      selectedDraftsList.forEach((draft, index) => {
        content += `## ${index + 1}. ${draft.title}\n\n`
        content += `> 创建时间：${new Date(draft.createdAt).toLocaleString('zh-CN')}\n`
        content += `> 更新时间：${new Date(draft.updatedAt).toLocaleString('zh-CN')}\n`
        content += `> 状态：${draft.status}\n\n`
        content += draft.content + '\n\n---\n\n'
      })
    }

    if (selectedCollectionsList.length > 0) {
      content += `# 收藏 (${selectedCollectionsList.length}条)\n\n`
      selectedCollectionsList.forEach((item, index) => {
        content += `## ${index + 1}. ${item.title}\n\n`
        content += `> 类型：${item.type}\n`
        content += `> 来源：${item.source}\n`
        content += `> 链接：${item.sourceUrl}\n`
        content += `> 收藏时间：${new Date(item.createdAt).toLocaleString('zh-CN')}\n\n`
        content += item.content + '\n\n---\n\n'
      })
    }

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smartedit-export-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    
    alert(`导出成功！\n草稿：${selectedDraftsList.length} 篇\n收藏：${selectedCollectionsList.length} 条`)
  }

  // 批量导出为多个独立 Markdown 文件（ZIP 格式需要额外库，这里用逐个下载）
  const exportSelectedAsIndividualFiles = async () => {
    const selectedDraftsList = drafts.filter(d => selectedDraftsForExport.has(d.id))
    const selectedCollectionsList = collections.filter(c => selectedCollectionsForExport.has(c.id))
    
    if (selectedDraftsList.length === 0 && selectedCollectionsList.length === 0) {
      alert('请先选择要导出的内容')
      return
    }

    const total = selectedDraftsList.length + selectedCollectionsList.length
    if (total > 10) {
      if (!confirm(`即将下载 ${total} 个文件，是否继续？\n\n提示：建议使用"合并导出"功能导出为单个文件`)) {
        return
      }
    }

    // 逐个下载
    for (const draft of selectedDraftsList) {
      exportDraftAsMarkdown(draft)
      await new Promise(r => setTimeout(r, 300)) // 延迟避免浏览器阻止
    }
    for (const item of selectedCollectionsList) {
      exportCollectionAsMarkdown(item)
      await new Promise(r => setTimeout(r, 300))
    }

    alert(`导出完成！共 ${total} 个文件`)
  }

  // 导出为 Obsidian 格式（带双链和标签）
  const exportAsObsidianFormat = () => {
    const selectedDraftsList = drafts.filter(d => selectedDraftsForExport.has(d.id))
    const selectedCollectionsList = collections.filter(c => selectedCollectionsForExport.has(c.id))
    
    if (selectedDraftsList.length === 0 && selectedCollectionsList.length === 0) {
      alert('请先选择要导出的内容')
      return
    }

    let content = ''

    selectedDraftsList.forEach((draft) => {
      content += `---\n`
      content += `title: "${draft.title}"\n`
      content += `created: ${draft.createdAt}\n`
      content += `updated: ${draft.updatedAt}\n`
      content += `status: ${draft.status}\n`
      content += `tags:\n  - 公众号\n  - 草稿\n`
      if (draft.tags.length > 0) {
        draft.tags.forEach(tag => {
          content += `  - ${tag}\n`
        })
      }
      content += `---\n\n`
      content += `# ${draft.title}\n\n`
      content += draft.content + '\n\n---\n\n'
    })

    selectedCollectionsList.forEach((item) => {
      content += `---\n`
      content += `title: "${item.title}"\n`
      content += `type: ${item.type}\n`
      content += `source: "[[${item.source}]]"\n`
      content += `sourceUrl: "${item.sourceUrl}"\n`
      content += `created: ${item.createdAt}\n`
      content += `tags:\n  - 公众号\n  - 收藏\n  - ${item.type}\n`
      if (item.tags.length > 0) {
        item.tags.forEach(tag => {
          content += `  - ${tag}\n`
        })
      }
      content += `---\n\n`
      content += `# ${item.title}\n\n`
      content += `> 来源：[[${item.source}]] | [原文链接](${item.sourceUrl})\n\n`
      content += item.content + '\n\n---\n\n'
    })

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `obsidian-import-${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    
    alert(`Obsidian 格式导出成功！\n\n提示：将文件保存到 Obsidian Vault 文件夹即可`)
  }

  // 全选/取消全选草稿
  const toggleSelectAllDrafts = () => {
    if (selectedDraftsForExport.size === drafts.length) {
      setSelectedDraftsForExport(new Set())
    } else {
      setSelectedDraftsForExport(new Set(drafts.map(d => d.id)))
    }
  }

  // 全选/取消全选收藏
  const toggleSelectAllCollections = () => {
    if (selectedCollectionsForExport.size === collections.length) {
      setSelectedCollectionsForExport(new Set())
    } else {
      setSelectedCollectionsForExport(new Set(collections.map(c => c.id)))
    }
  }

  // 复制内容
  const copyContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('已复制到剪贴板')
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('已复制到剪贴板')
    }
  }

  // 过滤后的收藏
  const filteredCollections = collectionFilter === 'all'
    ? collections
    : collections.filter(c => c.type === collectionFilter)

  return (
    <div className="h-full flex flex-col">
      {/* 头部 Tab 切换 */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
            activeTab === 'drafts'
              ? 'bg-[#07C160] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📝 草稿 ({stats.draftsCount})
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
            activeTab === 'collections'
              ? 'bg-[#07C160] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⭐ 收藏 ({stats.collectionsCount})
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
            activeTab === 'export'
              ? 'bg-[#07C160] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📤 导出
        </button>
        <div className="flex-1" />
        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="刷新"
        >
          <span className={isLoading ? 'animate-spin inline-block' : ''}>🔄</span>
        </button>
      </div>

      {/* 草稿箱 */}
      {activeTab === 'drafts' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 操作栏 */}
          <div className="px-4 py-2 border-b border-gray-100 flex gap-2">
            <button
              onClick={saveCurrentAsDraft}
              className="flex-1 py-2 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] transition-colors"
            >
              💾 保存当前内容
            </button>
          </div>

          {/* 草稿列表 */}
          <div className="flex-1 overflow-y-auto">
            {drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-3xl mb-2">📝</span>
                <span className="text-sm">暂无草稿</span>
                <span className="text-xs mt-1">点击上方按钮保存当前编辑内容</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedDraft(draft)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {draft.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {draft.content.substring(0, 100)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>{formatDate(draft.updatedAt)}</span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            draft.status === 'published' ? 'bg-green-100 text-green-600' :
                            draft.status === 'archived' ? 'bg-gray-100 text-gray-500' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {draft.status === 'published' ? '已发布' : draft.status === 'archived' ? '已归档' : '草稿'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div className="px-4 py-2 border-t border-gray-100 flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
            >
              📤 导出
            </button>
            <button
              onClick={handleImport}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors"
            >
              📥 导入
            </button>
          </div>
        </div>
      )}

      {/* 收藏列表 */}
      {activeTab === 'collections' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 筛选栏 */}
          <div className="px-4 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto">
            {[
              { id: 'all', label: '全部' },
              { id: 'article', label: '文章' },
              { id: 'title', label: '标题' },
              { id: 'quote', label: '金句' },
              { id: 'image', label: '图片' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setCollectionFilter(filter.id as CollectionFilter)}
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  collectionFilter === filter.id
                    ? 'bg-[#07C160] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* 收藏列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredCollections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-3xl mb-2">⭐</span>
                <span className="text-sm">暂无收藏</span>
                <span className="text-xs mt-1">在 RSS 或其他模块中收藏内容</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCollections.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCollection(item)}
                  >
                    <div className="flex items-start gap-2">
                      {item.type === 'image' && item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {item.content.substring(0, 80)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded">{item.source}</span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 导出面板 */}
      {activeTab === 'export' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 选择草稿 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">📝 选择草稿</span>
                <button
                  onClick={toggleSelectAllDrafts}
                  className="text-xs text-[#07C160] hover:underline"
                >
                  {selectedDraftsForExport.size === drafts.length ? '取消全选' : '全选'}
                </button>
              </div>
              {drafts.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">暂无草稿</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {drafts.map((draft) => (
                    <label
                      key={draft.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDraftsForExport.has(draft.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedDraftsForExport)
                          if (e.target.checked) {
                            newSet.add(draft.id)
                          } else {
                            newSet.delete(draft.id)
                          }
                          setSelectedDraftsForExport(newSet)
                        }}
                        className="w-4 h-4 text-[#07C160] rounded"
                      />
                      <span className="text-sm text-gray-700 truncate flex-1">{draft.title}</span>
                      <span className="text-xs text-gray-400">{formatDate(draft.updatedAt)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 选择收藏 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">⭐ 选择收藏</span>
                <button
                  onClick={toggleSelectAllCollections}
                  className="text-xs text-[#07C160] hover:underline"
                >
                  {selectedCollectionsForExport.size === collections.length ? '取消全选' : '全选'}
                </button>
              </div>
              {collections.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">暂无收藏</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {collections.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCollectionsForExport.has(item.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedCollectionsForExport)
                          if (e.target.checked) {
                            newSet.add(item.id)
                          } else {
                            newSet.delete(item.id)
                          }
                          setSelectedCollectionsForExport(newSet)
                        }}
                        className="w-4 h-4 text-[#07C160] rounded"
                      />
                      <span className="text-sm text-gray-700 truncate flex-1">{item.title}</span>
                      <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">{item.type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 已选择统计 */}
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <span className="text-sm text-blue-700">
                已选择：{selectedDraftsForExport.size} 篇草稿，{selectedCollectionsForExport.size} 条收藏
              </span>
            </div>

            {/* 导出选项 */}
            <div className="space-y-2">
              <button
                onClick={exportSelectedAsMarkdown}
                className="w-full py-3 bg-[#07C160] text-white rounded-xl text-sm hover:bg-[#06AD56] transition-colors flex items-center justify-center gap-2"
              >
                <span>📄</span>
                <span>合并导出为 Markdown</span>
              </button>
              
              <button
                onClick={exportAsObsidianFormat}
                className="w-full py-3 bg-purple-500 text-white rounded-xl text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>💎</span>
                <span>导出为 Obsidian 格式</span>
              </button>

              <button
                onClick={exportSelectedAsIndividualFiles}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <span>📁</span>
                <span>逐个导出为独立文件</span>
              </button>

              {/* Obsidian 直接保存 - 始终显示 */}
              <button
                onClick={() => {
                  if (!obsidianConfig?.enabled) {
                    alert('请先在扩展设置中启用 Obsidian 集成并配置 API Key')
                    return
                  }
                  saveSelectedToObsidian()
                }}
                className={`w-full py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
                  obsidianConfig?.enabled && obsidianStatus === 'connected'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-purple-400 text-white hover:bg-purple-500'
                }`}
              >
                <span>💎</span>
                <span>
                  {obsidianConfig?.enabled 
                    ? (obsidianStatus === 'connected' 
                        ? '直接保存到 Obsidian' 
                        : obsidianStatus === 'disconnected'
                        ? '保存到 Obsidian (未连接)'
                        : '保存到 Obsidian...')
                    : '保存到 Obsidian (未配置)'}
                </span>
              </button>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={handleExport}
                  className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                >
                  📦 导出全部数据 (JSON 备份)
                </button>
              </div>
            </div>

            {/* Obsidian 状态提示 */}
            {obsidianConfig?.enabled && (
              <div className={`rounded-xl p-3 ${
                obsidianStatus === 'connected' ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    obsidianStatus === 'connected' ? 'bg-green-500' : 
                    obsidianStatus === 'disconnected' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></span>
                  <span className="text-xs text-gray-600">
                    Obsidian: {
                      obsidianStatus === 'connected' ? '已连接' :
                      obsidianStatus === 'disconnected' ? '未连接' : '检测中...'
                    }
                  </span>
                  {obsidianStatus === 'connected' && obsidianConfig.defaultPath && (
                    <span className="text-xs text-gray-400">
                      → {obsidianConfig.defaultPath}/
                    </span>
                  )}
                </div>
              </div>
            )}

            {!obsidianConfig?.enabled && (
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span>💎</span>
                  <span className="text-xs font-medium text-purple-700">Obsidian 集成</span>
                </div>
                <p className="text-xs text-purple-600">
                  在设置中启用 Obsidian 集成，可直接将内容保存到你的知识库
                </p>
              </div>
            )}

            {/* 使用说明 */}
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500">💡</span>
                <span className="text-xs font-medium text-amber-700">使用说明</span>
              </div>
              <ul className="text-xs text-amber-600 space-y-1">
                <li>• <b>合并导出</b>：将所选内容合并为一个 Markdown 文件</li>
                <li>• <b>Obsidian 格式</b>：包含 YAML frontmatter 和双链语法</li>
                <li>• <b>独立文件</b>：每条内容单独下载为一个文件</li>
                <li>• <b>直接保存</b>：通过 API 直接写入 Obsidian Vault</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 草稿详情弹窗 */}
      {selectedDraft && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setSelectedDraft(null)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              ← 返回
            </button>
            <button
              onClick={async () => {
                if (confirm('确定删除这篇草稿吗？')) {
                  await deleteDraft(selectedDraft.id)
                  setSelectedDraft(null)
                  loadData()
                }
              }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              删除
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              {selectedDraft.title}
            </h3>
            <div className="text-xs text-gray-400 mb-4">
              更新于 {new Date(selectedDraft.updatedAt).toLocaleString('zh-CN')}
            </div>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {selectedDraft.content}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-2">
            <button
              onClick={() => insertDraftToEditor(selectedDraft)}
              className="py-2 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] transition-colors"
            >
              📝 插入编辑器
            </button>
            <button
              onClick={() => exportDraftAsMarkdown(selectedDraft)}
              className="py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              📄 导出 MD
            </button>
            <button
              onClick={() => copyContent(selectedDraft.content)}
              className="py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              📋 复制内容
            </button>
            {obsidianConfig?.enabled && (
              <button
                onClick={() => saveToObsidian(selectedDraft.title, selectedDraft.content, 'draft', { tags: selectedDraft.tags })}
                className="py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
              >
                💎 存到 Obsidian
              </button>
            )}
          </div>
        </div>
      )}

      {/* 收藏详情弹窗 */}
      {selectedCollection && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setSelectedCollection(null)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              ← 返回
            </button>
            <button
              onClick={async () => {
                if (confirm('确定删除这条收藏吗？')) {
                  await deleteCollection(selectedCollection.id)
                  setSelectedCollection(null)
                  loadData()
                }
              }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              删除
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedCollection.type === 'image' && selectedCollection.imageUrl && (
              <img
                src={selectedCollection.imageUrl}
                alt={selectedCollection.title}
                className="w-full rounded-lg mb-4"
              />
            )}
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              {selectedCollection.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{selectedCollection.source}</span>
              <span>{formatDate(selectedCollection.createdAt)}</span>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed">
              {selectedCollection.content}
            </div>
            {selectedCollection.sourceUrl && (
              <a
                href={selectedCollection.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-xs text-[#07C160] hover:underline"
              >
                查看原文 ↗
              </a>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-2">
            <button
              onClick={() => insertCollectionToEditor(selectedCollection)}
              className="py-2 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] transition-colors"
            >
              📝 插入编辑器
            </button>
            <button
              onClick={() => copyContent(selectedCollection.content)}
              className="py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              📋 复制内容
            </button>
            {obsidianConfig?.enabled && (
              <button
                onClick={() => saveToObsidian(
                  selectedCollection.title, 
                  selectedCollection.content, 
                  'collection', 
                  { 
                    source: selectedCollection.source, 
                    sourceUrl: selectedCollection.sourceUrl, 
                    tags: selectedCollection.tags 
                  }
                )}
                className="py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors col-span-2"
              >
                💎 保存到 Obsidian
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
