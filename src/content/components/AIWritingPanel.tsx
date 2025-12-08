import { useState } from 'react'
import { streamAIRequest, aiRequest, getEditor, setEditorTitle, tavilySearch, TavilySearchResult } from '../utils'
import { WRITING_TEMPLATES, WRITING_STYLES, ARTICLE_LENGTHS } from '../constants'

interface AIWritingPanelProps {
  themeColor: string
}

export default function AIWritingPanel({ themeColor }: AIWritingPanelProps) {
  const [aiInput, setAiInput] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiTitles, setAiTitles] = useState<string[]>([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [generatedArticle, setGeneratedArticle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState('')
  const [hotSearchResults, setHotSearchResults] = useState<TavilySearchResult | null>(null)
  const [useHotSearch, setUseHotSearch] = useState(false)
  const [titleCount, setTitleCount] = useState(5) // 生成标题数量
  
  // 新增状态
  const [activeTab, setActiveTab] = useState<'title' | 'article' | 'tools'>('title')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('professional')
  const [selectedLength, setSelectedLength] = useState('medium')
  const [writingHistory, setWritingHistory] = useState<Array<{title: string; content: string; time: Date}>>([])
  const [showHistory, setShowHistory] = useState(false)

  // 热点搜索
  const searchHotTopics = async () => {
    if (!aiInput.trim()) {
      alert('请先输入搜索关键词')
      return
    }
    
    setIsLoading(true)
    setLoadingAction('hot-search')
    setHotSearchResults(null)
    
    const result = await tavilySearch(aiInput, 5)
    if (result) {
      setHotSearchResults(result)
    }
    
    setIsLoading(false)
    setLoadingAction('')
  }

  // 生成标题（流式）
  const generateTitles = async () => {
    if (!aiInput.trim()) {
      alert('请先输入文章主题或内容')
      return
    }
    
    setIsLoading(true)
    setLoadingAction('generate-title')
    setAiTitles([])
    setAiResult('')
    
    // 如果开启热点搜索，自动调用 Tavily API 获取最新资讯
    let currentHotResults = hotSearchResults
    if (useHotSearch) {
      setLoadingAction('hot-search')
      const searchResult = await tavilySearch(aiInput, 5)
      if (searchResult) {
        setHotSearchResults(searchResult)
        currentHotResults = searchResult
      }
      setLoadingAction('generate-title')
    }
    
    // 构建 prompt，如果有热点搜索结果则加入
    let prompt = ''
    if (useHotSearch && currentHotResults && currentHotResults.results.length > 0) {
      const hotContext = currentHotResults.results
        .map((r, i) => `${i + 1}. ${r.title}\n${r.content}`)
        .join('\n\n')
      prompt = `根据以下主题和最新热点资讯，生成${titleCount}个高点击率的微信公众号标题：

主题：${aiInput}

最新相关资讯：
${hotContext}

请结合热点资讯，生成具有时效性和吸引力的标题。每个标题一行，用数字序号标注。`
    } else {
      prompt = `根据以下文章内容，生成${titleCount}个高点击率的微信公众号标题：\n\n${aiInput}\n\n每个标题一行，用数字序号标注。`
    }
    
    await streamAIRequest(
      prompt,
      (text) => {
        setAiResult(text)
        const titles = text.split('\n')
          .map(line => line.replace(/^\d+[\.\、\)]\s*/, '').replace(/^[\*\-]\s*/, '').trim())
          .filter(line => line.length > 0 && line.length < 100)
        setAiTitles(titles)
      },
      () => {
        setIsLoading(false)
        setLoadingAction('')
        setSelectedTitle('')
        setGeneratedArticle('')
      },
      (error) => {
        alert(error)
        setIsLoading(false)
        setLoadingAction('')
      }
    )
  }

  // 选择标题
  const selectTitle = (title: string) => {
    setSelectedTitle(title)
    setEditorTitle(title)
  }

  // 生成文章（流式）
  const generateArticle = async () => {
    if (!selectedTitle) {
      alert('请先选择一个标题')
      return
    }
    
    setIsLoading(true)
    setLoadingAction('generate-article')
    setGeneratedArticle('')
    
    // 构建 prompt，如果有热点搜索结果则加入
    let prompt = ''
    if (useHotSearch && hotSearchResults && hotSearchResults.results.length > 0) {
      const hotContext = hotSearchResults.results
        .map((r, i) => `${i + 1}. ${r.title}\n${r.content}`)
        .join('\n\n')
      prompt = `标题：${selectedTitle}

${aiInput ? `主题：${aiInput}\n\n` : ''}最新相关资讯：
${hotContext}

请根据以上标题和最新资讯，撰写一篇1000-1500字的微信公众号文章，要求：
1. 开头要有吸引力，引起读者兴趣
2. 结合最新资讯，内容具有时效性
3. 内容分段清晰，每段有小标题
4. 语言通俗易懂，适合大众阅读
5. 结尾有总结和互动引导`
    } else {
      prompt = `标题：${selectedTitle}\n\n${aiInput ? `参考内容：${aiInput}\n\n` : ''}请根据以上标题撰写一篇1000-1500字的微信公众号文章，要求：
1. 开头要有吸引力，引起读者兴趣
2. 内容分段清晰，每段有小标题
3. 语言通俗易懂，适合大众阅读
4. 结尾有总结和互动引导`
    }
    
    await streamAIRequest(
      prompt,
      (text) => setGeneratedArticle(text),
      () => {
        setIsLoading(false)
        setLoadingAction('')
      },
      (error) => {
        alert(error)
        setIsLoading(false)
        setLoadingAction('')
      }
    )
  }

  // 一键生成
  const generateFullArticle = async () => {
    if (!aiInput.trim()) {
      alert('请先输入文章主题')
      return
    }
    
    setIsLoading(true)
    setLoadingAction('generate-full')
    setGeneratedArticle('')
    setSelectedTitle('')
    
    const prompt = `主题：${aiInput}\n\n请撰写一篇1000-1500字的微信公众号文章，要求：
1. 先给出一个吸引人的标题
2. 开头要有吸引力
3. 内容分段清晰，有2-3个小标题
4. 语言通俗易懂
5. 结尾有总结和互动引导

格式要求：
第一行是标题
然后空一行
接着是正文内容`
    
    let extractedTitle = ''
    
    await streamAIRequest(
      prompt,
      (text) => {
        const lines = text.split('\n')
        if (!extractedTitle && lines[0]) {
          extractedTitle = lines[0].replace(/^[#\*]+\s*/, '').replace(/^标题[：:]\s*/, '').trim()
          if (extractedTitle.length > 5) {
            setSelectedTitle(extractedTitle)
            setEditorTitle(extractedTitle)
          }
        }
        const content = lines.slice(1).join('\n').trim()
        setGeneratedArticle(content)
      },
      () => {
        setIsLoading(false)
        setLoadingAction('')
      },
      (error) => {
        alert(error)
        setIsLoading(false)
        setLoadingAction('')
      }
    )
  }

  // 格式化文章为带样式的 HTML
  const formatArticleHtml = (text: string): string => {
    // 按段落分割（支持单换行和双换行）
    const paragraphs = text
      .split(/\n{1,2}/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
    
    return paragraphs.map(p => {
      // Markdown 标题
      if (p.startsWith('###')) {
        const text = p.replace(/^###\s*/, '')
        return `<section style="margin:20px 0 10px 0"><p style="font-size:16px;font-weight:bold;color:${themeColor};margin:0;padding:8px 0">${text}</p></section>`
      } else if (p.startsWith('##')) {
        const text = p.replace(/^##\s*/, '')
        return `<section style="margin:24px 0 12px 0"><p style="font-size:17px;font-weight:bold;color:${themeColor};margin:0;padding:10px 0">${text}</p></section>`
      } else if (p.startsWith('#')) {
        const text = p.replace(/^#\s*/, '')
        return `<section style="margin:28px 0 14px 0"><p style="font-size:18px;font-weight:bold;color:${themeColor};margin:0;padding:12px 0">${text}</p></section>`
      }
      // 数字序号开头（如 1. 2. 等）
      else if (/^\d+[\.\、]/.test(p)) {
        return `<section style="margin:12px 0"><p style="font-size:15px;line-height:1.8;color:#333;margin:0;padding:6px 0">${p}</p></section>`
      }
      // 短文本可能是小标题
      else if (p.length < 30 && !p.includes('。') && !p.includes('，')) {
        return `<section style="margin:20px 0 10px 0"><p style="font-size:16px;font-weight:bold;color:${themeColor};margin:0;padding:8px 0">${p}</p></section>`
      }
      // 普通段落
      else {
        return `<section style="margin:16px 0"><p style="font-size:15px;line-height:2;color:#333;margin:0;padding:0;text-indent:2em">${p}</p></section>`
      }
    }).join('\n')
  }

  // 插入文章到光标处
  const insertAtCursor = () => {
    const editor = getEditor()
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }
    
    const html = formatArticleHtml(generatedArticle)
    
    // 尝试在光标位置插入
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        // 先插入一个换行确保不会和前文挤在一起
        document.execCommand('insertHTML', false, '<p><br></p>' + html + '<p><br></p>')
        alert('已插入到光标位置')
        return
      }
    }
    
    // 如果光标不在编辑器内，追加到末尾
    editor.innerHTML += '<p><br></p>' + html + '<p><br></p>'
    alert('已追加到文章末尾（提示：先在编辑器中点击定位光标，可插入到指定位置）')
  }

  // 复制生成内容
  const copyGeneratedContent = async () => {
    try {
      await navigator.clipboard.writeText(generatedArticle)
      alert('已复制到剪贴板！可直接粘贴到编辑器中')
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = generatedArticle
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('已复制到剪贴板！')
    }
  }

  // 保存到历史记录
  const saveToHistory = (title: string, content: string) => {
    setWritingHistory(prev => [
      { title, content, time: new Date() },
      ...prev.slice(0, 9) // 最多保存10条
    ])
  }

  // 使用模板生成文章
  const generateWithTemplate = async (templateId: string) => {
    if (!aiInput.trim()) {
      alert('请先输入文章主题')
      return
    }
    
    const template = WRITING_TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    
    setSelectedTemplate(templateId)
    setIsLoading(true)
    setLoadingAction('generate-template')
    setGeneratedArticle('')
    
    const lengthConfig = ARTICLE_LENGTHS.find(l => l.id === selectedLength)
    const styleConfig = WRITING_STYLES.find(s => s.id === selectedStyle)
    
    const prompt = `${template.prompt}

主题：${aiInput}

写作要求：
- 文章风格：${styleConfig?.name || '专业严谨'}
- 文章长度：${lengthConfig?.words || '1000-1500字'}
- 适合微信公众号阅读
- 开头吸引人，结尾有互动引导`
    
    await streamAIRequest(
      prompt,
      (text) => setGeneratedArticle(text),
      () => {
        setIsLoading(false)
        setLoadingAction('')
        if (generatedArticle) {
          saveToHistory(aiInput, generatedArticle)
        }
      },
      (error) => {
        alert(error)
        setIsLoading(false)
        setLoadingAction('')
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex bg-gray-100 rounded-lg p-1 mx-4 mt-4">
        <button
          onClick={() => setActiveTab('title')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'title' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          标题生成
        </button>
        <button
          onClick={() => setActiveTab('article')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'article' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          模板写作
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'tools' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          AI 工具
        </button>
      </div>

      {/* 标题生成 Tab */}
      {activeTab === 'title' && (
        <div className="px-4 space-y-4">
          {/* 输入区域 */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
            <div className="text-sm font-medium text-gray-800 mb-2">✨ AI 标题生成</div>
            <div className="text-xs text-gray-500 mb-3">输入文章主题或内容，AI 生成高点击率标题</div>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="例如：AI Agent 的发展趋势和应用场景..."
              className="w-full h-20 p-2 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:border-[#07C160]"
              disabled={isLoading}
            />
        
        {/* 热点搜索开关 */}
        <div className="flex items-center justify-between mt-3 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseHotSearch(!useHotSearch)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                useHotSearch ? 'bg-[#07C160]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  useHotSearch ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-xs text-gray-600">🔥 结合热点资讯</span>
          </div>
          {useHotSearch && (
            <button
              onClick={searchHotTopics}
              disabled={isLoading || !aiInput}
              className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs hover:bg-orange-200 disabled:opacity-50"
            >
              {isLoading && loadingAction === 'hot-search' ? '搜索中...' : '搜索热点'}
            </button>
          )}
        </div>

        {/* 热点搜索结果 */}
        {useHotSearch && hotSearchResults && hotSearchResults.results.length > 0 && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-xs font-medium text-orange-700 mb-2 flex items-center gap-1">
              🔥 已获取 {hotSearchResults.results.length} 条热点资讯
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {hotSearchResults.results.slice(0, 3).map((r, i) => (
                <div key={i} className="text-[10px] text-gray-600 truncate">
                  <span className="text-orange-500 mr-1">{i + 1}.</span>
                  {r.title}
                </div>
              ))}
              {hotSearchResults.results.length > 3 && (
                <div className="text-[10px] text-gray-400">
                  +{hotSearchResults.results.length - 3} 条更多资讯
                </div>
              )}
            </div>
          </div>
        )}

        {/* 热点搜索加载中 */}
        {isLoading && loadingAction === 'hot-search' && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"></div>
              <span className="text-xs text-orange-600">正在搜索最新热点...</span>
            </div>
          </div>
        )}

        {/* 生成按钮和数量选择 */}
        <div className="flex gap-2">
          <button
            onClick={generateTitles}
            disabled={isLoading || !aiInput}
            className="flex-1 py-2.5 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && loadingAction === 'generate-title' ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>生成中...</span>
              </>
            ) : useHotSearch ? '🔥 生成热点标题' : '✨ 生成标题'}
          </button>
          <select
            value={titleCount}
            onChange={(e) => setTitleCount(Number(e.target.value))}
            className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#07C160]/30 cursor-pointer"
          >
            <option value={3}>3 个</option>
            <option value={5}>5 个</option>
            <option value={8}>8 个</option>
            <option value={10}>10 个</option>
            <option value={15}>15 个</option>
          </select>
        </div>
      </div>

      {/* 加载中动画 */}
      {isLoading && loadingAction === 'generate-title' && aiTitles.length === 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-[#07C160]/30 border-t-[#07C160] rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">AI 正在思考中...</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-3/5"></div>
          </div>
        </div>
      )}

      {/* 生成的标题列表 */}
      {aiTitles.length > 0 && (
        <div className="p-3 bg-white border border-gray-200 rounded-xl">
          <div className="text-xs font-medium text-gray-700 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              📋 生成结果（点击选择）
              {isLoading && loadingAction === 'generate-title' && (
                <span className="inline-block w-3 h-3 border-2 border-[#07C160]/30 border-t-[#07C160] rounded-full animate-spin"></span>
              )}
            </span>
            <span className="text-gray-400">{aiTitles.length} 个标题</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {aiTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => selectTitle(title)}
                disabled={isLoading}
                className={`w-full p-2.5 text-left text-xs rounded-lg border transition-all ${
                  selectedTitle === title
                    ? 'border-[#07C160] bg-[#e8f8ef] text-[#07C160]'
                    : 'border-gray-200 hover:border-[#07C160] hover:bg-gray-50'
                } ${isLoading ? 'opacity-70' : ''}`}
              >
                <span className="text-gray-400 mr-2">{i + 1}.</span>
                {title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 选中标题后的操作 */}
      {selectedTitle && !isLoading && (
        <div className="p-3 bg-[#e8f8ef] border border-[#07C160]/30 rounded-xl">
          <div className="text-xs font-medium text-[#07C160] mb-2">✓ 已选择标题</div>
          <div className="text-sm text-gray-800 mb-3 font-medium">{selectedTitle}</div>
          <div className="flex gap-2">
            <button
              onClick={generateArticle}
              disabled={isLoading}
              className="flex-1 py-2 bg-[#07C160] text-white rounded-lg text-xs hover:bg-[#06AD56] disabled:opacity-50 flex items-center justify-center gap-1"
            >
              📝 生成文章
            </button>
            <button
              onClick={() => {
                setSelectedTitle('')
                setGeneratedArticle('')
              }}
              className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 文章生成中加载动画 */}
      {isLoading && (loadingAction === 'generate-article' || loadingAction === 'generate-full') && !generatedArticle && (
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 border-2 border-[#07C160]/30 border-t-[#07C160] rounded-full animate-spin"></div>
            <div>
              <div className="text-sm font-medium text-gray-800">AI 正在撰写文章...</div>
              <div className="text-xs text-gray-500">预计需要 10-30 秒</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-11/12"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-4/5"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-9/12"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6"></div>
          </div>
        </div>
      )}

      {/* 生成的文章 */}
      {generatedArticle && (
        <div className="p-3 bg-white border border-gray-200 rounded-xl">
          <div className="text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              📄 生成的文章
              {isLoading && (loadingAction === 'generate-article' || loadingAction === 'generate-full') && (
                <span className="inline-block w-3 h-3 border-2 border-[#07C160]/30 border-t-[#07C160] rounded-full animate-spin"></span>
              )}
            </span>
            <span className="text-gray-400">{generatedArticle.length} 字</span>
          </div>
          <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto mb-3 p-2 bg-gray-50 rounded-lg">
            {generatedArticle}
            {isLoading && (loadingAction === 'generate-article' || loadingAction === 'generate-full') && (
              <span className="inline-block w-1.5 h-4 bg-[#07C160] ml-0.5 animate-pulse"></span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={insertAtCursor}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>生成中...</span>
                </>
              ) : '📍 插入到光标处'}
            </button>
            <button
              onClick={copyGeneratedContent}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              📋 复制内容
            </button>
          </div>
        </div>
      )}

      {/* 快捷功能 */}
      <div className="border-t border-gray-100 pt-4">
        <div className="text-xs text-gray-500 mb-3">快捷功能</div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={generateFullArticle}
            disabled={isLoading || !aiInput}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center hover:border-[#07C160] disabled:opacity-50"
          >
            <div className="text-lg mb-1">📄</div>
            <div className="text-xs text-gray-600">一键生成</div>
          </button>
          <button 
            onClick={async () => {
              const editor = getEditor()
              if (!editor?.innerText) {
                alert('请先在编辑器中输入内容')
                return
              }
              setIsLoading(true)
              setLoadingAction('rewrite')
              const result = await aiRequest('rewrite', editor.innerText)
              if (result) {
                setGeneratedArticle(result)
              }
              setIsLoading(false)
              setLoadingAction('')
            }}
            disabled={isLoading}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center hover:border-[#07C160] disabled:opacity-50"
          >
            <div className="text-lg mb-1">📝</div>
            <div className="text-xs text-gray-600">润色改写</div>
          </button>
          <button 
            onClick={async () => {
              if (!selectedTitle && !aiInput) {
                alert('请先输入主题或选择标题')
                return
              }
              setIsLoading(true)
              const result = await aiRequest('generate-outline', selectedTitle || aiInput)
              if (result) {
                setAiResult(result)
              }
              setIsLoading(false)
            }}
            disabled={isLoading}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center hover:border-[#07C160] disabled:opacity-50"
          >
            <div className="text-lg mb-1">📋</div>
            <div className="text-xs text-gray-600">生成大纲</div>
          </button>
          <button 
            onClick={async () => {
              if (!selectedTitle) {
                alert('请先选择一个标题')
                return
              }
              setIsLoading(true)
              const result = await aiRequest('score-title', selectedTitle)
              if (result) {
                alert(result)
              }
              setIsLoading(false)
            }}
            disabled={isLoading || !selectedTitle}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center hover:border-[#07C160] disabled:opacity-50"
          >
            <div className="text-lg mb-1">📊</div>
            <div className="text-xs text-gray-600">标题评分</div>
          </button>
        </div>
      </div>

      {/* 大纲结果显示 */}
      {aiResult && !aiTitles.length && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-medium text-blue-800 mb-2">📋 结果</div>
          <div className="text-xs text-gray-700 whitespace-pre-wrap">{aiResult}</div>
        </div>
      )}
        </div>
      )}

      {/* 模板写作 Tab */}
      {activeTab === 'article' && (
        <div className="px-4 space-y-4">
          {/* 主题输入 */}
          <div className="p-3 bg-white border border-gray-200 rounded-xl">
            <div className="text-xs font-medium text-gray-700 mb-2">📝 文章主题</div>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="输入你想写的文章主题..."
              className="w-full h-16 p-2 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:border-[#07C160]"
              disabled={isLoading}
            />
          </div>

          {/* 写作风格选择 */}
          <div className="p-3 bg-white border border-gray-200 rounded-xl">
            <div className="text-xs font-medium text-gray-700 mb-2">🎨 写作风格</div>
            <div className="grid grid-cols-2 gap-2">
              {WRITING_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-2 text-left rounded-lg border transition-all ${
                    selectedStyle === style.id
                      ? 'border-[#07C160] bg-[#e8f8ef]'
                      : 'border-gray-200 hover:border-[#07C160]'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-800">{style.name}</div>
                  <div className="text-[10px] text-gray-500">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 文章长度选择 */}
          <div className="p-3 bg-white border border-gray-200 rounded-xl">
            <div className="text-xs font-medium text-gray-700 mb-2">📏 文章长度</div>
            <div className="flex gap-2">
              {ARTICLE_LENGTHS.map(len => (
                <button
                  key={len.id}
                  onClick={() => setSelectedLength(len.id)}
                  className={`flex-1 p-2 text-center rounded-lg border transition-all ${
                    selectedLength === len.id
                      ? 'border-[#07C160] bg-[#e8f8ef]'
                      : 'border-gray-200 hover:border-[#07C160]'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-800">{len.name}</div>
                  <div className="text-[10px] text-gray-500">{len.words}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 写作模板 */}
          <div className="p-3 bg-white border border-gray-200 rounded-xl">
            <div className="text-xs font-medium text-gray-700 mb-3">📚 选择模板开始写作</div>
            <div className="grid grid-cols-2 gap-2">
              {WRITING_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => generateWithTemplate(template.id)}
                  disabled={isLoading || !aiInput}
                  className={`p-3 text-left rounded-lg border transition-all hover:border-[#07C160] disabled:opacity-50 ${
                    selectedTemplate === template.id && isLoading
                      ? 'border-[#07C160] bg-[#e8f8ef]'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-xl mb-1">{template.icon}</div>
                  <div className="text-xs font-medium text-gray-800">{template.name}</div>
                  <div className="text-[10px] text-gray-500">{template.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 生成中状态 */}
          {isLoading && loadingAction === 'generate-template' && (
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 border-2 border-[#07C160]/30 border-t-[#07C160] rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">AI 正在根据模板生成文章...</span>
              </div>
            </div>
          )}

          {/* 生成的文章 */}
          {generatedArticle && activeTab === 'article' && (
            <div className="p-3 bg-white border border-gray-200 rounded-xl">
              <div className="text-xs font-medium text-gray-700 mb-2">📄 生成的文章 <span className="text-gray-400">({generatedArticle.length} 字)</span></div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto mb-3 p-2 bg-gray-50 rounded-lg">
                {generatedArticle}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={insertAtCursor}
                  className="flex-1 py-2.5 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] flex items-center justify-center gap-1"
                >
                  📍 插入到光标处
                </button>
                <button
                  onClick={copyGeneratedContent}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                  📋 复制内容
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI 工具 Tab */}
      {activeTab === 'tools' && (
        <div className="px-4 space-y-4">
          {/* 历史记录按钮 */}
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-gray-700">🛠️ AI 辅助工具</div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-[#07C160] hover:underline"
            >
              {showHistory ? '隐藏历史' : '查看历史'} ({writingHistory.length})
            </button>
          </div>

          {/* 历史记录 */}
          {showHistory && writingHistory.length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
              {writingHistory.map((item, i) => (
                <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-500">
                    {item.time.toLocaleString()} · {item.content.length}字
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 工具网格 */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={async () => {
                const editor = getEditor()
                if (!editor?.innerText) {
                  alert('请先在编辑器中输入内容')
                  return
                }
                setIsLoading(true)
                const result = await aiRequest('summarize', editor.innerText.slice(0, 3000))
                if (result) {
                  alert(`📝 文章摘要\n\n${result}`)
                }
                setIsLoading(false)
              }}
              disabled={isLoading}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl text-center hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="text-xs font-medium text-gray-800">生成摘要</div>
              <div className="text-[10px] text-gray-500">提取文章核心</div>
            </button>

            <button 
              onClick={async () => {
                const editor = getEditor()
                if (!editor?.innerText) {
                  alert('请先在编辑器中输入内容')
                  return
                }
                setIsLoading(true)
                const result = await aiRequest('rewrite', editor.innerText.slice(0, 3000))
                if (result) {
                  setGeneratedArticle(result)
                  setActiveTab('title')
                }
                setIsLoading(false)
              }}
              disabled={isLoading}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl text-center hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="text-xs font-medium text-gray-800">润色改写</div>
              <div className="text-[10px] text-gray-500">优化文章表达</div>
            </button>

            <button 
              onClick={async () => {
                const editor = getEditor()
                if (!editor?.innerText) {
                  alert('请先在编辑器中输入内容')
                  return
                }
                setIsLoading(true)
                const result = await aiRequest('expand', editor.innerText.slice(0, 2000))
                if (result) {
                  setGeneratedArticle(result)
                  setActiveTab('title')
                }
                setIsLoading(false)
              }}
              disabled={isLoading}
              className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl text-center hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <div className="text-2xl mb-2">📈</div>
              <div className="text-xs font-medium text-gray-800">扩写内容</div>
              <div className="text-[10px] text-gray-500">增加细节论述</div>
            </button>

            <button 
              onClick={async () => {
                const topic = prompt('请输入文章主题：')
                if (!topic) return
                setIsLoading(true)
                const result = await aiRequest('generate-outline', topic)
                if (result) {
                  alert(`📋 文章大纲\n\n${result}`)
                }
                setIsLoading(false)
              }}
              disabled={isLoading}
              className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl text-center hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-xs font-medium text-gray-800">生成大纲</div>
              <div className="text-[10px] text-gray-500">规划文章结构</div>
            </button>
          </div>

          {/* 加载状态 */}
          {isLoading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></span>
                AI 正在处理中...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
