/**
 * X.com (Twitter) 推文监控工具
 * 自动浏览推文并根据设定主题生成总结
 */

export interface XMonitorConfig {
  enabled: boolean
  topics: TopicConfig[]
  refreshInterval: number // 分钟
  maxTweetsPerScan: number
  autoSaveToObsidian: boolean
  obsidianPath: string
}

export interface TopicConfig {
  id: string
  name: string
  keywords: string[]
  enabled: boolean
  lastScan?: string
}

export interface Tweet {
  id: string
  author: string
  authorHandle: string
  authorAvatar?: string
  content: string
  timestamp: string
  likes: number
  retweets: number
  replies: number
  url: string
  images?: string[]
  isRetweet?: boolean
  quotedTweet?: Tweet
}

export interface ScanResult {
  topic: TopicConfig
  tweets: Tweet[]
  matchedCount: number
  scanTime: string
  summary?: string
}

export const defaultXMonitorConfig: XMonitorConfig = {
  enabled: false,
  topics: [
    {
      id: '1',
      name: 'AI 技术动态',
      keywords: ['AI', 'GPT', 'LLM', 'Claude', 'OpenAI', 'Anthropic', 'machine learning', '人工智能'],
      enabled: true
    },
    {
      id: '2', 
      name: '前端开发',
      keywords: ['React', 'Vue', 'TypeScript', 'JavaScript', 'CSS', 'frontend', '前端'],
      enabled: false
    },
    {
      id: '3',
      name: '创业投资',
      keywords: ['startup', 'VC', 'funding', 'YC', 'a]创业', '融资', '投资'],
      enabled: false
    }
  ],
  refreshInterval: 30,
  maxTweetsPerScan: 50,
  autoSaveToObsidian: true,
  obsidianPath: 'X动态'
}

/**
 * 从当前 X.com 页面提取推文
 */
export function extractTweetsFromPage(): Tweet[] {
  const tweets: Tweet[] = []
  
  // X.com 的推文容器选择器
  const tweetSelectors = [
    '[data-testid="tweet"]',
    'article[role="article"]',
    '[data-testid="cellInnerDiv"] article'
  ]
  
  let tweetElements: Element[] = []
  for (const selector of tweetSelectors) {
    const elements = document.querySelectorAll(selector)
    if (elements.length > 0) {
      tweetElements = Array.from(elements)
      break
    }
  }
  
  console.log(`找到 ${tweetElements.length} 条推文元素`)
  
  tweetElements.forEach((element, index) => {
    try {
      const tweet = parseTweetElement(element)
      if (tweet && tweet.content) {
        tweets.push(tweet)
      }
    } catch (err) {
      console.error(`解析推文 ${index} 失败:`, err)
    }
  })
  
  return tweets
}

/**
 * 解析单个推文元素
 */
function parseTweetElement(element: Element): Tweet | null {
  // 获取作者信息
  const authorElement = element.querySelector('[data-testid="User-Name"]')
  const authorNameEl = authorElement?.querySelector('span')
  const authorHandleEl = authorElement?.querySelectorAll('span')[1] || 
                         element.querySelector('a[href^="/"]')
  
  const author = authorNameEl?.textContent?.trim() || '未知用户'
  let authorHandle = ''
  
  // 尝试从链接获取 handle
  const profileLink = element.querySelector('a[href^="/"][role="link"]')
  if (profileLink) {
    const href = profileLink.getAttribute('href')
    if (href && !href.includes('/status/')) {
      authorHandle = href.replace('/', '')
    }
  }
  if (!authorHandle && authorHandleEl) {
    authorHandle = authorHandleEl.textContent?.trim() || ''
  }
  
  // 获取推文内容
  const contentElement = element.querySelector('[data-testid="tweetText"]')
  const content = contentElement?.textContent?.trim() || ''
  
  if (!content) return null
  
  // 获取时间
  const timeElement = element.querySelector('time')
  const timestamp = timeElement?.getAttribute('datetime') || new Date().toISOString()
  
  // 获取互动数据
  const getLikeCount = () => {
    const likeBtn = element.querySelector('[data-testid="like"]')
    const count = likeBtn?.querySelector('span')?.textContent
    return parseCount(count)
  }
  
  const getRetweetCount = () => {
    const rtBtn = element.querySelector('[data-testid="retweet"]')
    const count = rtBtn?.querySelector('span')?.textContent
    return parseCount(count)
  }
  
  const getReplyCount = () => {
    const replyBtn = element.querySelector('[data-testid="reply"]')
    const count = replyBtn?.querySelector('span')?.textContent
    return parseCount(count)
  }
  
  // 获取推文链接
  const tweetLink = element.querySelector('a[href*="/status/"]')
  const tweetUrl = tweetLink?.getAttribute('href') || ''
  const fullUrl = tweetUrl ? `https://x.com${tweetUrl}` : ''
  
  // 提取推文 ID
  const idMatch = tweetUrl.match(/\/status\/(\d+)/)
  const id = idMatch ? idMatch[1] : `tweet-${Date.now()}-${Math.random().toString(36).slice(2)}`
  
  // 获取图片
  const images: string[] = []
  element.querySelectorAll('[data-testid="tweetPhoto"] img').forEach(img => {
    const src = img.getAttribute('src')
    if (src && !src.includes('profile_images')) {
      images.push(src)
    }
  })
  
  // 检查是否是转推
  const isRetweet = !!element.querySelector('[data-testid="socialContext"]')?.textContent?.includes('转推')
  
  return {
    id,
    author,
    authorHandle,
    content,
    timestamp,
    likes: getLikeCount(),
    retweets: getRetweetCount(),
    replies: getReplyCount(),
    url: fullUrl,
    images: images.length > 0 ? images : undefined,
    isRetweet
  }
}

/**
 * 解析数字（支持 K, M 等缩写）
 */
function parseCount(text?: string | null): number {
  if (!text) return 0
  const cleaned = text.trim().toLowerCase()
  if (cleaned.includes('k')) {
    return Math.round(parseFloat(cleaned) * 1000)
  }
  if (cleaned.includes('m')) {
    return Math.round(parseFloat(cleaned) * 1000000)
  }
  return parseInt(cleaned) || 0
}

/**
 * 根据关键词过滤推文
 */
export function filterTweetsByKeywords(tweets: Tweet[], keywords: string[]): Tweet[] {
  if (!keywords || keywords.length === 0) return tweets
  
  const lowerKeywords = keywords.map(k => k.toLowerCase())
  
  return tweets.filter(tweet => {
    const content = tweet.content.toLowerCase()
    return lowerKeywords.some(keyword => content.includes(keyword))
  })
}

/**
 * 生成推文总结的 prompt
 */
export function generateSummaryPrompt(topic: TopicConfig, tweets: Tweet[]): string {
  const tweetTexts = tweets.slice(0, 20).map((t, i) => 
    `${i + 1}. @${t.authorHandle}: ${t.content.slice(0, 300)}${t.content.length > 300 ? '...' : ''}`
  ).join('\n\n')
  
  return `你是一个专业的信息分析师。请分析以下关于「${topic.name}」主题的推文，生成一份简洁的中文总结报告。

## 关注的关键词
${topic.keywords.join(', ')}

## 推文内容
${tweetTexts}

## 要求
1. 提取 3-5 个最重要的信息点或趋势
2. 每个要点用 1-2 句话概括
3. 如果有重要的新闻或公告，请特别标注
4. 使用 Markdown 格式输出
5. 总结要简洁有力，突出重点

请生成总结报告：`
}

/**
 * 格式化扫描结果为 Obsidian 笔记
 */
export function formatScanResultAsNote(result: ScanResult): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toISOString().slice(11, 19)
  
  let note = `---
title: "${result.topic.name} - ${dateStr}"
type: x-monitor
topic: "${result.topic.name}"
keywords: [${result.topic.keywords.map(k => `"${k}"`).join(', ')}]
scanned: "${now.toISOString()}"
matched: ${result.matchedCount}
total: ${result.tweets.length}
tags:
  - x-monitor
  - ${result.topic.name.replace(/\s+/g, '-')}
---

# ${result.topic.name} - X 动态总结

> 📅 扫描时间: ${dateStr} ${timeStr}
> 🔍 匹配推文: ${result.matchedCount} 条
> 📊 关键词: ${result.topic.keywords.join(', ')}

`

  // 添加 AI 总结
  if (result.summary) {
    note += `## 📝 AI 总结

${result.summary}

---

`
  }

  // 添加精选推文
  note += `## 🐦 精选推文

`

  const topTweets = result.tweets
    .sort((a, b) => (b.likes + b.retweets * 2) - (a.likes + a.retweets * 2))
    .slice(0, 10)

  topTweets.forEach((tweet, index) => {
    note += `### ${index + 1}. @${tweet.authorHandle}

> ${tweet.content.replace(/\n/g, '\n> ')}

- 👍 ${tweet.likes} | 🔄 ${tweet.retweets} | 💬 ${tweet.replies}
- 🔗 [查看原文](${tweet.url})
- ⏰ ${new Date(tweet.timestamp).toLocaleString('zh-CN')}

`
  })

  note += `---

*由 [智编助手](https://github.com/example/smartedit) X 监控功能自动生成*
`

  return note
}

/**
 * 自动滚动页面加载更多推文
 */
export async function autoScrollToLoadTweets(
  maxScrolls: number = 5,
  scrollDelay: number = 2000
): Promise<void> {
  for (let i = 0; i < maxScrolls; i++) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    })
    await new Promise(resolve => setTimeout(resolve, scrollDelay))
  }
  // 滚动回顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 检查当前页面是否是 X.com
 */
export function isXPage(): boolean {
  const hostname = window.location.hostname
  return hostname === 'x.com' || hostname === 'twitter.com' || hostname.endsWith('.x.com')
}

/**
 * 获取当前 X.com 页面类型
 */
export function getXPageType(): 'home' | 'profile' | 'search' | 'tweet' | 'list' | 'unknown' {
  const path = window.location.pathname
  
  if (path === '/' || path === '/home') return 'home'
  if (path.startsWith('/search')) return 'search'
  if (path.includes('/status/')) return 'tweet'
  if (path.includes('/lists/')) return 'list'
  if (path.match(/^\/[a-zA-Z0-9_]+$/)) return 'profile'
  
  return 'unknown'
}
