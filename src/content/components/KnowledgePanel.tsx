// 智编助手 - 知识库面板
import { useState, useEffect, useCallback } from 'react'
import { ObsidianClient, ObsidianConfig } from '../../lib/obsidian'
import { getAllCollections, Collection } from '../../lib/storage'

interface KnowledgePanelProps {
  themeColor: string
}

interface ObsidianNote {
  path: string
  name: string
  folder?: string
  content?: string
}

type TabType = 'obsidian' | 'collection'
type ViewMode = 'folder' | 'all'  // folder: 文件夹模式, all: 全部文章模式

export default function KnowledgePanel({ themeColor }: KnowledgePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('obsidian')
  const [viewMode, setViewMode] = useState<ViewMode>('all')  // 默认显示全部文章
  const [obsidianNotes, setObsidianNotes] = useState<ObsidianNote[]>([])
  const [allNotes, setAllNotes] = useState<ObsidianNote[]>([])  // 扫描得到的所有文章
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [obsidianConfig, setObsidianConfig] = useState<ObsidianConfig | null>(null)
  const [selectedNote, setSelectedNote] = useState<ObsidianNote | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [scanStats, setScanStats] = useState<{ total: number; folders: Set<string> } | null>(null)

  // 加载 Obsidian 笔记列表
  const loadObsidianNotes = useCallback(async (config: ObsidianConfig, path: string = '') => {
    if (!config?.enabled) {
      setError('请先在设置中启用 Obsidian 集成')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const client = new ObsidianClient(config)
      // 先尝试加载指定路径，如果失败则加载根目录
      const targetPath = path || '/'
      console.log('加载 Obsidian 目录:', targetPath)
      const result = await client.listFiles(targetPath)
      
      if (result.success && result.files) {
        const notes: ObsidianNote[] = result.files
          .filter(f => f.endsWith('.md') || !f.includes('.'))
          .map(f => ({
            path: path ? `${path}/${f}` : f,
            name: f.replace('.md', '')
          }))
        setObsidianNotes(notes)
        setCurrentPath(path)
        console.log('加载成功，共', notes.length, '个文件/文件夹')
      } else {
        console.error('加载失败:', result.error)
        setError(result.error || '加载失败，请检查 Obsidian 是否运行')
      }
    } catch (err) {
      console.error('Obsidian 连接错误:', err)
      setError('连接失败：' + (err as Error).message)
    }
    setIsLoading(false)
  }, [])

  // 加载收藏列表
  const loadCollections = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const items = await getAllCollections()
      setCollections(items)
    } catch (err) {
      setError((err as Error).message)
    }
    setIsLoading(false)
  }, [])

  // 初始化：加载配置并立即加载笔记
  useEffect(() => {
    const initLoad = async () => {
      // 加载配置
      const result = await chrome.storage.sync.get(['settings'])
      const config = result.settings?.obsidian as ObsidianConfig | undefined
      
      if (config?.enabled) {
        setObsidianConfig(config)
        const initialPath = config.defaultPath || ''
        setCurrentPath(initialPath)
        
        // 立即加载笔记列表
        if (activeTab === 'obsidian') {
          loadObsidianNotes(config, initialPath)
        }
      } else {
        setObsidianConfig(null)
      }
      
      // 如果是收藏 Tab，加载收藏
      if (activeTab === 'collection') {
        loadCollections()
      }
    }
    
    initLoad()
  }, [activeTab, loadObsidianNotes, loadCollections])

  // 扫描所有笔记
  const scanAllNotes = useCallback(async (config: ObsidianConfig) => {
    if (!config?.enabled) return
    
    setIsScanning(true)
    setIsLoading(true)
    setError(null)
    
    try {
      const client = new ObsidianClient(config)
      const startPath = config.defaultPath || '/'
      console.log('开始扫描目录:', startPath)
      
      const result = await client.scanDirectory(startPath, 5)
      
      if (result.success && result.notes) {
        const notes: ObsidianNote[] = result.notes.map(n => ({
          path: n.path,
          name: n.name,
          folder: n.folder
        }))
        
        // 按文件夹分组统计
        const folders = new Set(result.notes.map(n => n.folder))
        setScanStats({ total: notes.length, folders })
        setAllNotes(notes)
        setObsidianNotes(notes)
        console.log(`扫描完成: ${notes.length} 篇文章，${folders.size} 个文件夹`)
      } else {
        setError(result.error || '扫描失败')
      }
    } catch (err) {
      console.error('扫描错误:', err)
      setError('扫描失败：' + (err as Error).message)
    }
    
    setIsScanning(false)
    setIsLoading(false)
  }, [])

  // 用于手动刷新的函数
  const refreshNotes = useCallback((path?: string) => {
    if (obsidianConfig?.enabled) {
      if (viewMode === 'all') {
        scanAllNotes(obsidianConfig)
      } else {
        loadObsidianNotes(obsidianConfig, path ?? currentPath)
      }
    }
  }, [obsidianConfig, currentPath, loadObsidianNotes, viewMode, scanAllNotes])

  // 初始化时自动扫描
  useEffect(() => {
    if (activeTab === 'obsidian' && obsidianConfig?.enabled && viewMode === 'all' && allNotes.length === 0) {
      scanAllNotes(obsidianConfig)
    }
  }, [activeTab, obsidianConfig, viewMode, allNotes.length, scanAllNotes])

  // 加载笔记内容
  const loadNoteContent = async (note: ObsidianNote) => {
    if (!obsidianConfig?.enabled) return
    
    // 如果是文件夹模式且是文件夹，进入该文件夹
    if (viewMode === 'folder' && !note.path.endsWith('.md')) {
      loadObsidianNotes(obsidianConfig, note.path)
      return
    }

    setIsLoading(true)
    try {
      const client = new ObsidianClient(obsidianConfig)
      const result = await client.getNote(note.path)
      if (result.success) {
        setSelectedNote({ ...note, content: result.content })
      } else {
        setError(result.error || '加载失败')
      }
    } catch (err) {
      setError((err as Error).message)
    }
    setIsLoading(false)
  }

  // 插入内容到光标位置
  const insertToCursor = (text: string) => {
    // 尝试获取当前焦点元素
    const activeElement = document.activeElement as HTMLElement
    
    // 检查是否是可编辑元素
    if (activeElement && (
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'INPUT' ||
      activeElement.isContentEditable ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      // 对于 textarea 和 input
      if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
        const input = activeElement as HTMLTextAreaElement | HTMLInputElement
        const start = input.selectionStart || 0
        const end = input.selectionEnd || 0
        const value = input.value
        input.value = value.slice(0, start) + text + value.slice(end)
        input.selectionStart = input.selectionEnd = start + text.length
        input.focus()
        // 触发 input 事件
        input.dispatchEvent(new Event('input', { bubbles: true }))
      } else {
        // 对于 contenteditable 元素
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(document.createTextNode(text))
          range.collapse(false)
        } else {
          document.execCommand('insertText', false, text)
        }
      }
      return true
    }
    
    // 如果没有找到可编辑元素，复制到剪贴板
    navigator.clipboard.writeText(text)
    return false
  }

  // 搜索过滤
  const filteredNotes = obsidianNotes.filter(note => 
    note.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCollections = collections.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 返回上级目录
  const goBack = () => {
    if (selectedNote) {
      setSelectedNote(null)
      return
    }
    if (selectedCollection) {
      setSelectedCollection(null)
      return
    }
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/')
      refreshNotes(parentPath)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab 切换 */}
      <div className="flex border-b border-gray-100 px-3 pt-3">
        <button
          onClick={() => { setActiveTab('obsidian'); setSelectedNote(null); setSelectedCollection(null) }}
          className={`flex-1 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'obsidian'
              ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="mr-1">💎</span> Obsidian
        </button>
        <button
          onClick={() => { setActiveTab('collection'); setSelectedNote(null); setSelectedCollection(null) }}
          className={`flex-1 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'collection'
              ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="mr-1">⭐</span> 收藏
        </button>
      </div>

      {/* 搜索栏和视图切换 */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索文章标题..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {/* 视图模式切换和统计 */}
        {activeTab === 'obsidian' && !selectedNote && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                📋 全部
              </button>
              <button
                onClick={() => { setViewMode('folder'); refreshNotes(currentPath) }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'folder' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                📁 文件夹
              </button>
            </div>
            {scanStats && viewMode === 'all' && (
              <span className="text-xs text-gray-400">
                {isScanning ? '扫描中...' : `${scanStats.total} 篇文章`}
              </span>
            )}
          </div>
        )}
        
        {/* 文件夹模式下的路径导航 */}
        {activeTab === 'obsidian' && viewMode === 'folder' && currentPath && !selectedNote && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <button onClick={() => refreshNotes('')} className="hover:text-purple-600">
              🏠
            </button>
            {currentPath.split('/').map((part, index, arr) => (
              <span key={index} className="flex items-center">
                <span className="mx-1">/</span>
                <button
                  onClick={() => refreshNotes(arr.slice(0, index + 1).join('/'))}
                  className="hover:text-purple-600 truncate max-w-[80px]"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 错误提示 */}
        {error && (
          <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {/* 加载中 */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        )}

        {/* 笔记详情视图 */}
        {selectedNote && (
          <div className="p-3">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回列表
            </button>
            
            <h3 className="font-medium text-gray-800 mb-2">{selectedNote.name}</h3>
            
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {selectedNote.content || '加载中...'}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  if (selectedNote.content) {
                    const inserted = insertToCursor(selectedNote.content)
                    if (inserted) {
                      alert('已插入到光标位置')
                    } else {
                      alert('已复制到剪贴板')
                    }
                  }
                }}
                className="flex-1 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                插入全部
              </button>
              <button
                onClick={() => {
                  if (selectedNote.content) {
                    navigator.clipboard.writeText(selectedNote.content)
                    alert('已复制到剪贴板')
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                复制
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-400 text-center">
              💡 提示：选中部分文字后点击「插入全部」可只插入选中内容
            </p>
          </div>
        )}

        {/* 收藏详情视图 */}
        {selectedCollection && (
          <div className="p-3">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 mb-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回列表
            </button>
            
            <h3 className="font-medium text-gray-800 mb-1">{selectedCollection.title}</h3>
            <p className="text-xs text-gray-400 mb-3">
              来源：{selectedCollection.source}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {selectedCollection.content}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const inserted = insertToCursor(selectedCollection.content)
                  if (inserted) {
                    alert('已插入到光标位置')
                  } else {
                    alert('已复制到剪贴板')
                  }
                }}
                className="flex-1 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                插入全部
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedCollection.content)
                  alert('已复制到剪贴板')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                复制
              </button>
            </div>
          </div>
        )}

        {/* Obsidian 笔记列表 */}
        {activeTab === 'obsidian' && !selectedNote && !isLoading && (
          <div className="p-2">
            {!obsidianConfig?.enabled ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">💎</div>
                <p className="text-sm text-gray-500 mb-3">请先启用 Obsidian 集成</p>
                <button
                  onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg"
                  style={{ backgroundColor: themeColor }}
                >
                  前往设置
                </button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">📂</div>
                <p className="text-sm">暂无笔记</p>
                <button
                  onClick={() => refreshNotes(currentPath)}
                  className="mt-2 text-sm text-purple-500 hover:text-purple-600"
                >
                  刷新
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotes.map((note, index) => (
                  <button
                    key={index}
                    onClick={() => loadNoteContent(note)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-purple-50 rounded-lg transition-colors group"
                  >
                    <span className="text-lg mt-0.5">
                      {note.path.endsWith('.md') ? '📄' : '📁'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate group-hover:text-purple-600">
                        {note.name}
                      </p>
                      {viewMode === 'all' && note.folder && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          📁 {note.folder}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 收藏列表 */}
        {activeTab === 'collection' && !selectedCollection && !isLoading && (
          <div className="p-2">
            {filteredCollections.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-sm">暂无收藏</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCollections.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCollection(item)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-amber-50 rounded-lg transition-colors group"
                  >
                    <span className="text-lg mt-0.5">
                      {item.type === 'quote' ? '💬' : item.type === 'image' ? '🖼️' : '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate group-hover:text-amber-600">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {item.content.slice(0, 50)}...
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-amber-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部刷新按钮 */}
      <div className="px-3 py-2 border-t border-gray-100">
        <button
          onClick={() => {
            if (activeTab === 'obsidian') {
              refreshNotes(currentPath)
            } else {
              loadCollections()
            }
          }}
          disabled={isLoading}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
      </div>
    </div>
  )
}
