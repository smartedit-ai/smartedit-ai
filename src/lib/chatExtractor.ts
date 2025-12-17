/**
 * AI 对话提取工具 - 支持多种 AI 聊天平台
 */

// 支持的聊天平台类型
export type ChatPlatform = 
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'copilot'
  | 'poe'
  | 'perplexity'
  | 'deepseek'
  | 'kimi'
  | 'doubao'
  | 'unknown'

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system'

// 单条消息
export interface ChatMessage {
  role: MessageRole
  content: string
  timestamp?: string
}

// 完整对话
export interface ChatConversation {
  platform: ChatPlatform
  platformName: string
  title: string
  url: string
  messages: ChatMessage[]
  extractedAt: string
}

// 平台配置
interface PlatformConfig {
  name: string
  icon: string
  hostPatterns: string[]
  selectors: {
    container: string
    userMessage: string
    assistantMessage: string
    messageContent: string
    title?: string
  }
}

// 平台配置映射
const platformConfigs: Record<ChatPlatform, PlatformConfig> = {
  chatgpt: {
    name: 'ChatGPT',
    icon: '🤖',
    hostPatterns: ['chat.openai.com', 'chatgpt.com'],
    selectors: {
      container: '[data-testid="conversation-turn"]',
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      messageContent: '.markdown, .whitespace-pre-wrap',
      title: 'title'
    }
  },
  claude: {
    name: 'Claude',
    icon: '🧠',
    hostPatterns: ['claude.ai'],
    selectors: {
      container: '[data-testid="conversation-turn"], .font-claude-message, [class*="ConversationItem"]',
      userMessage: '[data-testid="user-message"], .font-user-message, [class*="human-turn"]',
      assistantMessage: '[data-testid="assistant-message"], .font-claude-message, [class*="claude-turn"]',
      messageContent: '.prose, .whitespace-pre-wrap, [class*="markdown"]',
      title: 'title'
    }
  },
  gemini: {
    name: 'Gemini',
    icon: '✨',
    hostPatterns: ['gemini.google.com', 'bard.google.com'],
    selectors: {
      container: '.conversation-container, [class*="conversation"]',
      userMessage: '[class*="user-query"], [class*="query-content"]',
      assistantMessage: '[class*="model-response"], [class*="response-content"]',
      messageContent: '.markdown-main-panel, [class*="markdown"]',
      title: 'title'
    }
  },
  copilot: {
    name: 'Microsoft Copilot',
    icon: '🔷',
    hostPatterns: ['copilot.microsoft.com', 'bing.com/chat'],
    selectors: {
      container: '[class*="message"]',
      userMessage: '[class*="user-message"]',
      assistantMessage: '[class*="bot-message"]',
      messageContent: '[class*="content"]',
      title: 'title'
    }
  },
  poe: {
    name: 'Poe',
    icon: '💬',
    hostPatterns: ['poe.com'],
    selectors: {
      container: '[class*="Message"]',
      userMessage: '[class*="humanMessage"]',
      assistantMessage: '[class*="botMessage"]',
      messageContent: '[class*="Markdown"]',
      title: 'title'
    }
  },
  perplexity: {
    name: 'Perplexity',
    icon: '🔍',
    hostPatterns: ['perplexity.ai'],
    selectors: {
      container: '[class*="ConversationItem"]',
      userMessage: '[class*="user"]',
      assistantMessage: '[class*="answer"]',
      messageContent: '.prose, [class*="markdown"]',
      title: 'title'
    }
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '🌊',
    hostPatterns: ['chat.deepseek.com'],
    selectors: {
      container: '[class*="message"]',
      userMessage: '[class*="user"]',
      assistantMessage: '[class*="assistant"]',
      messageContent: '.markdown-body, [class*="content"]',
      title: 'title'
    }
  },
  kimi: {
    name: 'Kimi',
    icon: '🌙',
    hostPatterns: ['kimi.moonshot.cn'],
    selectors: {
      container: '[class*="message"]',
      userMessage: '[class*="user"]',
      assistantMessage: '[class*="assistant"]',
      messageContent: '[class*="content"]',
      title: 'title'
    }
  },
  doubao: {
    name: '豆包',
    icon: '🫘',
    hostPatterns: ['doubao.com', 'www.doubao.com'],
    selectors: {
      container: '[class*="message"]',
      userMessage: '[class*="user"]',
      assistantMessage: '[class*="bot"]',
      messageContent: '[class*="content"]',
      title: 'title'
    }
  },
  unknown: {
    name: '未知平台',
    icon: '💭',
    hostPatterns: [],
    selectors: {
      container: '',
      userMessage: '',
      assistantMessage: '',
      messageContent: ''
    }
  }
}

// 检测当前页面的聊天平台
export function detectChatPlatform(): ChatPlatform {
  const hostname = window.location.hostname.toLowerCase()
  
  for (const [platform, config] of Object.entries(platformConfigs)) {
    if (config.hostPatterns.some(pattern => hostname.includes(pattern))) {
      return platform as ChatPlatform
    }
  }
  
  return 'unknown'
}

// 获取平台信息
export function getPlatformInfo(platform: ChatPlatform): { name: string; icon: string } {
  const config = platformConfigs[platform]
  return { name: config.name, icon: config.icon }
}

// 检查是否为支持的聊天平台
export function isSupportedChatPlatform(): boolean {
  return detectChatPlatform() !== 'unknown'
}

// 从 ChatGPT 提取对话
function extractFromChatGPT(): ChatMessage[] {
  const messages: ChatMessage[] = []
  
  // 尝试多种选择器
  const turns = document.querySelectorAll('[data-testid^="conversation-turn"]')
  
  if (turns.length > 0) {
    turns.forEach(turn => {
      const isUser = turn.querySelector('[data-message-author-role="user"]')
      const isAssistant = turn.querySelector('[data-message-author-role="assistant"]')
      const contentEl = turn.querySelector('.markdown, .whitespace-pre-wrap, [class*="prose"]')
      
      if (contentEl) {
        const content = extractTextContent(contentEl as HTMLElement)
        if (content) {
          messages.push({
            role: isUser ? 'user' : (isAssistant ? 'assistant' : 'assistant'),
            content
          })
        }
      }
    })
  } else {
    // 备用选择器
    const allMessages = document.querySelectorAll('[class*="text-message"], [class*="agent-turn"], [class*="user-turn"]')
    allMessages.forEach(msg => {
      const isUser = msg.classList.toString().includes('user') || 
                     msg.querySelector('[class*="user"]') !== null
      const content = extractTextContent(msg as HTMLElement)
      if (content) {
        messages.push({
          role: isUser ? 'user' : 'assistant',
          content
        })
      }
    })
  }
  
  return messages
}

// 从 Claude 提取对话
function extractFromClaude(): ChatMessage[] {
  const messages: ChatMessage[] = []
  
  // Claude 的消息容器
  const containers = document.querySelectorAll('[class*="font-claude"], [class*="ConversationItem"], [class*="message-row"]')
  
  if (containers.length === 0) {
    // 尝试其他选择器
    const allDivs = document.querySelectorAll('div[class*="prose"], div[class*="whitespace"]')
    let isUser = true
    allDivs.forEach(div => {
      const content = extractTextContent(div as HTMLElement)
      if (content && content.length > 10) {
        messages.push({
          role: isUser ? 'user' : 'assistant',
          content
        })
        isUser = !isUser
      }
    })
  } else {
    containers.forEach(container => {
      const classList = container.className.toLowerCase()
      const isHuman = classList.includes('human') || classList.includes('user')
      const content = extractTextContent(container as HTMLElement)
      
      if (content) {
        messages.push({
          role: isHuman ? 'user' : 'assistant',
          content
        })
      }
    })
  }
  
  return messages
}

// 通用提取方法
function extractGeneric(): ChatMessage[] {
  const messages: ChatMessage[] = []
  
  // 尝试常见的消息选择器
  const selectors = [
    '[class*="message"]',
    '[class*="chat-item"]',
    '[class*="conversation"]',
    '[role="article"]',
    '[class*="turn"]'
  ]
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector)
    if (elements.length >= 2) {
      elements.forEach((el, index) => {
        const content = extractTextContent(el as HTMLElement)
        if (content && content.length > 5) {
          // 简单的奇偶判断
          messages.push({
            role: index % 2 === 0 ? 'user' : 'assistant',
            content
          })
        }
      })
      if (messages.length > 0) break
    }
  }
  
  return messages
}

// 提取元素的文本内容（保留格式）
function extractTextContent(element: HTMLElement): string {
  // 克隆元素以避免修改原始 DOM
  const clone = element.cloneNode(true) as HTMLElement
  
  // 移除不需要的元素
  clone.querySelectorAll('button, [class*="copy"], [class*="action"], svg, [aria-hidden="true"]').forEach(el => el.remove())
  
  // 处理代码块
  clone.querySelectorAll('pre, code').forEach(codeEl => {
    const lang = codeEl.getAttribute('class')?.match(/language-(\w+)/)?.[1] || ''
    const codeText = codeEl.textContent || ''
    if (codeEl.tagName === 'PRE') {
      codeEl.textContent = `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`
    }
  })
  
  // 处理列表
  clone.querySelectorAll('li').forEach(li => {
    li.textContent = `• ${li.textContent}`
  })
  
  // 获取文本
  let text = clone.innerText || clone.textContent || ''
  
  // 清理多余空白
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  
  return text
}

// 提取对话的主入口
export function extractConversation(): ChatConversation | null {
  const platform = detectChatPlatform()
  const { name: platformName } = getPlatformInfo(platform)
  
  let messages: ChatMessage[] = []
  
  switch (platform) {
    case 'chatgpt':
      messages = extractFromChatGPT()
      break
    case 'claude':
      messages = extractFromClaude()
      break
    default:
      messages = extractGeneric()
  }
  
  if (messages.length === 0) {
    return null
  }
  
  // 获取标题
  let title = document.title || '未命名对话'
  // 清理标题
  title = title.replace(/\s*[-|]\s*(ChatGPT|Claude|Gemini|Copilot|Poe|Perplexity).*$/i, '').trim()
  if (!title || title.length < 2) {
    title = `${platformName} 对话 - ${new Date().toLocaleDateString('zh-CN')}`
  }
  
  return {
    platform,
    platformName,
    title,
    url: window.location.href,
    messages,
    extractedAt: new Date().toISOString()
  }
}

// 格式化对话为 Markdown
export function formatConversationAsMarkdown(conversation: ChatConversation): string {
  const { platformName, title, url, messages, extractedAt } = conversation
  const date = new Date(extractedAt)
  
  let markdown = `---
title: "${title.replace(/"/g, '\\"')}"
platform: "${platformName}"
url: "${url}"
saved: "${extractedAt}"
messages: ${messages.length}
type: ai-conversation
---

# ${title}

> 📅 保存时间: ${date.toLocaleString('zh-CN')}
> 🤖 平台: ${platformName}
> 💬 消息数: ${messages.length}
> 🔗 原始链接: [打开对话](${url})

---

`

  messages.forEach((msg, index) => {
    const roleIcon = msg.role === 'user' ? '👤' : '🤖'
    const roleName = msg.role === 'user' ? 'User' : 'Assistant'
    
    markdown += `## ${roleIcon} ${roleName}\n\n`
    markdown += `${msg.content}\n\n`
    
    if (index < messages.length - 1) {
      markdown += `---\n\n`
    }
  })
  
  return markdown
}

// 生成保存路径
export function generateSavePath(conversation: ChatConversation, basePath: string): string {
  const date = new Date(conversation.extractedAt)
  const dateStr = date.toISOString().slice(0, 10)
  
  // 清理标题作为文件名
  let fileName = conversation.title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50)
  
  if (!fileName) {
    fileName = `${conversation.platformName}-${dateStr}`
  }
  
  const folder = basePath || 'AI对话'
  return `${folder}/${conversation.platformName}/${dateStr}-${fileName}`
}

// 获取支持的平台列表
export function getSupportedPlatforms(): Array<{ platform: ChatPlatform; name: string; icon: string; url: string }> {
  return [
    { platform: 'chatgpt', name: 'ChatGPT', icon: '🤖', url: 'https://chat.openai.com' },
    { platform: 'claude', name: 'Claude', icon: '🧠', url: 'https://claude.ai' },
    { platform: 'gemini', name: 'Gemini', icon: '✨', url: 'https://gemini.google.com' },
    { platform: 'copilot', name: 'Microsoft Copilot', icon: '🔷', url: 'https://copilot.microsoft.com' },
    { platform: 'poe', name: 'Poe', icon: '💬', url: 'https://poe.com' },
    { platform: 'perplexity', name: 'Perplexity', icon: '🔍', url: 'https://perplexity.ai' },
    { platform: 'deepseek', name: 'DeepSeek', icon: '🌊', url: 'https://chat.deepseek.com' },
    { platform: 'kimi', name: 'Kimi', icon: '🌙', url: 'https://kimi.moonshot.cn' },
    { platform: 'doubao', name: '豆包', icon: '🫘', url: 'https://www.doubao.com' }
  ]
}
