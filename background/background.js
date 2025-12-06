// 智编助手 - Background Service Worker
// 处理扩展的后台逻辑、消息传递和 API 调用

// 存储配置
const CONFIG = {
  AI_PROVIDERS: {
    openai: 'https://api.openai.com/v1/chat/completions',
    zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  },
  IMAGE_APIS: {
    unsplash: 'https://api.unsplash.com/search/photos',
    pixabay: 'https://pixabay.com/api/'
  }
};

// 初始化扩展
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装，设置默认配置
    chrome.storage.sync.set({
      settings: {
        themeColor: '#07C160', // 微信绿
        aiProvider: 'openai',
        apiKey: '',
        unsplashKey: '',
        pixabayKey: '',
        autoInsertStyle: true,
        showFloatingToolbar: true
      },
      styleHistory: [],
      favorites: []
    });
    
    // 打开欢迎页面
    chrome.tabs.create({
      url: chrome.runtime.getURL('options/options.html?welcome=true')
    });
  }
  
  // 创建右键菜单
  createContextMenus();
});

// 创建右键菜单
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'smartedit-rewrite',
      title: '✨ AI 改写选中文本',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'smartedit-expand',
      title: '📝 AI 扩写选中文本',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'smartedit-summarize',
      title: '📋 AI 缩写选中文本',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'smartedit-collect',
      title: '📥 采集到智编助手',
      contexts: ['page', 'selection']
    });
  });
}

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('smartedit-')) {
    const action = info.menuItemId.replace('smartedit-', '');
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_ACTION',
      action: action,
      text: info.selectionText || ''
    });
  }
});

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // 保持消息通道开启
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'AI_REQUEST':
        const aiResult = await handleAIRequest(message.data);
        sendResponse({ success: true, data: aiResult });
        break;
        
      case 'SEARCH_IMAGES':
        const images = await searchImages(message.data);
        sendResponse({ success: true, data: images });
        break;
        
      case 'GET_SETTINGS':
        const settings = await chrome.storage.sync.get('settings');
        sendResponse({ success: true, data: settings.settings });
        break;
        
      case 'SAVE_SETTINGS':
        await chrome.storage.sync.set({ settings: message.data });
        sendResponse({ success: true });
        break;
        
      case 'SAVE_FAVORITE':
        await saveFavorite(message.data);
        sendResponse({ success: true });
        break;
        
      case 'GET_FAVORITES':
        const favorites = await chrome.storage.sync.get('favorites');
        sendResponse({ success: true, data: favorites.favorites || [] });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// AI 请求处理
async function handleAIRequest(data) {
  const { action, text, options = {} } = data;
  const settings = (await chrome.storage.sync.get('settings')).settings || {};
  
  if (!settings.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }
  
  const prompts = {
    'generate-title': `你是一个专业的微信公众号标题专家。请根据以下文章内容，生成10个高点击率的标题。
要求：
1. 包含情感类标题（引发共鸣）
2. 包含悬念类标题（引发好奇）
3. 包含干货类标题（突出价值）
4. 每个标题控制在30字以内
5. 直接返回标题列表，每行一个

文章内容：
${text}`,

    'rewrite': `请润色以下文字，使其更加流畅、专业，保持原意不变：

${text}`,

    'expand': `请扩写以下文字，增加更多细节和描述，使内容更加丰富：

${text}`,

    'summarize': `请缩写以下文字，保留核心信息，使其更加简洁：

${text}`,

    'change-tone': `请将以下文字改写成${options.tone || '正式'}的语气：

${text}`,

    'generate-outline': `请根据以下主题，生成一篇微信公众号文章的详细大纲：

主题：${text}`,

    'generate-article': `请根据以下主题和要求，撰写一篇微信公众号文章：

主题：${text}
要求：
1. 字数约1000-1500字
2. 语言生动有趣
3. 结构清晰，有小标题
4. 适合公众号阅读`,

    'score-title': `请对以下微信公众号标题进行评分（0-100分），并给出具体的优化建议：

标题：${text}

请按以下格式返回：
评分：XX分
优点：...
缺点：...
优化建议：...
优化后标题：...`
  };
  
  const prompt = prompts[action] || text;
  
  const apiUrl = CONFIG.AI_PROVIDERS[settings.aiProvider] || CONFIG.AI_PROVIDERS.openai;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.aiProvider === 'zhipu' ? 'glm-4' : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一个专业的微信公众号内容创作助手。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI 请求失败: ${response.status}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
}

// 图片搜索
async function searchImages(data) {
  const { query, source = 'unsplash', page = 1, perPage = 20 } = data;
  const settings = (await chrome.storage.sync.get('settings')).settings || {};
  
  if (source === 'unsplash') {
    if (!settings.unsplashKey) {
      throw new Error('请先在设置中配置 Unsplash API Key');
    }
    
    const response = await fetch(
      `${CONFIG.IMAGE_APIS.unsplash}?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Client-ID ${settings.unsplashKey}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Unsplash 搜索失败');
    }
    
    const result = await response.json();
    return result.results.map(img => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.thumb,
      description: img.description || img.alt_description,
      author: img.user.name,
      downloadUrl: img.links.download
    }));
  } else if (source === 'pixabay') {
    if (!settings.pixabayKey) {
      throw new Error('请先在设置中配置 Pixabay API Key');
    }
    
    const response = await fetch(
      `${CONFIG.IMAGE_APIS.pixabay}?key=${settings.pixabayKey}&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&image_type=photo`
    );
    
    if (!response.ok) {
      throw new Error('Pixabay 搜索失败');
    }
    
    const result = await response.json();
    return result.hits.map(img => ({
      id: img.id,
      url: img.largeImageURL,
      thumb: img.previewURL,
      description: img.tags,
      author: img.user,
      downloadUrl: img.largeImageURL
    }));
  }
  
  return [];
}

// 保存收藏
async function saveFavorite(data) {
  const result = await chrome.storage.sync.get('favorites');
  const favorites = result.favorites || [];
  
  favorites.unshift({
    ...data,
    id: Date.now(),
    createdAt: new Date().toISOString()
  });
  
  // 最多保存100个收藏
  if (favorites.length > 100) {
    favorites.pop();
  }
  
  await chrome.storage.sync.set({ favorites });
}

console.log('智编助手 Background Service Worker 已启动');
