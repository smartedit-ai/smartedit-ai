/**
 * 网页剪藏工具 - 将网页内容转换为 Markdown 格式保存到 Obsidian
 */

export interface WebPageContent {
  title: string
  url: string
  author?: string
  publishDate?: string
  description?: string
  content: string
  markdown: string
  images: string[]
  readingTime?: number
}

/**
 * 提取网页主要内容
 */
export function extractPageContent(): WebPageContent {
  const title = extractTitle()
  const url = window.location.href
  const author = extractAuthor()
  const publishDate = extractPublishDate()
  const description = extractDescription()
  const { content, images } = extractMainContent()
  const markdown = htmlToMarkdown(content)
  const wordCount = markdown.replace(/[#*`\[\]()]/g, '').length
  const readingTime = Math.ceil(wordCount / 500) // 假设每分钟阅读 500 字

  return {
    title,
    url,
    author,
    publishDate,
    description,
    content,
    markdown,
    images,
    readingTime
  }
}

/**
 * 提取页面标题
 */
function extractTitle(): string {
  // 优先使用 og:title
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
  if (ogTitle) return ogTitle.trim()

  // 尝试获取文章标题
  const articleTitle = document.querySelector('article h1, .article-title, .post-title, .entry-title, [itemprop="headline"]')
  if (articleTitle) return articleTitle.textContent?.trim() || ''

  // 使用页面标题
  return document.title.split(/[-|–—]/)[0].trim()
}

/**
 * 提取作者
 */
function extractAuthor(): string | undefined {
  const selectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '[rel="author"]',
    '.author-name',
    '.byline',
    '[itemprop="author"]'
  ]

  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el) {
      const content = el.getAttribute('content') || el.textContent
      if (content?.trim()) return content.trim()
    }
  }
  return undefined
}

/**
 * 提取发布日期
 */
function extractPublishDate(): string | undefined {
  const selectors = [
    'meta[property="article:published_time"]',
    'meta[name="publish_date"]',
    'time[datetime]',
    '[itemprop="datePublished"]',
    '.publish-date',
    '.post-date'
  ]

  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el) {
      const content = el.getAttribute('content') || el.getAttribute('datetime') || el.textContent
      if (content?.trim()) {
        try {
          const date = new Date(content.trim())
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
          }
        } catch {
          return content.trim()
        }
      }
    }
  }
  return undefined
}

/**
 * 提取描述
 */
function extractDescription(): string | undefined {
  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content')
  if (ogDesc) return ogDesc.trim()

  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')
  if (metaDesc) return metaDesc.trim()

  return undefined
}

/**
 * 提取主要内容
 */
function extractMainContent(): { content: string; images: string[] } {
  const images: string[] = []
  
  // 尝试找到文章主体
  const articleSelectors = [
    'article',
    '[role="main"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content-body',
    '#article-content',
    '.rich_media_content', // 微信公众号
    '.article',
    'main'
  ]

  let mainElement: Element | null = null
  for (const selector of articleSelectors) {
    mainElement = document.querySelector(selector)
    if (mainElement) break
  }

  // 如果没找到，使用 body
  if (!mainElement) {
    mainElement = document.body
  }

  // 克隆元素以避免修改原始 DOM
  const clone = mainElement.cloneNode(true) as Element

  // 移除不需要的元素
  const removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'nav', 'header', 'footer',
    '.sidebar', '.comments', '.advertisement', '.ad', '.social-share',
    '.related-posts', '.navigation', '[role="navigation"]', '.menu',
    '.breadcrumb', '.pagination', '.share-buttons'
  ]
  
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove())
  })

  // 收集图片
  clone.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src')
    if (src && !src.startsWith('data:')) {
      const absoluteUrl = new URL(src, window.location.href).href
      images.push(absoluteUrl)
    }
  })

  return {
    content: clone.innerHTML,
    images
  }
}

/**
 * HTML 转 Markdown
 */
function htmlToMarkdown(html: string): string {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.replace(/\s+/g, ' ') || ''
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }

    const el = node as Element
    const tagName = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map(processNode).join('')

    switch (tagName) {
      case 'h1':
        return `\n# ${children.trim()}\n\n`
      case 'h2':
        return `\n## ${children.trim()}\n\n`
      case 'h3':
        return `\n### ${children.trim()}\n\n`
      case 'h4':
        return `\n#### ${children.trim()}\n\n`
      case 'h5':
        return `\n##### ${children.trim()}\n\n`
      case 'h6':
        return `\n###### ${children.trim()}\n\n`
      case 'p':
        return `\n${children.trim()}\n\n`
      case 'br':
        return '\n'
      case 'hr':
        return '\n---\n\n'
      case 'strong':
      case 'b':
        return `**${children.trim()}**`
      case 'em':
      case 'i':
        return `*${children.trim()}*`
      case 'code':
        return `\`${children.trim()}\``
      case 'pre':
        const codeEl = el.querySelector('code')
        const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || ''
        const codeContent = codeEl?.textContent || el.textContent || ''
        return `\n\`\`\`${lang}\n${codeContent.trim()}\n\`\`\`\n\n`
      case 'blockquote':
        return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n\n`
      case 'a':
        const href = el.getAttribute('href')
        if (href && !href.startsWith('javascript:')) {
          const absoluteHref = new URL(href, window.location.href).href
          return `[${children.trim()}](${absoluteHref})`
        }
        return children
      case 'img':
        const src = el.getAttribute('src') || el.getAttribute('data-src')
        const alt = el.getAttribute('alt') || ''
        if (src && !src.startsWith('data:')) {
          const absoluteSrc = new URL(src, window.location.href).href
          return `\n![${alt}](${absoluteSrc})\n`
        }
        return ''
      case 'ul':
        return `\n${processListItems(el, '-')}\n`
      case 'ol':
        return `\n${processListItems(el, '1.')}\n`
      case 'li':
        return children.trim()
      case 'table':
        return processTable(el)
      case 'div':
      case 'section':
      case 'article':
      case 'span':
        return children
      default:
        return children
    }
  }

  function processListItems(list: Element, marker: string): string {
    const items = Array.from(list.children)
      .filter(child => child.tagName.toLowerCase() === 'li')
      .map((li, index) => {
        const content = processNode(li).trim()
        const prefix = marker === '1.' ? `${index + 1}.` : marker
        return `${prefix} ${content}`
      })
    return items.join('\n')
  }

  function processTable(table: Element): string {
    const rows = Array.from(table.querySelectorAll('tr'))
    if (rows.length === 0) return ''

    const result: string[] = []
    
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'))
      const cellContents = cells.map(cell => processNode(cell).trim().replace(/\|/g, '\\|'))
      result.push(`| ${cellContents.join(' | ')} |`)
      
      // 添加表头分隔符
      if (rowIndex === 0) {
        result.push(`| ${cells.map(() => '---').join(' | ')} |`)
      }
    })

    return `\n${result.join('\n')}\n\n`
  }

  let markdown = processNode(tempDiv)
  
  // 清理多余的空行
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  markdown = markdown.trim()

  return markdown
}

/**
 * 格式化为 Obsidian 笔记
 */
export function formatAsObsidianPage(pageContent: WebPageContent): string {
  const now = new Date()
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 19)
  const domain = new URL(pageContent.url).hostname

  // YAML frontmatter
  let note = `---
title: "${pageContent.title.replace(/"/g, '\\"')}"
source: "${pageContent.url}"
author: "${pageContent.author || '未知'}"
published: "${pageContent.publishDate || '未知'}"
saved: "${timestamp}"
domain: "${domain}"
tags:
  - web-clip
  - ${domain.replace(/\./g, '-')}
---

`

  // 元信息区块
  note += `> [!info] 网页信息
> - **来源**: [${domain}](${pageContent.url})
> - **作者**: ${pageContent.author || '未知'}
> - **发布时间**: ${pageContent.publishDate || '未知'}
> - **保存时间**: ${timestamp}
> - **阅读时长**: 约 ${pageContent.readingTime || 1} 分钟

`

  // 描述
  if (pageContent.description) {
    note += `## 摘要

${pageContent.description}

`
  }

  // 正文
  note += `## 正文

${pageContent.markdown}

`

  // 原始链接
  note += `---

*本文由 [智编助手](https://github.com/example/smartedit) 自动保存于 ${timestamp}*
`

  return note
}

/**
 * 生成笔记文件名
 */
export function generateNotePath(title: string, basePath: string): string {
  // 清理标题中的非法字符
  const cleanTitle = title
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) // 限制长度

  const date = new Date().toISOString().slice(0, 10)
  const fileName = `${date} ${cleanTitle}`
  
  return basePath ? `${basePath}/${fileName}` : fileName
}
