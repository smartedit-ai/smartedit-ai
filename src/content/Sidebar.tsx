import { useState, useEffect } from 'react'

// 样式模板数据
const STYLE_TEMPLATES = {
  titles: [
    { name: '简约标题', preview: '━━ 标题 ━━', html: '<section style="text-align:center;margin:20px 0"><h2 style="display:inline-block;font-size:18px;font-weight:bold;color:#333;border-bottom:3px solid #07C160;padding-bottom:8px">标题文字</h2></section>' },
    { name: '左侧装饰', preview: '▌标题', html: '<section style="display:flex;align-items:center;margin:20px 0"><span style="width:4px;height:24px;background:#07C160;margin-right:12px;border-radius:2px"></span><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
    { name: '编号标题', preview: '① 标题', html: '<section style="display:flex;align-items:center;margin:20px 0"><span style="width:32px;height:32px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;margin-right:12px">01</span><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
    { name: '底色标题', preview: '█ 标题 █', html: '<section style="background:linear-gradient(135deg,#07C160 0%,#06AD56 100%);padding:12px 20px;border-radius:8px;margin:20px 0"><h2 style="font-size:18px;font-weight:bold;color:#fff;margin:0;text-align:center">标题文字</h2></section>' },
    { name: '双线标题', preview: '═══ 标题 ═══', html: '<section style="text-align:center;margin:20px 0"><div style="display:flex;align-items:center;justify-content:center;gap:12px"><span style="flex:1;height:2px;background:linear-gradient(90deg,transparent,#07C160)"></span><h2 style="font-size:18px;font-weight:bold;color:#07C160;margin:0;white-space:nowrap">标题文字</h2><span style="flex:1;height:2px;background:linear-gradient(90deg,#07C160,transparent)"></span></div></section>' },
    { name: '引用标题', preview: '『 标题 』', html: '<section style="border-left:4px solid #07C160;padding-left:16px;margin:20px 0"><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
  ],
  content: [
    { name: '引用段落', preview: '❝ 引用 ❞', html: '<blockquote style="background:#f8f9fa;border-left:4px solid #07C160;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><p style="font-size:15px;line-height:1.8;color:#666;margin:0;font-style:italic">这是一段引用文字，适合用于名人名言、重要观点。</p></blockquote>' },
    { name: '重点提示', preview: '💡 提示', html: '<section style="background:linear-gradient(135deg,#fff9e6 0%,#fff3cd 100%);border:1px solid #ffc107;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#856404;margin:0"><strong>💡 提示：</strong>这是一段重点提示内容。</p></section>' },
    { name: '警告提示', preview: '⚠️ 警告', html: '<section style="background:linear-gradient(135deg,#ffe6e6 0%,#ffcccc 100%);border:1px solid #dc3545;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#721c24;margin:0"><strong>⚠️ 注意：</strong>这是一段警告内容。</p></section>' },
    { name: '成功提示', preview: '✅ 成功', html: '<section style="background:linear-gradient(135deg,#e6ffed 0%,#c3f7d5 100%);border:1px solid #28a745;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#155724;margin:0"><strong>✅ 成功：</strong>操作已完成。</p></section>' },
  ],
  dividers: [
    { name: '简约线条', preview: '────────', html: '<section style="text-align:center;margin:30px 0"><hr style="border:none;border-top:1px solid #e8e8e8;margin:0"></section>' },
    { name: '渐变线条', preview: '━━━━━━━━', html: '<section style="text-align:center;margin:30px 0"><div style="height:2px;background:linear-gradient(90deg,transparent,#07C160,transparent)"></div></section>' },
    { name: '圆点分割', preview: '● ● ●', html: '<section style="text-align:center;margin:30px 0;display:flex;align-items:center;justify-content:center;gap:8px"><span style="width:6px;height:6px;background:#07C160;border-radius:50%"></span><span style="width:6px;height:6px;background:#07C160;border-radius:50%;opacity:0.6"></span><span style="width:6px;height:6px;background:#07C160;border-radius:50%;opacity:0.3"></span></section>' },
    { name: '星星分割', preview: '✦ ✦ ✦', html: '<section style="text-align:center;margin:30px 0;font-size:14px;color:#07C160">✦ ✦ ✦</section>' },
    { name: 'END分割', preview: '— END —', html: '<section style="display:flex;align-items:center;margin:30px 0"><span style="flex:1;height:1px;background:#e8e8e8"></span><span style="padding:0 20px;font-size:13px;color:#999">END</span><span style="flex:1;height:1px;background:#e8e8e8"></span></section>' },
  ],
  cards: [
    { name: '简约卡片', preview: '📋 卡片', html: '<section style="background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:20px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,0.05)"><h3 style="font-size:16px;font-weight:bold;color:#333;margin:0 0 12px 0">卡片标题</h3><p style="font-size:14px;line-height:1.8;color:#666;margin:0">这是卡片内容区域。</p></section>' },
    { name: '数据卡片', preview: '📊 数据', html: '<section style="display:flex;gap:16px;margin:20px 0"><div style="flex:1;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:20px;text-align:center"><div style="font-size:32px;font-weight:bold;color:#fff">99%</div><div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">满意度</div></div><div style="flex:1;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:12px;padding:20px;text-align:center"><div style="font-size:32px;font-weight:bold;color:#fff">10W+</div><div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">阅读量</div></div></section>' },
  ],
  lists: [
    { name: '勾选列表', preview: '✓ 列表', html: '<section style="margin:20px 0"><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第一条列表内容</span></div><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第二条列表内容</span></div><div style="display:flex;align-items:flex-start"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第三条列表内容</span></div></section>' },
    { name: '编号列表', preview: '① ② ③', html: '<section style="margin:20px 0"><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="min-width:24px;height:24px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;margin-right:12px">1</span><span style="font-size:15px;color:#333;line-height:1.6;padding-top:2px">第一条内容</span></div><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="min-width:24px;height:24px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;margin-right:12px">2</span><span style="font-size:15px;color:#333;line-height:1.6;padding-top:2px">第二条内容</span></div></section>' },
  ],
  follow: [
    { name: '关注引导', preview: '👆 关注', html: '<section style="text-align:center;padding:30px 20px;margin:30px 0;background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border-radius:12px"><p style="font-size:14px;color:#666;margin:0 0 12px 0">觉得有用？点个关注吧 👇</p><p style="font-size:16px;font-weight:bold;color:#07C160;margin:0">长按识别二维码关注我们</p></section>' },
    { name: '底部引导', preview: '👍 点赞', html: '<section style="background:linear-gradient(135deg,#07C160 0%,#06AD56 100%);border-radius:12px;padding:24px;margin:30px 0;text-align:center"><p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px 0">如果觉得文章对你有帮助</p><p style="font-size:18px;font-weight:bold;color:#fff;margin:0">👍 点赞 | ⭐ 收藏 | 🔄 转发</p></section>' },
  ],
}

// 背景模板
const BG_TEMPLATES = [
  { name: '纯白', color: '#ffffff' },
  { name: '米黄', color: '#faf8f5' },
  { name: '浅灰', color: '#f5f5f5' },
  { name: '浅绿', color: '#f0fff4' },
  { name: '浅蓝', color: '#f0f9ff' },
  { name: '浅粉', color: '#fff5f5' },
]

// 主题色
const THEME_COLORS = ['#07C160', '#1890ff', '#722ed1', '#eb2f96', '#fa541c', '#faad14', '#52c41a', '#13c2c2', '#2f54eb', '#333333']

// 导航菜单
const NAV_ITEMS = [
  { id: 'template', icon: '📝', label: '排版' },
  { id: 'markdown', icon: '📋', label: 'MD' },
  { id: 'ai', icon: '✨', label: '写作' },
  { id: 'image', icon: '🖼️', label: '配图' },
  { id: 'tool', icon: '🔧', label: '工具' },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('template')
  const [styleCategory, setStyleCategory] = useState('titles')
  const [themeColor, setThemeColor] = useState('#07C160')
  const [aiInput, setAiInput] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiTitles, setAiTitles] = useState<string[]>([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [generatedArticle, setGeneratedArticle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState('')

  // 注册控制函数到全局
  useEffect(() => {
    const register = (window as unknown as { __SMARTEDIT_REGISTER__?: (ref: { setIsOpen: (open: boolean) => void; setActiveTab: (tab: string) => void }) => void }).__SMARTEDIT_REGISTER__
    if (register) {
      register({ 
        setIsOpen, 
        setActiveTab: (tab: string) => {
          setActiveNav(tab === 'ai' ? 'ai' : tab === 'format' ? 'tool' : 'template')
        }
      })
    }
  }, [])

  const getEditor = () => {
    const selectors = ['#ueditor_0', '.edui-body-container', '[contenteditable="true"]', '.rich_media_content']
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (el) return el as HTMLElement
    }
    const iframes = document.querySelectorAll('iframe')
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc) {
          for (const sel of selectors) {
            const el = doc.querySelector(sel)
            if (el) return el as HTMLElement
          }
        }
      } catch { /* ignore */ }
    }
    return null
  }

  const insertStyle = (html: string) => {
    const editor = getEditor()
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }
    const coloredHtml = html.replace(/#07C160/g, themeColor)
    editor.innerHTML += coloredHtml
  }

  const aiRequest = async (action: string, text: string): Promise<string | null> => {
    setIsLoading(true)
    setLoadingAction(action)
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        data: { action, text }
      })
      if (response.success) {
        return response.data
      } else {
        alert(response.error)
        return null
      }
    } catch (error) {
      alert((error as Error).message)
      return null
    } finally {
      setIsLoading(false)
      setLoadingAction('')
    }
  }

  // 生成标题
  const generateTitles = async () => {
    if (!aiInput.trim()) {
      alert('请先输入文章主题或内容')
      return
    }
    const result = await aiRequest('generate-title', aiInput)
    if (result) {
      setAiResult(result)
      // 解析标题列表
      const titles = result.split('\n')
        .map(line => line.replace(/^\d+[\.\、\)]\s*/, '').replace(/^[\*\-]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 100)
      setAiTitles(titles)
      setSelectedTitle('')
      setGeneratedArticle('')
    }
  }

  // 选择标题并生成文章
  const selectTitleAndGenerate = async (title: string) => {
    setSelectedTitle(title)
    // 设置微信编辑器的标题
    const titleInput = document.querySelector('input[placeholder*="标题"]') as HTMLInputElement
      || document.querySelector('.title-input input') as HTMLInputElement
      || document.querySelector('#title') as HTMLInputElement
    if (titleInput) {
      titleInput.value = title
      titleInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  // 根据标题生成文章
  const generateArticle = async () => {
    if (!selectedTitle) {
      alert('请先选择一个标题')
      return
    }
    const prompt = `标题：${selectedTitle}\n\n${aiInput ? `参考内容：${aiInput}\n\n` : ''}请根据以上标题撰写一篇1000-1500字的微信公众号文章，要求：
1. 开头要有吸引力，引起读者兴趣
2. 内容分段清晰，每段有小标题
3. 语言通俗易懂，适合大众阅读
4. 结尾有总结和互动引导`
    
    const result = await aiRequest('generate-article', prompt)
    if (result) {
      setGeneratedArticle(result)
    }
  }

  // 插入文章到编辑器
  const insertArticleToEditor = () => {
    const editor = getEditor()
    if (!editor) {
      alert('请先打开文章编辑页面')
      return
    }
    
    // 将文章内容格式化为 HTML
    const paragraphs = generatedArticle.split('\n\n').filter(p => p.trim())
    let html = ''
    
    paragraphs.forEach(p => {
      const trimmed = p.trim()
      // 检测是否是标题（以 # 开头或者是短文本）
      if (trimmed.startsWith('#')) {
        const level = trimmed.match(/^#+/)?.[0].length || 2
        const text = trimmed.replace(/^#+\s*/, '')
        html += `<h${Math.min(level + 1, 4)} style="font-size:${20 - level * 2}px;font-weight:bold;color:${themeColor};margin:24px 0 16px 0">${text}</h${Math.min(level + 1, 4)}>`
      } else if (trimmed.length < 50 && !trimmed.includes('。')) {
        // 短文本可能是小标题
        html += `<h3 style="font-size:17px;font-weight:bold;color:${themeColor};margin:24px 0 12px 0">${trimmed}</h3>`
      } else {
        html += `<p style="font-size:15px;line-height:2;color:#333;margin-bottom:16px;text-indent:2em">${trimmed}</p>`
      }
    })
    
    editor.innerHTML = html
    alert('文章已插入编辑器！')
  }

  // 一键生成完整文章
  const generateFullArticle = async () => {
    if (!aiInput.trim()) {
      alert('请先输入文章主题')
      return
    }
    
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
    
    const result = await aiRequest('generate-article', prompt)
    if (result) {
      const lines = result.split('\n')
      const title = lines[0].replace(/^[#\*]+\s*/, '').replace(/^标题[：:]\s*/, '').trim()
      const content = lines.slice(1).join('\n').trim()
      
      setSelectedTitle(title)
      setGeneratedArticle(content)
      
      // 设置标题
      const titleInput = document.querySelector('input[placeholder*="标题"]') as HTMLInputElement
        || document.querySelector('.title-input input') as HTMLInputElement
        || document.querySelector('#title') as HTMLInputElement
      if (titleInput) {
        titleInput.value = title
        titleInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  }

  // 样式分类标签
  const STYLE_CATEGORIES = [
    { id: 'titles', label: '标题' },
    { id: 'content', label: '正文' },
    { id: 'dividers', label: '分割' },
    { id: 'cards', label: '卡片' },
    { id: 'lists', label: '列表' },
    { id: 'follow', label: '引导' },
  ]

  return (
    <>
      {/* 左侧固定侧边栏 */}
      <div className={`fixed top-0 left-0 h-screen flex z-[999999] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* 导航栏 */}
        <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3 shadow-sm">
          {/* Logo */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center text-white mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          
          {/* 导航按钮 */}
          <div className="flex-1 flex flex-col gap-1 w-full px-1.5">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeNav === item.id 
                    ? 'bg-[#e8f8ef] text-[#07C160]' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 底部关闭按钮 */}
          <button 
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 mt-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>

        {/* 内容面板 */}
        <div className="w-72 bg-white border-r border-gray-200 shadow-lg flex flex-col h-screen">
          {/* 面板头部 */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-800">
              {NAV_ITEMS.find(n => n.id === activeNav)?.icon} {NAV_ITEMS.find(n => n.id === activeNav)?.label}
            </span>
            {activeNav === 'template' && (
              <div className="flex gap-1">
                <button className="px-2 py-1 text-xs bg-[#07C160] text-white rounded">全部模板</button>
                <button className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">单样式</button>
              </div>
            )}
          </div>

          {/* 面板内容 */}
          <div className="flex-1 overflow-y-auto">
            {/* 排版模块 */}
            {activeNav === 'template' && (
              <div>
                {/* 样式分类标签 */}
                <div className="flex flex-wrap gap-1 p-3 border-b border-gray-100 bg-gray-50">
                  {STYLE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setStyleCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                        styleCategory === cat.id
                          ? 'bg-[#07C160] text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-[#07C160]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* 一键换色 */}
                <div className="p-3 border-b border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">🎨 主题色</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {THEME_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          themeColor === color ? 'border-gray-800 scale-110' : 'border-white shadow-sm'
                        }`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* 样式列表 */}
                <div className="p-3 grid grid-cols-2 gap-2">
                  {(STYLE_TEMPLATES[styleCategory as keyof typeof STYLE_TEMPLATES] || []).map((style, i) => (
                    <button
                      key={i}
                      onClick={() => insertStyle(style.html)}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#07C160] hover:shadow-md transition-all text-center group"
                    >
                      <div className="text-lg mb-1 opacity-70 group-hover:opacity-100">{style.preview}</div>
                      <div className="text-[10px] text-gray-500">{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown 模块 */}
            {activeNav === 'markdown' && (
              <div className="p-4">
                <div className="text-sm text-gray-600 mb-4">
                  通过工具栏和快捷键进行全文格式标记，清爽高效排版
                </div>
                <div className="space-y-3">
                  <button className="w-full p-3 bg-[#07C160] text-white rounded-lg text-sm font-medium hover:bg-[#06AD56]">开始 Markdown 排版</button>
                  <button className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">自动排版</button>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-700 mb-2">快捷键提示</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Ctrl+B 加粗</div>
                    <div>Ctrl+I 斜体</div>
                    <div>Ctrl+U 下划线</div>
                  </div>
                </div>
              </div>
            )}

            {/* AI 写作模块 */}
            {activeNav === 'ai' && (
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
                  />
                  <button
                    onClick={generateTitles}
                    disabled={isLoading || !aiInput}
                    className="mt-2 w-full py-2 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] disabled:opacity-50"
                  >
                    {isLoading && loadingAction === 'generate-title' ? '生成中...' : '生成标题'}
                  </button>
                </div>

                {/* 生成的标题列表 */}
                {aiTitles.length > 0 && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-xs font-medium text-gray-700 mb-3 flex items-center justify-between">
                      <span>📋 生成结果（点击选择）</span>
                      <span className="text-gray-400">{aiTitles.length} 个标题</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {aiTitles.map((title, i) => (
                        <button
                          key={i}
                          onClick={() => selectTitleAndGenerate(title)}
                          className={`w-full p-2.5 text-left text-xs rounded-lg border transition-all ${
                            selectedTitle === title
                              ? 'border-[#07C160] bg-[#e8f8ef] text-[#07C160]'
                              : 'border-gray-200 hover:border-[#07C160] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-gray-400 mr-2">{i + 1}.</span>
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 选中标题后的操作 */}
                {selectedTitle && (
                  <div className="p-3 bg-[#e8f8ef] border border-[#07C160]/30 rounded-xl">
                    <div className="text-xs font-medium text-[#07C160] mb-2">✓ 已选择标题</div>
                    <div className="text-sm text-gray-800 mb-3 font-medium">{selectedTitle}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={generateArticle}
                        disabled={isLoading}
                        className="flex-1 py-2 bg-[#07C160] text-white rounded-lg text-xs hover:bg-[#06AD56] disabled:opacity-50"
                      >
                        {isLoading && loadingAction === 'generate-article' ? '生成中...' : '📝 生成文章'}
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

                {/* 生成的文章 */}
                {generatedArticle && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
                      <span>📄 生成的文章</span>
                      <span className="text-gray-400">{generatedArticle.length} 字</span>
                    </div>
                    <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto mb-3 p-2 bg-gray-50 rounded-lg">
                      {generatedArticle}
                    </div>
                    <button
                      onClick={insertArticleToEditor}
                      className="w-full py-2.5 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white rounded-lg text-sm font-medium hover:opacity-90"
                    >
                      ✨ 插入到编辑器
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
                        const result = await aiRequest('rewrite', editor.innerText)
                        if (result) {
                          setGeneratedArticle(result)
                        }
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
                        const result = await aiRequest('generate-outline', selectedTitle || aiInput)
                        if (result) {
                          setAiResult(result)
                        }
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
                        const result = await aiRequest('score-title', selectedTitle)
                        if (result) {
                          alert(result)
                        }
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

            {/* 配图模块 */}
            {activeNav === 'image' && (
              <div>
                {/* 图片分类 */}
                <div className="flex border-b border-gray-100">
                  <button className="flex-1 py-2.5 text-xs font-medium text-[#07C160] border-b-2 border-[#07C160]">背景素材</button>
                  <button className="flex-1 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700">自定义背景</button>
                  <button className="flex-1 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700">渐变背景</button>
                </div>

                {/* 背景色选择 */}
                <div className="p-3">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {BG_TEMPLATES.map((bg, i) => (
                      <button
                        key={i}
                        className="aspect-square rounded-lg border-2 border-gray-200 hover:border-[#07C160] transition-all"
                        style={{ background: bg.color }}
                        title={bg.name}
                      />
                    ))}
                  </div>
                  
                  {/* 图片搜索 */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索图片..."
                      className="w-full px-3 py-2 pl-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#07C160]"
                    />
                    <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                </div>

                {/* 图片网格占位 */}
                <div className="p-3 grid grid-cols-3 gap-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      图片{i}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 工具模块 */}
            {activeNav === 'tool' && (
              <div className="p-4 space-y-3">
                <div className="text-xs text-gray-500 mb-2">一键排版</div>
                {['简约清新', '商务专业', '文艺优雅', '科技现代'].map(name => (
                  <button
                    key={name}
                    onClick={() => {
                      const editor = getEditor()
                      if (editor) {
                        editor.querySelectorAll('p').forEach(p => {
                          (p as HTMLElement).style.fontSize = '15px';
                          (p as HTMLElement).style.lineHeight = '2';
                          (p as HTMLElement).style.marginBottom = '16px'
                        })
                        alert(`已应用「${name}」模板`)
                      }
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#07C160] text-left flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center text-white text-sm">✓</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{name}</div>
                      <div className="text-[10px] text-gray-500">适合日常分享</div>
                    </div>
                  </button>
                ))}

                <div className="border-t border-gray-100 pt-3 mt-4">
                  <div className="text-xs text-gray-500 mb-2">快捷操作</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]">清除格式</button>
                    <button className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]">首行缩进</button>
                    <button className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]">调整行高</button>
                    <button className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]">段落间距</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧悬浮触发按钮（侧边栏关闭时显示） */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 w-8 h-20 bg-[#07C160] text-white rounded-r-lg shadow-lg flex items-center justify-center hover:bg-[#06AD56] transition-colors z-[999998]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}
    </>
  )
}
