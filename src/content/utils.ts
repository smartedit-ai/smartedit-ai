import { AI_PROVIDERS } from './constants'

// 获取编辑器元素
export const getEditor = (): HTMLElement | null => {
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

// 插入样式到编辑器
export const insertStyle = (html: string, themeColor: string) => {
  const editor = getEditor()
  if (!editor) {
    alert('请先打开文章编辑页面')
    return
  }
  const coloredHtml = html.replace(/#07C160/g, themeColor)
  editor.innerHTML += coloredHtml
}

// 插入图片到编辑器（光标位置或末尾）
export const insertImage = (url: string, description?: string) => {
  const editor = getEditor()
  if (!editor) {
    alert('请先打开文章编辑页面')
    return
  }
  
  const img = document.createElement('img')
  img.src = url
  img.alt = description || '图片'
  img.style.cssText = 'max-width:100%;height:auto;display:block;margin:20px auto;border-radius:8px'
  
  // 尝试在光标位置插入
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    
    // 检查光标是否在编辑器内
    if (editor.contains(range.commonAncestorContainer)) {
      // 创建包装容器，确保图片独占一行
      const wrapper = document.createElement('p')
      wrapper.style.cssText = 'text-align:center;margin:20px 0'
      wrapper.appendChild(img)
      
      // 在光标位置插入
      range.deleteContents()
      range.insertNode(wrapper)
      
      // 将光标移动到图片后面
      range.setStartAfter(wrapper)
      range.setEndAfter(wrapper)
      selection.removeAllRanges()
      selection.addRange(range)
      
      return
    }
  }
  
  // 如果光标不在编辑器内，则追加到末尾
  const wrapper = document.createElement('p')
  wrapper.style.cssText = 'text-align:center;margin:20px 0'
  wrapper.appendChild(img)
  editor.appendChild(wrapper)
}

// 设置微信编辑器标题
export const setEditorTitle = (title: string) => {
  const titleInput = document.querySelector('input[placeholder*="标题"]') as HTMLInputElement
    || document.querySelector('.title-input input') as HTMLInputElement
    || document.querySelector('#title') as HTMLInputElement
  if (titleInput) {
    titleInput.value = title
    titleInput.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

// 清除格式
export const clearFormat = () => {
  const editor = getEditor()
  if (!editor) return
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const text = range.toString()
    if (text) {
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
    }
  }
}

// 首行缩进
export const addIndent = () => {
  const editor = getEditor()
  if (!editor) return
  editor.querySelectorAll('p').forEach(p => {
    (p as HTMLElement).style.textIndent = '2em'
  })
  alert('已添加首行缩进')
}

// 调整行高
export const adjustLineHeight = (height: string) => {
  const editor = getEditor()
  if (!editor) return
  editor.querySelectorAll('p, div, span').forEach(el => {
    (el as HTMLElement).style.lineHeight = height
  })
  alert(`行高已调整为 ${height}`)
}

// 段落间距
export const adjustParagraphSpacing = (spacing: string) => {
  const editor = getEditor()
  if (!editor) return
  editor.querySelectorAll('p').forEach(p => {
    (p as HTMLElement).style.marginBottom = spacing
  })
  alert(`段落间距已调整为 ${spacing}`)
}

// 应用排版模板
export const applyTemplate = (templateName: string, themeColor: string) => {
  const editor = getEditor()
  if (!editor) return
  
  const templates: Record<string, { fontSize: string; lineHeight: string; color: string; marginBottom: string }> = {
    '简约清新': { fontSize: '15px', lineHeight: '2', color: '#333', marginBottom: '16px' },
    '商务专业': { fontSize: '16px', lineHeight: '1.8', color: '#222', marginBottom: '20px' },
    '文艺优雅': { fontSize: '15px', lineHeight: '2.2', color: '#444', marginBottom: '24px' },
    '科技现代': { fontSize: '14px', lineHeight: '1.75', color: '#333', marginBottom: '14px' },
  }
  
  const style = templates[templateName]
  if (!style) return
  
  editor.querySelectorAll('p').forEach(p => {
    const el = p as HTMLElement
    el.style.fontSize = style.fontSize
    el.style.lineHeight = style.lineHeight
    el.style.color = style.color
    el.style.marginBottom = style.marginBottom
    el.style.textIndent = '2em'
  })
  
  editor.querySelectorAll('h1, h2, h3, h4').forEach(h => {
    const el = h as HTMLElement
    el.style.color = themeColor
    el.style.fontWeight = 'bold'
    el.style.marginTop = '24px'
    el.style.marginBottom = '16px'
  })
  
  alert(`已应用「${templateName}」模板`)
}

// Markdown 自动排版
export const autoFormatMarkdown = (themeColor: string) => {
  const editor = getEditor()
  if (!editor) return
  
  let html = editor.innerHTML
  
  // 转换 Markdown 语法
  html = html.replace(/^### (.+)$/gm, `<h3 style="font-size:17px;font-weight:bold;color:${themeColor};margin:20px 0 12px">$1</h3>`)
  html = html.replace(/^## (.+)$/gm, `<h2 style="font-size:18px;font-weight:bold;color:${themeColor};margin:24px 0 16px">$1</h2>`)
  html = html.replace(/^# (.+)$/gm, `<h1 style="font-size:20px;font-weight:bold;color:${themeColor};margin:28px 0 20px">$1</h1>`)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/^---$/gm, `<hr style="border:none;border-top:1px solid #e8e8e8;margin:24px 0">`)
  html = html.replace(/^> (.+)$/gm, `<blockquote style="border-left:4px solid ${themeColor};padding-left:16px;color:#666;margin:16px 0">$1</blockquote>`)
  
  editor.innerHTML = html
  alert('Markdown 排版完成')
}

// 格式化文章为 HTML（使用 section 包裹，确保可编辑）
export const formatArticleToHtml = (article: string, themeColor: string): string => {
  const paragraphs = article.split('\n\n').filter(p => p.trim())
  let html = ''
  
  paragraphs.forEach(p => {
    const trimmed = p.trim()
    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 2
      const text = trimmed.replace(/^#+\s*/, '')
      html += `<section style="margin:24px 0 16px 0"><h${Math.min(level + 1, 4)} style="font-size:${20 - level * 2}px;font-weight:bold;color:${themeColor};margin:0">${text}</h${Math.min(level + 1, 4)}></section>`
    } else if (trimmed.length < 50 && !trimmed.includes('。')) {
      html += `<section style="margin:24px 0 12px 0"><h3 style="font-size:17px;font-weight:bold;color:${themeColor};margin:0">${trimmed}</h3></section>`
    } else {
      html += `<section style="margin-bottom:16px"><p style="font-size:15px;line-height:2;color:#333;margin:0;text-indent:2em">${trimmed}</p></section>`
    }
  })
  
  return html
}

// 插入文章到编辑器（保持可编辑性）
export const insertArticleContent = (article: string, themeColor: string): boolean => {
  const editor = getEditor()
  if (!editor) {
    return false
  }
  
  const html = formatArticleToHtml(article, themeColor)
  
  // 创建临时容器解析 HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // 清空编辑器
  editor.innerHTML = ''
  
  // 逐个插入子元素，确保 DOM 结构正确
  while (temp.firstChild) {
    editor.appendChild(temp.firstChild)
  }
  
  // 触发 input 事件，让编辑器知道内容已更新
  editor.dispatchEvent(new Event('input', { bubbles: true }))
  
  // 将光标移动到末尾
  const selection = window.getSelection()
  if (selection) {
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false) // 折叠到末尾
    selection.removeAllRanges()
    selection.addRange(range)
  }
  
  // 聚焦编辑器
  editor.focus()
  
  return true
}

// 流式 AI 请求
export const streamAIRequest = async (
  prompt: string, 
  onChunk: (text: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: string) => void
) => {
  try {
    const result = await chrome.storage.sync.get('settings')
    const settings = result.settings as { aiProvider: string; apiKey: string; customBaseUrl?: string; customModel?: string }
    
    if (!settings?.apiKey) {
      throw new Error('请先在设置中配置 API Key')
    }
    
    const provider = AI_PROVIDERS[settings.aiProvider] || AI_PROVIDERS.openai
    const baseUrl = settings.customBaseUrl || provider.baseUrl
    const model = settings.customModel || provider.defaultModel
    
    if (!baseUrl || !model) {
      throw new Error('请配置 API Base URL 和模型')
    }
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: '你是一个专业的微信公众号内容创作助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    
    if (!reader) {
      throw new Error('无法读取响应流')
    }
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          
          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content || ''
            if (content) {
              fullText += content
              onChunk(fullText)
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
    
    onComplete(fullText)
    return fullText
  } catch (error) {
    onError((error as Error).message)
    return null
  }
}

// 普通 AI 请求
export const aiRequest = async (action: string, text: string): Promise<string | null> => {
  try {
    if (!chrome?.runtime?.sendMessage) {
      throw new Error('扩展连接已断开，请刷新页面重试')
    }
    
    const response = await chrome.runtime.sendMessage({
      type: 'AI_REQUEST',
      data: { action, text }
    })
    
    if (!response) {
      throw new Error('未收到响应，请刷新页面重试')
    }
    
    if (response.success) {
      return response.data
    } else {
      alert(response.error)
      return null
    }
  } catch (error) {
    const errorMsg = (error as Error).message
    if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('Cannot read properties of undefined')) {
      alert('扩展连接已断开，请刷新页面后重试')
    } else {
      alert(errorMsg)
    }
    return null
  }
}

// 搜索图片
export const searchImages = async (query: string): Promise<Array<{id: string; url: string; thumb: string; description?: string; author?: string}> | null> => {
  try {
    if (!chrome?.runtime?.sendMessage) {
      throw new Error('扩展连接已断开，请刷新页面重试')
    }
    
    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_IMAGES',
      data: { query, source: 'unsplash' }
    })
    
    if (!response) {
      throw new Error('未收到响应，请刷新页面重试')
    }
    
    if (response.success) {
      return response.data
    } else {
      alert(response.error || '搜索失败')
      return null
    }
  } catch (error) {
    const errorMsg = (error as Error).message
    if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('Cannot read properties of undefined')) {
      alert('扩展连接已断开，请刷新页面后重试')
    } else {
      alert(errorMsg)
    }
    return null
  }
}

// Tavily 热点搜索
export interface TavilySearchResult {
  answer: string
  results: Array<{
    title: string
    url: string
    content: string
    score: number
    publishedDate?: string
  }>
}

export const tavilySearch = async (query: string, maxResults: number = 5): Promise<TavilySearchResult | null> => {
  try {
    // 检查 chrome.runtime 是否可用
    if (!chrome?.runtime?.sendMessage) {
      throw new Error('扩展连接已断开，请刷新页面重试')
    }
    
    const response = await chrome.runtime.sendMessage({
      type: 'TAVILY_SEARCH',
      data: { query, maxResults }
    })
    
    if (!response) {
      throw new Error('未收到响应，请刷新页面重试')
    }
    
    if (response.success) {
      return response.data
    } else {
      throw new Error(response.error || '搜索失败')
    }
  } catch (error) {
    const errorMsg = (error as Error).message
    // 检查是否是扩展断开连接的错误
    if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('Cannot read properties of undefined')) {
      alert('扩展连接已断开，请刷新页面后重试')
    } else {
      alert(errorMsg)
    }
    return null
  }
}
