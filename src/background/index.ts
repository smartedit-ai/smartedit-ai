// 智编助手 - Background Service Worker

// AI 服务提供商配置
const AI_PROVIDERS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo'
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat'
  },
  aliyun: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus'
  },
  siliconflow: {
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct'
  },
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k'
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash'
  },
  custom: {
    baseUrl: '',
    defaultModel: ''
  }
}

const IMAGE_APIS = {
  unsplash: 'https://api.unsplash.com/search/photos',
  pixabay: 'https://pixabay.com/api/'
}

const TAVILY_API = 'https://api.tavily.com/search'

interface RSSFeed {
  id: string
  name: string
  url: string
  category: string
  enabled: boolean
}

interface RSSItem {
  title: string
  link: string
  description: string
  pubDate: string
  source: string
}

interface Settings {
  themeColor: string
  aiProvider: string
  apiKey: string
  customBaseUrl: string
  customModel: string
  unsplashKey: string
  pixabayKey: string
  tavilyKey: string
  proxyEnabled: boolean
  proxyUrl: string
  proxyType: 'http' | 'socks5' | 'custom'
  rssFeeds: RSSFeed[]
  rssRefreshInterval: number
}

// 初始化
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      settings: {
        themeColor: '#07C160',
        aiProvider: 'openai',
        apiKey: '',
        unsplashKey: '',
        pixabayKey: '',
        showFloatingToolbar: true,
        showSelectionToolbar: true
      }
    })
  }
  createContextMenus()
})

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // 一级菜单：工具名称
    chrome.contextMenus.create({
      id: 'smartedit-root',
      title: '智编助手',
      contexts: ['all']
    })

    // 智能翻译（独立显眼位置）
    chrome.contextMenus.create({
      id: 'smartedit-smart-translate',
      parentId: 'smartedit-root',
      title: '🌐 智能翻译',
      contexts: ['selection']
    })

    // 二级菜单分组：AI 写作
    chrome.contextMenus.create({
      id: 'smartedit-ai-group',
      parentId: 'smartedit-root',
      title: '✨ AI 写作',
      contexts: ['all']
    })
    chrome.contextMenus.create({
      id: 'smartedit-rewrite',
      parentId: 'smartedit-ai-group',
      title: '润色优化',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-expand',
      parentId: 'smartedit-ai-group',
      title: '扩写内容',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-summarize',
      parentId: 'smartedit-ai-group',
      title: '缩写精简',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-translate',
      parentId: 'smartedit-ai-group',
      title: '中英互译',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-style-rewrite',
      parentId: 'smartedit-ai-group',
      title: '改写风格',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-continue',
      parentId: 'smartedit-ai-group',
      title: '续写内容',
      contexts: ['selection']
    })

    // 二级菜单分组：标题工具
    chrome.contextMenus.create({
      id: 'smartedit-title-group',
      parentId: 'smartedit-root',
      title: '📊 标题工具',
      contexts: ['all']
    })
    chrome.contextMenus.create({
      id: 'smartedit-title-score',
      parentId: 'smartedit-title-group',
      title: '标题评分',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-generate-title',
      parentId: 'smartedit-title-group',
      title: '生成标题',
      contexts: ['selection']
    })

    // 二级菜单分组：内容工具
    chrome.contextMenus.create({
      id: 'smartedit-content-group',
      parentId: 'smartedit-root',
      title: '📝 内容工具',
      contexts: ['all']
    })
    chrome.contextMenus.create({
      id: 'smartedit-summary',
      parentId: 'smartedit-content-group',
      title: '生成摘要',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-outline',
      parentId: 'smartedit-content-group',
      title: '生成大纲',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-violation-check',
      parentId: 'smartedit-content-group',
      title: '违规检测',
      contexts: ['selection']
    })

    // 二级菜单分组：收藏工具
    chrome.contextMenus.create({
      id: 'smartedit-collect-group',
      parentId: 'smartedit-root',
      title: '💾 收藏工具',
      contexts: ['all']
    })
    chrome.contextMenus.create({
      id: 'smartedit-collect-text',
      parentId: 'smartedit-collect-group',
      title: '收藏文字',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-collect-image',
      parentId: 'smartedit-collect-group',
      title: '收藏图片',
      contexts: ['image']
    })
    chrome.contextMenus.create({
      id: 'smartedit-collect-link',
      parentId: 'smartedit-collect-group',
      title: '收藏链接',
      contexts: ['link']
    })
    chrome.contextMenus.create({
      id: 'smartedit-save-page',
      parentId: 'smartedit-collect-group',
      title: '📥 保存网页到 Obsidian',
      contexts: ['page']
    })

    // 二级菜单分组：快捷操作
    chrome.contextMenus.create({
      id: 'smartedit-quick-group',
      parentId: 'smartedit-root',
      title: '🔧 快捷操作',
      contexts: ['all']
    })
    chrome.contextMenus.create({
      id: 'smartedit-copy-md',
      parentId: 'smartedit-quick-group',
      title: '复制为 Markdown',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-word-count',
      parentId: 'smartedit-quick-group',
      title: '字数统计',
      contexts: ['selection']
    })
    chrome.contextMenus.create({
      id: 'smartedit-gen-qrcode',
      parentId: 'smartedit-quick-group',
      title: '生成二维码',
      contexts: ['selection', 'link']
    })

    // 分隔线
    chrome.contextMenus.create({
      id: 'smartedit-separator',
      parentId: 'smartedit-root',
      type: 'separator',
      contexts: ['all']
    })

    // 打开设置
    chrome.contextMenus.create({
      id: 'smartedit-settings',
      parentId: 'smartedit-root',
      title: '⚙️ 打开设置',
      contexts: ['all']
    })

    // 打开侧边栏
    chrome.contextMenus.create({
      id: 'smartedit-sidebar',
      parentId: 'smartedit-root',
      title: '📌 打开侧边栏',
      contexts: ['all']
    })
  })
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const menuId = info.menuItemId.toString()
  
  // 处理打开设置
  if (menuId === 'smartedit-settings') {
    chrome.runtime.openOptionsPage()
    return
  }
  
  // 处理打开侧边栏
  if (menuId === 'smartedit-sidebar') {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_SIDEBAR'
      })
    }
    return
  }
  
  // 其他操作需要发送到 content script
  if (menuId.startsWith('smartedit-') && tab?.id) {
    const action = menuId.replace('smartedit-', '')
    
    // 跳过分组菜单
    if (action.endsWith('-group') || action === 'root' || action === 'separator') {
      return
    }
    
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_ACTION',
      action: action,
      text: info.selectionText || '',
      linkUrl: info.linkUrl || '',
      srcUrl: info.srcUrl || '',
      pageUrl: info.pageUrl || ''
    })
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message, sendResponse)
  return true
})

async function handleMessage(message: { type: string; data?: unknown }, sendResponse: (response: unknown) => void) {
  try {
    switch (message.type) {
      case 'AI_REQUEST':
        const aiResult = await handleAIRequest(message.data as { action: string; text: string; options?: Record<string, string> })
        sendResponse({ success: true, data: aiResult })
        break
      case 'SEARCH_IMAGES':
        const images = await searchImages(message.data as { query: string; source: string })
        sendResponse({ success: true, data: images })
        break
      case 'TAVILY_SEARCH':
        console.log('[Tavily] 收到搜索请求:', message.data)
        const searchResult = await tavilySearch(message.data as { query: string; searchDepth?: string; maxResults?: number })
        console.log('[Tavily] 搜索结果:', searchResult)
        sendResponse({ success: true, data: searchResult })
        break
      case 'FETCH_RSS':
        console.log('[RSS] 收到获取请求')
        const rssItems = await fetchAllRSSFeeds()
        console.log('[RSS] 获取到', rssItems.length, '条内容')
        sendResponse({ success: true, data: rssItems })
        break
      case 'FETCH_SINGLE_RSS':
        const feedData = message.data as { url: string; name: string }
        console.log('[RSS] 获取单个源:', feedData.name)
        const singleItems = await fetchRSSFeed(feedData.url, feedData.name)
        sendResponse({ success: true, data: singleItems })
        break
      case 'GET_SETTINGS':
        const settings = await chrome.storage.sync.get('settings')
        sendResponse({ success: true, data: settings.settings })
        break
      case 'SAVE_SETTINGS':
        await chrome.storage.sync.set({ settings: message.data })
        sendResponse({ success: true })
        break
      default:
        sendResponse({ success: false, error: 'Unknown message type' })
    }
  } catch (error) {
    sendResponse({ success: false, error: (error as Error).message })
  }
}

async function handleAIRequest(data: { action: string; text: string; options?: Record<string, string> }) {
  const result = await chrome.storage.sync.get('settings')
  const settings = result.settings as Settings
  
  if (!settings?.apiKey) throw new Error('请先在设置中配置 API Key')

  const prompts: Record<string, string> = {
    'generate-title': `根据以下文章内容，生成10个高点击率的微信公众号标题：\n\n${data.text}`,
    'rewrite': `润色以下文字，使其更流畅、专业、有吸引力，保持原意：\n\n${data.text}`,
    'expand': `扩写以下文字，增加更多细节和论述：\n\n${data.text}`,
    'summarize': `用2-3句话概括以下文章的核心内容，作为文章摘要：\n\n${data.text}`,
    'title-score': `请对以下微信公众号标题进行专业评分和分析：

标题：${data.text}

请从以下维度评分（每项0-20分，总分100分）：
1. 吸引力（是否能引起读者点击欲望）
2. 清晰度（是否能清楚传达文章主题）
3. 情感共鸣（是否能引起读者情感反应）
4. 长度适中（10-30字为佳）
5. 关键词（是否包含热门/搜索关键词）

请给出总分、各项得分、优点、不足和3个优化建议。`,
    'generate-outline': `根据主题生成详细的文章大纲：\n\n${data.text}`,
    'generate-article': `根据主题撰写1000-1500字的公众号文章：\n\n${data.text}`,
    'outline': `请根据以下主题，生成一个详细的微信公众号文章大纲。要求：
1. 包含引人入胜的开头
2. 3-5个主要章节，每个章节有2-3个要点
3. 有力的结尾和行动号召

主题：${data.text}

请用 Markdown 格式输出大纲。`,
    'continue': `请根据以下文章内容，自然地续写300-500字。要求：
1. 保持与原文一致的风格和语气
2. 内容连贯，逻辑通顺
3. 不要重复已有内容

原文：
${data.text}

请直接输出续写内容，不要加任何说明。`,
    'translate': `${data.text}

请直接输出翻译结果，不要加任何说明或解释。保持原文的格式和段落结构。`,
    'smart-translate': `你是一位精通中英双语的专业翻译官，同时也是一位优秀的语言艺术家。你的翻译风格自然流畅，既忠于原文又不失优雅。

请翻译以下内容：
${data.text}

翻译要求：
1. 如果原文是中文，翻译成地道的英文；如果原文是英文或其他语言，翻译成优美的中文
2. 翻译要自然流畅，避免机翻的生硬感，读起来像是母语者写的
3. 保持原文的语气和风格（正式/轻松/幽默等）
4. 专业术语要准确，必要时可在括号内保留原文
5. 对于习语、俚语、文化特定表达，要进行本地化处理而非直译

请直接输出翻译结果，不要添加任何解释或说明。`,
    'style-rewrite': `${data.text}

请直接输出改写后的内容，不要加任何说明。保持原文的核心意思，但用指定的风格重新表达。`,
    'test': '你好，请简短回复确认连接成功'
  }

  const prompt = prompts[data.action] || data.text
  
  // 获取 AI 提供商配置
  const provider = AI_PROVIDERS[settings.aiProvider] || AI_PROVIDERS.openai
  
  // 确定 Base URL（优先使用自定义配置）
  const baseUrl = settings.customBaseUrl || provider.baseUrl
  if (!baseUrl) throw new Error('请配置 API Base URL')
  
  // 确定模型（优先使用自定义配置）
  const model = settings.customModel || provider.defaultModel
  if (!model) throw new Error('请配置模型名称')
  
  // 构建 API URL
  const apiUrl = `${baseUrl}/chat/completions`

  const response = await fetch(apiUrl, {
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
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `AI 请求失败: ${response.status}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error?.message || errorJson.message || errorMessage
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage)
  }
  
  const result2 = await response.json()
  return result2.choices[0].message.content
}

async function searchImages(data: { query: string; source: string }) {
  const result = await chrome.storage.sync.get('settings')
  const settings = result.settings as Settings
  
  if (data.source === 'unsplash') {
    if (!settings?.unsplashKey) throw new Error('请先配置 Unsplash Access Key')
    const response = await fetch(
      `${IMAGE_APIS.unsplash}?query=${encodeURIComponent(data.query)}&per_page=20`,
      { headers: { 'Authorization': `Client-ID ${settings.unsplashKey}` } }
    )
    if (!response.ok) throw new Error('Unsplash 搜索失败')
    const result2 = await response.json()
    return result2.results.map((img: { id: string; urls: { regular: string; thumb: string }; description?: string; alt_description?: string; user: { name: string } }) => ({
      id: img.id, url: img.urls.regular, thumb: img.urls.thumb,
      description: img.description || img.alt_description, author: img.user.name
    }))
  } else {
    if (!settings?.pixabayKey) throw new Error('请先配置 Pixabay API Key')
    const response = await fetch(
      `${IMAGE_APIS.pixabay}?key=${settings.pixabayKey}&q=${encodeURIComponent(data.query)}&per_page=20`
    )
    if (!response.ok) throw new Error('Pixabay 搜索失败')
    const result2 = await response.json()
    return result2.hits.map((img: { id: number; largeImageURL: string; previewURL: string; tags: string; user: string }) => ({
      id: img.id, url: img.largeImageURL, thumb: img.previewURL,
      description: img.tags, author: img.user
    }))
  }
}

// Tavily 搜索 API
async function tavilySearch(data: { query: string; searchDepth?: string; maxResults?: number }) {
  const result = await chrome.storage.sync.get('settings')
  const settings = result.settings as Settings
  
  console.log('[Tavily] 当前设置:', settings)
  console.log('[Tavily] API Key:', settings?.tavilyKey ? '已配置' : '未配置')
  
  if (!settings?.tavilyKey) {
    throw new Error('请先在设置中配置 Tavily API Key')
  }
  
  const response = await fetch(TAVILY_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: settings.tavilyKey,
      query: data.query,
      search_depth: data.searchDepth || 'basic',
      max_results: data.maxResults || 5,
      include_answer: true,
      include_raw_content: false
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Tavily 搜索失败: ${response.status}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorJson.message || errorMessage
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage)
  }
  
  const searchResult = await response.json()
  
  return {
    answer: searchResult.answer || '',
    results: (searchResult.results || []).map((item: { title: string; url: string; content: string; score: number; published_date?: string }) => ({
      title: item.title,
      url: item.url,
      content: item.content,
      score: item.score,
      publishedDate: item.published_date
    }))
  }
}

// 辅助函数：从 XML 中提取标签内容（使用正则表达式，因为 Service Worker 中没有 DOMParser）
function extractTagContent(xml: string, tagName: string): string {
  // 匹配 <tagName>content</tagName> 或 <tagName><![CDATA[content]]></tagName>
  const regex = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tagName}>`, 'i')
  const match = xml.match(regex)
  if (match) {
    return match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()
  }
  return ''
}

// 辅助函数：从 XML 中提取属性值
function extractAttrValue(xml: string, tagName: string, attrName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']+)["'][^>]*>`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : ''
}

// 辅助函数：提取所有匹配的标签块
function extractAllTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>[\\s\\S]*?</${tagName}>`, 'gi')
  return xml.match(regex) || []
}

// RSS 获取和解析
async function fetchRSSFeed(feedUrl: string, feedName: string): Promise<RSSItem[]> {
  try {
    // 使用 CORS 代理获取 RSS（因为大多数 RSS 源不支持跨域）
    const corsProxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
    ]
    
    let xmlText = ''
    for (const proxyUrl of corsProxies) {
      try {
        const response = await fetch(proxyUrl, { 
          headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, application/json' }
        })
        if (response.ok) {
          xmlText = await response.text()
          break
        }
      } catch {
        continue
      }
    }
    
    if (!xmlText) {
      throw new Error('无法获取 RSS 内容')
    }
    
    const items: RSSItem[] = []
    
    // 检查是否是 JSON 格式（如知乎日报）
    if (xmlText.trim().startsWith('{') || xmlText.trim().startsWith('[')) {
      try {
        const jsonData = JSON.parse(xmlText)
        // 知乎日报格式
        if (jsonData.stories) {
          jsonData.stories.forEach((story: { title: string; url?: string; id?: number }) => {
            items.push({
              title: story.title,
              link: story.url || `https://daily.zhihu.com/story/${story.id}`,
              description: '',
              pubDate: new Date().toISOString(),
              source: feedName
            })
          })
        }
        // 通用 JSON 数组格式
        else if (Array.isArray(jsonData)) {
          jsonData.slice(0, 20).forEach((item: { title?: string; name?: string; link?: string; url?: string; description?: string; summary?: string }) => {
            if (item.title || item.name) {
              items.push({
                title: item.title || item.name || '',
                link: item.link || item.url || '',
                description: item.description || item.summary || '',
                pubDate: new Date().toISOString(),
                source: feedName
              })
            }
          })
        }
        return items.slice(0, 20)
      } catch {
        // 不是有效 JSON，继续尝试 XML 解析
      }
    }
    
    // 尝试解析 RSS 2.0 格式
    const rssItems = extractAllTags(xmlText, 'item')
    if (rssItems.length > 0) {
      rssItems.forEach((itemXml) => {
        const title = extractTagContent(itemXml, 'title')
        const link = extractTagContent(itemXml, 'link')
        const description = extractTagContent(itemXml, 'description')
        const pubDate = extractTagContent(itemXml, 'pubDate')
        
        if (title && link) {
          items.push({
            title: title.replace(/<[^>]*>/g, '').trim(),
            link,
            description: description.replace(/<[^>]*>/g, '').substring(0, 200),
            pubDate,
            source: feedName
          })
        }
      })
    }
    
    // 尝试解析 Atom 格式
    if (items.length === 0) {
      const atomEntries = extractAllTags(xmlText, 'entry')
      atomEntries.forEach((entryXml) => {
        const title = extractTagContent(entryXml, 'title')
        const link = extractAttrValue(entryXml, 'link', 'href') || extractTagContent(entryXml, 'link')
        const summary = extractTagContent(entryXml, 'summary') || extractTagContent(entryXml, 'content')
        const published = extractTagContent(entryXml, 'published') || extractTagContent(entryXml, 'updated')
        
        if (title && link) {
          items.push({
            title: title.replace(/<[^>]*>/g, '').trim(),
            link,
            description: summary.replace(/<[^>]*>/g, '').substring(0, 200),
            pubDate: published,
            source: feedName
          })
        }
      })
    }
    
    return items.slice(0, 20) // 每个源最多返回 20 条
  } catch (error) {
    console.error(`[RSS] 获取 ${feedName} 失败:`, error)
    return []
  }
}

// 获取所有启用的 RSS 源内容
async function fetchAllRSSFeeds(): Promise<RSSItem[]> {
  const result = await chrome.storage.sync.get('settings')
  const settings = result.settings as Settings
  
  if (!settings?.rssFeeds || settings.rssFeeds.length === 0) {
    return []
  }
  
  const enabledFeeds = settings.rssFeeds.filter(f => f.enabled)
  
  // 并行获取所有 RSS 源
  const allItemsArrays = await Promise.all(
    enabledFeeds.map(feed => fetchRSSFeed(feed.url, feed.name))
  )
  
  // 合并并按时间排序
  const allItems = allItemsArrays.flat()
  allItems.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime() || 0
    const dateB = new Date(b.pubDate).getTime() || 0
    return dateB - dateA
  })
  
  return allItems.slice(0, 50) // 最多返回 50 条
}

console.log('智编助手 Background 已启动')
