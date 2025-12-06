import { useState } from 'react'
import { streamAIRequest, aiRequest, getEditor, setEditorTitle, formatArticleToHtml } from '../utils'

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
    
    const prompt = `根据以下文章内容，生成10个高点击率的微信公众号标题：\n\n${aiInput}`
    
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
    
    const prompt = `标题：${selectedTitle}\n\n${aiInput ? `参考内容：${aiInput}\n\n` : ''}请根据以上标题撰写一篇1000-1500字的微信公众号文章，要求：
1. 开头要有吸引力，引起读者兴趣
2. 内容分段清晰，每段有小标题
3. 语言通俗易懂，适合大众阅读
4. 结尾有总结和互动引导`
    
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

  // 插入文章到编辑器
  const insertArticleToEditor = () => {
    const editor = getEditor()
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }
    editor.innerHTML = formatArticleToHtml(generatedArticle, themeColor)
    alert('文章已插入编辑器！')
  }

  return (
    <div className="p-4 space-y-4">
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
        <button
          onClick={generateTitles}
          disabled={isLoading || !aiInput}
          className="mt-2 w-full py-2.5 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && loadingAction === 'generate-title' ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>AI 正在生成...</span>
            </>
          ) : '生成标题'}
        </button>
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
          <button
            onClick={insertArticleToEditor}
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>生成中...</span>
              </>
            ) : '✨ 插入到编辑器'}
          </button>
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
  )
}
