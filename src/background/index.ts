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

interface Settings {
  themeColor: string
  aiProvider: string
  apiKey: string
  customBaseUrl: string
  customModel: string
  unsplashKey: string
  pixabayKey: string
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
    chrome.contextMenus.create({ id: 'smartedit-rewrite', title: '✨ AI 改写', contexts: ['selection'] })
    chrome.contextMenus.create({ id: 'smartedit-expand', title: '📝 AI 扩写', contexts: ['selection'] })
    chrome.contextMenus.create({ id: 'smartedit-summarize', title: '📋 AI 缩写', contexts: ['selection'] })
  })
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.toString().startsWith('smartedit-') && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_ACTION',
      action: info.menuItemId.toString().replace('smartedit-', ''),
      text: info.selectionText || ''
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
    'rewrite': `润色以下文字，使其更流畅专业：\n\n${data.text}`,
    'expand': `扩写以下文字，增加更多细节：\n\n${data.text}`,
    'summarize': `缩写以下文字，保留核心信息：\n\n${data.text}`,
    'score-title': `对以下标题进行0-100分评分并给出优化建议：\n\n${data.text}`,
    'generate-outline': `根据主题生成文章大纲：\n\n${data.text}`,
    'generate-article': `根据主题撰写1000-1500字的公众号文章：\n\n${data.text}`,
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
    if (!settings?.unsplashKey) throw new Error('请先配置 Unsplash API Key')
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

console.log('智编助手 Background 已启动')
