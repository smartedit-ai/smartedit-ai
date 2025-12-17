/**
 * 信息聚合模块 - 支持多种信息源的监控和聚合
 */

// 信息源类型
export type SourceType = 
  | 'x' 
  | 'reddit' 
  | 'hackernews' 
  | 'producthunt'
  | 'claude'
  | 'openai'
  | 'google'
  | 'grok'
  | 'meta'

// 信息源配置
export interface SourceConfig {
  id: string
  type: SourceType
  name: string
  icon: string
  enabled: boolean
  url: string
  description: string
  // 定时扫描间隔（分钟），0 表示不自动扫描
  scanInterval: number
  // 上次扫描时间
  lastScanTime?: string
  // 自定义关键词过滤
  keywords: string[]
}

// 主题配置（用于跨源过滤）
export interface TopicConfig {
  id: string
  name: string
  keywords: string[]
  enabled: boolean
}

// 聚合配置
export interface AggregatorConfig {
  // 信息源列表
  sources: SourceConfig[]
  // 主题列表
  topics: TopicConfig[]
  // 全局设置
  autoSaveToObsidian: boolean
  obsidianPath: string
  maxItemsPerScan: number
  // 是否启用后台定时扫描
  backgroundScanEnabled: boolean
}

// 聚合内容项
export interface AggregatedItem {
  id: string
  sourceType: SourceType
  sourceName: string
  title: string
  content: string
  url: string
  author?: string
  timestamp?: string
  score?: number
  comments?: number
  tags?: string[]
  imageUrl?: string
}

// 扫描结果
export interface ScanResult {
  sourceType: SourceType
  sourceName: string
  topic?: TopicConfig
  items: AggregatedItem[]
  matchedCount: number
  scanTime: string
  summary?: string
}

// 默认信息源配置
export const defaultSources: SourceConfig[] = [
  {
    id: 'x-default',
    type: 'x',
    name: 'X (Twitter)',
    icon: '🐦',
    enabled: true,
    url: 'https://x.com',
    description: '实时社交动态和热点讨论',
    scanInterval: 30,
    keywords: []
  },
  {
    id: 'reddit-default',
    type: 'reddit',
    name: 'Reddit',
    icon: '🔴',
    enabled: true,
    url: 'https://www.reddit.com',
    description: '全球最大的社区论坛',
    scanInterval: 60,
    keywords: []
  },
  {
    id: 'hackernews-default',
    type: 'hackernews',
    name: 'Hacker News',
    icon: '🟠',
    enabled: true,
    url: 'https://news.ycombinator.com',
    description: 'YC 创业和技术新闻',
    scanInterval: 60,
    keywords: []
  },
  {
    id: 'producthunt-default',
    type: 'producthunt',
    name: 'Product Hunt',
    icon: '🐱',
    enabled: true,
    url: 'https://www.producthunt.com',
    description: '最新产品发布和创新',
    scanInterval: 120,
    keywords: []
  },
  {
    id: 'claude-default',
    type: 'claude',
    name: 'Anthropic (Claude)',
    icon: '🤖',
    enabled: true,
    url: 'https://www.anthropic.com/news',
    description: 'Claude AI 官方动态',
    scanInterval: 240,
    keywords: []
  },
  {
    id: 'openai-default',
    type: 'openai',
    name: 'OpenAI',
    icon: '🧠',
    enabled: true,
    url: 'https://openai.com/blog',
    description: 'OpenAI 官方博客和更新',
    scanInterval: 240,
    keywords: []
  },
  {
    id: 'google-default',
    type: 'google',
    name: 'Google AI',
    icon: '🔵',
    enabled: true,
    url: 'https://blog.google/technology/ai/',
    description: 'Google AI 技术博客',
    scanInterval: 240,
    keywords: []
  },
  {
    id: 'grok-default',
    type: 'grok',
    name: 'xAI (Grok)',
    icon: '⚡',
    enabled: false,
    url: 'https://x.ai',
    description: 'xAI Grok 官方动态',
    scanInterval: 240,
    keywords: []
  },
  {
    id: 'meta-default',
    type: 'meta',
    name: 'Meta AI',
    icon: '♾️',
    enabled: true,
    url: 'https://ai.meta.com/blog/',
    description: 'Meta AI 研究和产品',
    scanInterval: 240,
    keywords: []
  }
]

// 默认主题配置
export const defaultTopics: TopicConfig[] = [
  {
    id: 'topic-ai',
    name: 'AI/人工智能',
    keywords: ['AI', 'GPT', 'LLM', 'Claude', 'OpenAI', 'Anthropic', 'ChatGPT', '人工智能', '大模型', 'AGI', 'Machine Learning', 'Deep Learning'],
    enabled: true
  },
  {
    id: 'topic-dev',
    name: '软件开发',
    keywords: ['React', 'Vue', 'TypeScript', 'Rust', 'Go', 'Python', 'JavaScript', 'Node.js', 'Next.js', 'GitHub', '开源'],
    enabled: true
  },
  {
    id: 'topic-startup',
    name: '创业投资',
    keywords: ['startup', 'VC', 'funding', 'YC', 'Series A', '创业', '融资', '投资', '独角兽', 'seed round'],
    enabled: false
  },
  {
    id: 'topic-product',
    name: '产品设计',
    keywords: ['Product', 'UX', 'UI', 'Design', 'Figma', '产品', '设计', '用户体验', 'prototype'],
    enabled: false
  }
]

// 默认聚合配置
export const defaultAggregatorConfig: AggregatorConfig = {
  sources: defaultSources,
  topics: defaultTopics,
  autoSaveToObsidian: true,
  obsidianPath: 'InfoAggregator',
  maxItemsPerScan: 50,
  backgroundScanEnabled: false
}

// 检测当前页面是否为支持的信息源
export function detectCurrentSource(): SourceType | null {
  const hostname = window.location.hostname.toLowerCase()
  
  if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
    return 'x'
  }
  if (hostname.includes('reddit.com')) {
    return 'reddit'
  }
  if (hostname.includes('news.ycombinator.com')) {
    return 'hackernews'
  }
  if (hostname.includes('producthunt.com')) {
    return 'producthunt'
  }
  if (hostname.includes('anthropic.com')) {
    return 'claude'
  }
  if (hostname.includes('openai.com')) {
    return 'openai'
  }
  if (hostname.includes('blog.google') || hostname.includes('ai.google')) {
    return 'google'
  }
  if (hostname.includes('x.ai')) {
    return 'grok'
  }
  if (hostname.includes('ai.meta.com') || hostname.includes('ai.facebook.com')) {
    return 'meta'
  }
  
  return null
}

// 获取信息源名称
export function getSourceName(type: SourceType): string {
  const names: Record<SourceType, string> = {
    x: 'X (Twitter)',
    reddit: 'Reddit',
    hackernews: 'Hacker News',
    producthunt: 'Product Hunt',
    claude: 'Anthropic (Claude)',
    openai: 'OpenAI',
    google: 'Google AI',
    grok: 'xAI (Grok)',
    meta: 'Meta AI'
  }
  return names[type]
}

// 获取信息源图标
export function getSourceIcon(type: SourceType): string {
  const icons: Record<SourceType, string> = {
    x: '🐦',
    reddit: '🔴',
    hackernews: '🟠',
    producthunt: '🐱',
    claude: '🤖',
    openai: '🧠',
    google: '🔵',
    grok: '⚡',
    meta: '♾️'
  }
  return icons[type]
}

// 从 X.com 提取内容
export function extractFromX(): AggregatedItem[] {
  const items: AggregatedItem[] = []
  const tweetElements = document.querySelectorAll('[data-testid="tweet"]')
  
  tweetElements.forEach((tweet, index) => {
    try {
      const authorElement = tweet.querySelector('[data-testid="User-Name"]')
      const contentElement = tweet.querySelector('[data-testid="tweetText"]')
      const linkElement = tweet.querySelector('a[href*="/status/"]') as HTMLAnchorElement
      const timeElement = tweet.querySelector('time')
      
      const author = authorElement?.textContent?.split('@')[0]?.trim() || '未知用户'
      const content = contentElement?.textContent || ''
      const url = linkElement?.href || window.location.href
      const timestamp = timeElement?.getAttribute('datetime') || ''
      
      if (content) {
        items.push({
          id: `x-${Date.now()}-${index}`,
          sourceType: 'x',
          sourceName: 'X (Twitter)',
          title: `@${author}`,
          content,
          url,
          author,
          timestamp
        })
      }
    } catch (e) {
      console.error('解析推文失败:', e)
    }
  })
  
  return items
}

// 从 Reddit 提取内容
export function extractFromReddit(): AggregatedItem[] {
  const items: AggregatedItem[] = []
  
  // 新版 Reddit
  const posts = document.querySelectorAll('[data-testid="post-container"], shreddit-post')
  
  posts.forEach((post, index) => {
    try {
      const titleElement = post.querySelector('a[data-click-id="body"], [slot="title"]') as HTMLAnchorElement
      const authorElement = post.querySelector('[data-testid="post_author_link"], [slot="authorName"]')
      const scoreElement = post.querySelector('[data-click-id="upvote"]')?.parentElement
      const commentsElement = post.querySelector('a[data-click-id="comments"]')
      
      const title = titleElement?.textContent?.trim() || ''
      const url = titleElement?.href || window.location.href
      const author = authorElement?.textContent?.replace('u/', '') || ''
      const score = parseInt(scoreElement?.textContent || '0') || 0
      const comments = parseInt(commentsElement?.textContent?.match(/\d+/)?.[0] || '0') || 0
      
      if (title) {
        items.push({
          id: `reddit-${Date.now()}-${index}`,
          sourceType: 'reddit',
          sourceName: 'Reddit',
          title,
          content: title,
          url,
          author,
          score,
          comments
        })
      }
    } catch (e) {
      console.error('解析 Reddit 帖子失败:', e)
    }
  })
  
  return items
}

// 从 Hacker News 提取内容
export function extractFromHackerNews(): AggregatedItem[] {
  const items: AggregatedItem[] = []
  const rows = document.querySelectorAll('.athing')
  
  rows.forEach((row, index) => {
    try {
      const titleElement = row.querySelector('.titleline > a') as HTMLAnchorElement
      const subtextRow = row.nextElementSibling
      const scoreElement = subtextRow?.querySelector('.score')
      const authorElement = subtextRow?.querySelector('.hnuser')
      const commentsElement = subtextRow?.querySelector('a[href*="item?id="]')
      
      const title = titleElement?.textContent?.trim() || ''
      const url = titleElement?.href || ''
      const score = parseInt(scoreElement?.textContent || '0') || 0
      const author = authorElement?.textContent || ''
      const commentsText = commentsElement?.textContent || '0'
      const comments = parseInt(commentsText.match(/\d+/)?.[0] || '0') || 0
      
      if (title && url) {
        items.push({
          id: `hn-${Date.now()}-${index}`,
          sourceType: 'hackernews',
          sourceName: 'Hacker News',
          title,
          content: title,
          url,
          author,
          score,
          comments
        })
      }
    } catch (e) {
      console.error('解析 HN 帖子失败:', e)
    }
  })
  
  return items
}

// 从 Product Hunt 提取内容
export function extractFromProductHunt(): AggregatedItem[] {
  const items: AggregatedItem[] = []
  const posts = document.querySelectorAll('[data-test="post-item"], [class*="styles_item"]')
  
  posts.forEach((post, index) => {
    try {
      const titleElement = post.querySelector('a[href*="/posts/"]') as HTMLAnchorElement
      const descElement = post.querySelector('[class*="tagline"], [class*="description"]')
      const voteElement = post.querySelector('[class*="vote"], button[data-test="vote-button"]')
      
      const title = titleElement?.textContent?.trim() || ''
      const url = titleElement?.href || ''
      const content = descElement?.textContent?.trim() || title
      const score = parseInt(voteElement?.textContent?.match(/\d+/)?.[0] || '0') || 0
      
      if (title && url) {
        items.push({
          id: `ph-${Date.now()}-${index}`,
          sourceType: 'producthunt',
          sourceName: 'Product Hunt',
          title,
          content,
          url,
          score
        })
      }
    } catch (e) {
      console.error('解析 PH 帖子失败:', e)
    }
  })
  
  return items
}

// 从 AI 厂商博客提取内容（通用）
export function extractFromBlog(sourceType: SourceType): AggregatedItem[] {
  const items: AggregatedItem[] = []
  
  // 通用博客文章选择器
  const selectors = [
    'article',
    '[class*="post"]',
    '[class*="article"]',
    '[class*="blog"]',
    '[class*="card"]'
  ]
  
  for (const selector of selectors) {
    const articles = document.querySelectorAll(selector)
    if (articles.length > 0) {
      articles.forEach((article, index) => {
        try {
          const titleElement = article.querySelector('h1, h2, h3, [class*="title"]') as HTMLElement
          const linkElement = article.querySelector('a[href]') as HTMLAnchorElement
          const descElement = article.querySelector('p, [class*="description"], [class*="excerpt"]')
          const dateElement = article.querySelector('time, [class*="date"]')
          
          const title = titleElement?.textContent?.trim() || ''
          const url = linkElement?.href || ''
          const content = descElement?.textContent?.trim() || title
          const timestamp = dateElement?.getAttribute('datetime') || dateElement?.textContent || ''
          
          if (title && url && !items.some(i => i.url === url)) {
            items.push({
              id: `${sourceType}-${Date.now()}-${index}`,
              sourceType,
              sourceName: getSourceName(sourceType),
              title,
              content,
              url,
              timestamp
            })
          }
        } catch (e) {
          console.error(`解析 ${sourceType} 文章失败:`, e)
        }
      })
      break
    }
  }
  
  return items
}

// 根据信息源类型提取内容
export function extractFromSource(sourceType: SourceType): AggregatedItem[] {
  switch (sourceType) {
    case 'x':
      return extractFromX()
    case 'reddit':
      return extractFromReddit()
    case 'hackernews':
      return extractFromHackerNews()
    case 'producthunt':
      return extractFromProductHunt()
    case 'claude':
    case 'openai':
    case 'google':
    case 'grok':
    case 'meta':
      return extractFromBlog(sourceType)
    default:
      return []
  }
}

// 根据关键词过滤内容
export function filterByKeywords(items: AggregatedItem[], keywords: string[]): AggregatedItem[] {
  if (keywords.length === 0) return items
  
  const lowerKeywords = keywords.map(k => k.toLowerCase())
  
  return items.filter(item => {
    const text = `${item.title} ${item.content}`.toLowerCase()
    return lowerKeywords.some(kw => text.includes(kw))
  })
}

// 生成 AI 总结提示词
export function generateSummaryPrompt(items: AggregatedItem[], topic?: TopicConfig): string {
  const itemsText = items.slice(0, 20).map((item, i) => 
    `${i + 1}. [${item.sourceName}] ${item.title}\n   ${item.content.slice(0, 200)}${item.content.length > 200 ? '...' : ''}`
  ).join('\n\n')
  
  const topicInfo = topic ? `主题：${topic.name}\n关键词：${topic.keywords.join(', ')}\n\n` : ''
  
  return `请分析以下来自多个信息源的内容，生成一份简洁的中文总结报告：

${topicInfo}内容列表：
${itemsText}

请按以下格式输出：
1. **核心要点**：3-5 个最重要的信息点
2. **趋势分析**：当前讨论的主要趋势
3. **值得关注**：推荐深入了解的内容

要求：
- 使用中文
- 简洁明了
- 突出重点
- 标注信息来源`
}

// 格式化为 Obsidian 笔记
export function formatAsObsidianNote(
  items: AggregatedItem[], 
  summary: string,
  topic?: TopicConfig
): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toLocaleString('zh-CN')
  
  const title = topic 
    ? `${topic.name} - 信息聚合 ${dateStr}`
    : `信息聚合 ${dateStr}`
  
  const sources = [...new Set(items.map(i => i.sourceName))]
  
  let content = `---
title: "${title}"
type: info-aggregator
date: "${now.toISOString()}"
sources: [${sources.map(s => `"${s}"`).join(', ')}]
${topic ? `topic: "${topic.name}"\nkeywords: [${topic.keywords.map(k => `"${k}"`).join(', ')}]` : ''}
items: ${items.length}
---

# ${title}

> 📅 生成时间: ${timeStr}
> 📊 信息源: ${sources.join(', ')}
> 📝 内容数量: ${items.length} 条

## 📋 AI 总结

${summary || '暂无总结'}

## 🔗 内容列表

`

  // 按来源分组
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.sourceName]) {
      acc[item.sourceName] = []
    }
    acc[item.sourceName].push(item)
    return acc
  }, {} as Record<string, AggregatedItem[]>)
  
  for (const [source, sourceItems] of Object.entries(groupedItems)) {
    content += `### ${getSourceIcon(sourceItems[0].sourceType)} ${source}\n\n`
    
    sourceItems.slice(0, 10).forEach((item, i) => {
      content += `${i + 1}. **[${item.title}](${item.url})**\n`
      if (item.content !== item.title) {
        content += `   ${item.content.slice(0, 150)}${item.content.length > 150 ? '...' : ''}\n`
      }
      if (item.score !== undefined || item.comments !== undefined) {
        const meta = []
        if (item.score !== undefined) meta.push(`👍 ${item.score}`)
        if (item.comments !== undefined) meta.push(`💬 ${item.comments}`)
        if (item.author) meta.push(`👤 ${item.author}`)
        content += `   *${meta.join(' | ')}*\n`
      }
      content += '\n'
    })
  }
  
  return content
}

// 自动滚动加载更多内容
export async function autoScrollToLoad(scrollCount: number = 3, delay: number = 1500): Promise<void> {
  for (let i = 0; i < scrollCount; i++) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    })
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  // 滚动回顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 扫描间隔选项
export const scanIntervalOptions = [
  { value: 0, label: '不自动扫描' },
  { value: 15, label: '15 分钟' },
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
  { value: 120, label: '2 小时' },
  { value: 240, label: '4 小时' },
  { value: 480, label: '8 小时' },
  { value: 1440, label: '24 小时' }
]
