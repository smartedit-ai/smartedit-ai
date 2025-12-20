/**
 * arXiv 论文解析工具 - 让普通人也能看懂学术论文
 */

// 论文信息结构
export interface ArxivPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  categories: string[]
  publishedDate: string
  updatedDate?: string
  pdfUrl: string
  arxivUrl: string
  doi?: string
}

// 论文解读结果
export interface PaperInterpretation {
  paper: ArxivPaper
  // 一句话总结
  oneSentenceSummary: string
  // 通俗解读（给普通人看的）
  laymansExplanation: string
  // 核心贡献
  keyContributions: string[]
  // 研究背景（为什么做这个研究）
  background: string
  // 研究方法（怎么做的）
  methodology: string
  // 主要发现/结论
  findings: string
  // 实际应用场景
  applications: string[]
  // 局限性
  limitations: string
  // 相关领域关键词解释
  glossary: { term: string; explanation: string }[]
  // 适合阅读人群
  targetAudience: string
  // 难度评级 1-5
  difficultyLevel: number
  // 生成时间
  generatedAt: string
}

// 检测是否为 arXiv 页面
export function isArxivPage(): boolean {
  return window.location.hostname.includes('arxiv.org')
}

// 获取 arXiv 页面类型
export function getArxivPageType(): 'abstract' | 'pdf' | 'html' | 'list' | 'search' | 'unknown' {
  const path = window.location.pathname
  
  if (path.includes('/abs/')) return 'abstract'
  if (path.includes('/pdf/')) return 'pdf'
  if (path.includes('/html/')) return 'html'
  if (path.includes('/list/')) return 'list'
  if (path.includes('/search/')) return 'search'
  
  return 'unknown'
}

// 从 URL 提取论文 ID
export function extractPaperId(): string | null {
  const path = window.location.pathname
  
  // 匹配格式: /abs/2312.12345 或 /pdf/2312.12345 或 /html/2312.12345
  const match = path.match(/\/(abs|pdf|html)\/(\d+\.\d+)(v\d+)?/)
  if (match) {
    return match[2] + (match[3] || '')
  }
  
  // 旧格式: /abs/cs/0001001
  const oldMatch = path.match(/\/(abs|pdf|html)\/([a-z-]+\/\d+)/)
  if (oldMatch) {
    return oldMatch[2]
  }
  
  return null
}

// 从页面提取论文信息
export function extractPaperFromPage(): ArxivPaper | null {
  const pageType = getArxivPageType()
  
  if (pageType === 'pdf') {
    // PDF 页面只能获取基本信息
    const paperId = extractPaperId()
    if (!paperId) return null
    
    return {
      id: paperId,
      title: document.title.replace(/\[.*?\]/, '').trim(),
      authors: [],
      abstract: '',
      categories: [],
      publishedDate: '',
      pdfUrl: window.location.href,
      arxivUrl: `https://arxiv.org/abs/${paperId}`
    }
  }
  
  if (pageType !== 'abstract') {
    return null
  }
  
  try {
    const paperId = extractPaperId()
    if (!paperId) return null
    
    // 提取标题
    const titleEl = document.querySelector('.title.mathjax') as HTMLElement
    const title = titleEl?.textContent?.replace('Title:', '').trim() || ''
    
    // 提取作者
    const authorsEl = document.querySelector('.authors') as HTMLElement
    const authorsText = authorsEl?.textContent?.replace('Authors:', '').trim() || ''
    const authors = authorsText.split(',').map(a => a.trim()).filter(a => a)
    
    // 提取摘要
    const abstractEl = document.querySelector('.abstract.mathjax') as HTMLElement
    const abstract = abstractEl?.textContent?.replace('Abstract:', '').trim() || ''
    
    // 提取分类
    const categoriesEl = document.querySelector('.subjects') as HTMLElement
    const categoriesText = categoriesEl?.textContent || ''
    const categories = categoriesText.match(/[a-z]+\.[A-Z]+/g) || []
    
    // 提取日期
    const dateEl = document.querySelector('.dateline') as HTMLElement
    const dateText = dateEl?.textContent || ''
    const dateMatch = dateText.match(/\d{1,2}\s+\w+\s+\d{4}/)
    const publishedDate = dateMatch ? dateMatch[0] : ''
    
    // 提取 DOI
    const doiEl = document.querySelector('a[href*="doi.org"]') as HTMLAnchorElement
    const doi = doiEl?.href?.replace('https://doi.org/', '') || undefined
    
    return {
      id: paperId,
      title,
      authors,
      abstract,
      categories,
      publishedDate,
      pdfUrl: `https://arxiv.org/pdf/${paperId}.pdf`,
      arxivUrl: window.location.href,
      doi
    }
  } catch (e) {
    console.error('提取论文信息失败:', e)
    return null
  }
}

// 生成论文解读提示词（核心：让普通人看懂）
export function generateInterpretationPrompt(paper: ArxivPaper): string {
  return `你是一位擅长科普的学术翻译专家，请帮助普通读者理解这篇学术论文。

## 论文信息
- **标题**: ${paper.title}
- **作者**: ${paper.authors.join(', ')}
- **领域**: ${paper.categories.join(', ')}
- **摘要**: ${paper.abstract}

## 任务要求
请用通俗易懂的语言解读这篇论文，让没有专业背景的普通人也能理解。避免使用专业术语，如果必须使用，请给出解释。

请按以下 JSON 格式输出（确保是有效的 JSON）：

{
  "oneSentenceSummary": "用一句话概括这篇论文在做什么（20字以内）",
  "laymansExplanation": "用讲故事的方式，向一个高中生解释这篇论文的内容（200-300字）",
  "keyContributions": ["贡献1", "贡献2", "贡献3"],
  "background": "为什么要做这个研究？解决什么问题？（100字以内）",
  "methodology": "研究者是怎么做的？用什么方法？（100字以内，用比喻解释）",
  "findings": "发现了什么？得出什么结论？（100字以内）",
  "applications": ["应用场景1", "应用场景2", "应用场景3"],
  "limitations": "这个研究有什么局限性？（50字以内）",
  "glossary": [
    {"term": "专业术语1", "explanation": "通俗解释"},
    {"term": "专业术语2", "explanation": "通俗解释"}
  ],
  "targetAudience": "这篇论文适合什么人阅读？",
  "difficultyLevel": 3
}

注意：
1. 所有解释都要通俗易懂，像给朋友讲故事一样
2. 多用比喻和生活中的例子
3. 避免直接翻译摘要，要真正"解读"
4. difficultyLevel 是 1-5 的数字，1 最简单，5 最难
5. 确保输出是有效的 JSON 格式`
}

// 解析 AI 返回的解读结果
export function parseInterpretationResult(
  paper: ArxivPaper, 
  aiResponse: string
): PaperInterpretation | null {
  try {
    // 尝试提取 JSON
    let jsonStr = aiResponse
    
    // 如果包含 markdown 代码块，提取其中的 JSON
    const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
    
    // 清理可能的前后缀
    jsonStr = jsonStr.trim()
    if (jsonStr.startsWith('{') === false) {
      const startIdx = jsonStr.indexOf('{')
      if (startIdx !== -1) {
        jsonStr = jsonStr.slice(startIdx)
      }
    }
    if (jsonStr.endsWith('}') === false) {
      const endIdx = jsonStr.lastIndexOf('}')
      if (endIdx !== -1) {
        jsonStr = jsonStr.slice(0, endIdx + 1)
      }
    }
    
    const parsed = JSON.parse(jsonStr)
    
    return {
      paper,
      oneSentenceSummary: parsed.oneSentenceSummary || '',
      laymansExplanation: parsed.laymansExplanation || '',
      keyContributions: parsed.keyContributions || [],
      background: parsed.background || '',
      methodology: parsed.methodology || '',
      findings: parsed.findings || '',
      applications: parsed.applications || [],
      limitations: parsed.limitations || '',
      glossary: parsed.glossary || [],
      targetAudience: parsed.targetAudience || '',
      difficultyLevel: parsed.difficultyLevel || 3,
      generatedAt: new Date().toISOString()
    }
  } catch (e) {
    console.error('解析 AI 返回结果失败:', e)
    return null
  }
}

// 格式化解读结果为 Markdown（用于保存到 Obsidian）
export function formatInterpretationAsMarkdown(interpretation: PaperInterpretation): string {
  const { paper } = interpretation
  const difficultyStars = '⭐'.repeat(interpretation.difficultyLevel) + '☆'.repeat(5 - interpretation.difficultyLevel)
  
  return `---
title: "${paper.title.replace(/"/g, '\\"')}"
type: arxiv-paper
arxiv_id: "${paper.id}"
authors: [${paper.authors.map(a => `"${a}"`).join(', ')}]
categories: [${paper.categories.map(c => `"${c}"`).join(', ')}]
published: "${paper.publishedDate}"
difficulty: ${interpretation.difficultyLevel}
interpreted: "${interpretation.generatedAt}"
---

# 📄 ${paper.title}

> 🔗 [arXiv 原文](${paper.arxivUrl}) | [PDF 下载](${paper.pdfUrl})
> 👥 作者: ${paper.authors.join(', ')}
> 📅 发布: ${paper.publishedDate}
> 📊 难度: ${difficultyStars}

---

## 💡 一句话总结

**${interpretation.oneSentenceSummary}**

---

## 🎯 通俗解读

${interpretation.laymansExplanation}

---

## ✨ 核心贡献

${interpretation.keyContributions.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---

## 🔍 研究背景

${interpretation.background}

---

## 🛠️ 研究方法

${interpretation.methodology}

---

## 📊 主要发现

${interpretation.findings}

---

## 🌍 实际应用

${interpretation.applications.map(a => `- ${a}`).join('\n')}

---

## ⚠️ 局限性

${interpretation.limitations}

---

## 📖 术语表

${interpretation.glossary.map(g => `- **${g.term}**: ${g.explanation}`).join('\n')}

---

## 👤 适合人群

${interpretation.targetAudience}

---

## 📝 原文摘要

> ${paper.abstract}

---

*本解读由 AI 生成，仅供参考。建议结合原文阅读。*
`
}

// 生成保存路径
export function generatePaperSavePath(paper: ArxivPaper, basePath: string): string {
  // 清理标题作为文件名
  let fileName = paper.title
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
  
  const folder = basePath || '论文解读'
  const category = paper.categories[0]?.split('.')[0] || 'misc'
  
  return `${folder}/arXiv/${category}/${paper.id}-${fileName}`
}

// 获取论文分类的中文名称
export function getCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    'cs.AI': '人工智能',
    'cs.CL': '计算语言学',
    'cs.CV': '计算机视觉',
    'cs.LG': '机器学习',
    'cs.NE': '神经网络',
    'cs.RO': '机器人学',
    'cs.SE': '软件工程',
    'cs.CR': '密码学与安全',
    'cs.DB': '数据库',
    'cs.DC': '分布式计算',
    'cs.HC': '人机交互',
    'cs.IR': '信息检索',
    'cs.IT': '信息论',
    'cs.MA': '多智能体系统',
    'cs.MM': '多媒体',
    'cs.NI': '网络与互联网',
    'cs.PL': '编程语言',
    'cs.SD': '声音',
    'cs.SI': '社交网络',
    'stat.ML': '统计机器学习',
    'math.OC': '优化与控制',
    'eess.AS': '音频与语音处理',
    'eess.IV': '图像与视频处理',
    'physics': '物理学',
    'math': '数学',
    'q-bio': '定量生物学',
    'q-fin': '定量金融',
    'stat': '统计学',
    'econ': '经济学',
  }
  
  // 尝试精确匹配
  if (categoryMap[category]) {
    return categoryMap[category]
  }
  
  // 尝试前缀匹配
  const prefix = category.split('.')[0]
  const prefixMap: Record<string, string> = {
    'cs': '计算机科学',
    'stat': '统计学',
    'math': '数学',
    'physics': '物理学',
    'eess': '电气工程',
    'q-bio': '生物学',
    'q-fin': '金融学',
    'econ': '经济学',
    'astro-ph': '天体物理',
    'cond-mat': '凝聚态物理',
    'hep': '高能物理',
    'nlin': '非线性科学',
    'nucl': '核物理',
    'quant-ph': '量子物理',
  }
  
  return prefixMap[prefix] || category
}

// 难度等级描述
export function getDifficultyDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: '入门级 - 适合所有人阅读',
    2: '基础级 - 需要一些背景知识',
    3: '中等 - 需要相关领域基础',
    4: '进阶 - 需要较深专业知识',
    5: '专家级 - 需要深厚专业背景'
  }
  return descriptions[level] || descriptions[3]
}

// ============================================
// HTML 页面相关功能
// ============================================

// 论文章节结构
export interface PaperSection {
  id: string
  level: number
  title: string
  content: string
  subsections: PaperSection[]
}

// 论文完整内容
export interface PaperFullContent {
  paper: ArxivPaper
  sections: PaperSection[]
  figures: { id: string; caption: string; src?: string }[]
  tables: { id: string; caption: string; content: string }[]
  references: { id: string; text: string; doi?: string }[]
  equations: { id: string; latex: string }[]
}

// 知识图谱节点
export interface KnowledgeNode {
  id: string
  label: string
  type: 'concept' | 'method' | 'result' | 'application' | 'author' | 'paper'
  description?: string
}

// 知识图谱边
export interface KnowledgeEdge {
  source: string
  target: string
  relation: string
}

// 知识图谱
export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

// 脑图节点
export interface MindMapNode {
  id: string
  text: string
  children: MindMapNode[]
}

// 检测是否为 HTML 论文页面
export function isArxivHtmlPage(): boolean {
  return isArxivPage() && getArxivPageType() === 'html'
}

// 从 HTML 页面提取论文信息
export function extractPaperFromHtmlPage(): ArxivPaper | null {
  if (!isArxivHtmlPage()) return null
  
  try {
    const paperId = extractPaperId()
    if (!paperId) return null
    
    // HTML 页面的标题
    const titleEl = document.querySelector('h1.ltx_title') as HTMLElement
    const title = titleEl?.textContent?.replace('Title:', '').trim() || document.title
    
    // 作者
    const authorEls = document.querySelectorAll('.ltx_personname')
    const authors = Array.from(authorEls).map(el => el.textContent?.trim() || '').filter(a => a)
    
    // 摘要
    const abstractEl = document.querySelector('.ltx_abstract') as HTMLElement
    const abstract = abstractEl?.textContent?.replace('Abstract', '').trim() || ''
    
    return {
      id: paperId,
      title,
      authors,
      abstract,
      categories: [],
      publishedDate: '',
      pdfUrl: `https://arxiv.org/pdf/${paperId}.pdf`,
      arxivUrl: `https://arxiv.org/abs/${paperId}`
    }
  } catch (e) {
    console.error('从 HTML 页面提取论文信息失败:', e)
    return null
  }
}

// 提取论文章节结构
export function extractPaperSections(): PaperSection[] {
  const sections: PaperSection[] = []
  
  // 查找所有章节标题
  const sectionEls = document.querySelectorAll('section.ltx_section, section.ltx_subsection, section.ltx_subsubsection')
  
  sectionEls.forEach((sectionEl, index) => {
    const titleEl = sectionEl.querySelector('h2, h3, h4, h5, h6')
    const title = titleEl?.textContent?.trim() || `Section ${index + 1}`
    
    // 获取章节内容（排除子章节）
    const contentEls = sectionEl.querySelectorAll(':scope > p, :scope > .ltx_para')
    const content = Array.from(contentEls).map(el => el.textContent?.trim() || '').join('\n\n')
    
    // 判断层级
    let level = 1
    if (sectionEl.classList.contains('ltx_subsection')) level = 2
    if (sectionEl.classList.contains('ltx_subsubsection')) level = 3
    
    sections.push({
      id: sectionEl.id || `section-${index}`,
      level,
      title,
      content,
      subsections: []
    })
  })
  
  return sections
}

// 提取可翻译的段落
export function extractTranslatableParagraphs(): { id: string; element: HTMLElement; text: string }[] {
  const paragraphs: { id: string; element: HTMLElement; text: string }[] = []
  
  // 选择所有段落元素
  const paraEls = document.querySelectorAll('.ltx_para p, .ltx_abstract p, section p')
  
  paraEls.forEach((el, index) => {
    const text = el.textContent?.trim() || ''
    if (text.length > 20) { // 只翻译有意义的段落
      paragraphs.push({
        id: `para-${index}`,
        element: el as HTMLElement,
        text
      })
    }
  })
  
  return paragraphs
}

// 沉浸式翻译状态
let immersiveTranslationActive = false
let translatedElements: Map<HTMLElement, HTMLElement> = new Map()

// 开启沉浸式翻译
export async function startImmersiveTranslation(
  translateFn: (text: string) => Promise<string>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (immersiveTranslationActive) return
  
  immersiveTranslationActive = true
  const paragraphs = extractTranslatableParagraphs()
  
  for (let i = 0; i < paragraphs.length; i++) {
    if (!immersiveTranslationActive) break
    
    const { element, text } = paragraphs[i]
    
    // 跳过已翻译的
    if (translatedElements.has(element)) continue
    
    try {
      onProgress?.(i + 1, paragraphs.length)
      
      const translation = await translateFn(text)
      
      if (translation && immersiveTranslationActive) {
        // 创建翻译元素
        const translationEl = document.createElement('div')
        translationEl.className = 'smartedit-translation'
        translationEl.style.cssText = `
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-left: 3px solid #0ea5e9;
          padding: 12px 16px;
          margin: 8px 0;
          border-radius: 0 8px 8px 0;
          font-size: 14px;
          line-height: 1.8;
          color: #334155;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `
        translationEl.innerHTML = `<span style="color:#0ea5e9;font-weight:500;font-size:12px;display:block;margin-bottom:4px;">🌐 中文翻译</span>${translation}`
        
        // 插入到原文后面
        element.parentNode?.insertBefore(translationEl, element.nextSibling)
        translatedElements.set(element, translationEl)
      }
    } catch (e) {
      console.error('翻译段落失败:', e)
    }
  }
}

// 停止沉浸式翻译
export function stopImmersiveTranslation(): void {
  immersiveTranslationActive = false
}

// 移除所有翻译
export function removeAllTranslations(): void {
  immersiveTranslationActive = false
  translatedElements.forEach((translationEl) => {
    translationEl.remove()
  })
  translatedElements.clear()
}

// 获取翻译状态
export function getTranslationStatus(): { active: boolean; count: number } {
  return {
    active: immersiveTranslationActive,
    count: translatedElements.size
  }
}

// ============================================
// 论文总结功能
// ============================================

// 生成论文总结提示词
export function generateSummaryPrompt(paper: ArxivPaper, sections: PaperSection[]): string {
  const sectionSummary = sections.slice(0, 10).map(s => `### ${s.title}\n${s.content.slice(0, 500)}`).join('\n\n')
  
  return `请对以下学术论文进行全面总结，生成结构化的摘要。

## 论文信息
- **标题**: ${paper.title}
- **作者**: ${paper.authors.join(', ')}
- **摘要**: ${paper.abstract}

## 论文章节内容
${sectionSummary}

## 任务要求
请生成一份详细的论文总结，包括：

1. **研究问题**：这篇论文要解决什么问题？
2. **研究动机**：为什么这个问题重要？
3. **主要方法**：作者提出了什么方法/模型/算法？
4. **关键创新**：与现有方法相比，有什么创新点？
5. **实验设计**：如何验证方法的有效性？
6. **主要结果**：实验结果如何？
7. **结论与展望**：主要结论是什么？未来方向？

请用中文回答，语言要通俗易懂。`
}

// ============================================
// 脑图生成功能
// ============================================

// 生成脑图提示词
export function generateMindMapPrompt(paper: ArxivPaper, sections: PaperSection[]): string {
  const sectionTitles = sections.map(s => s.title).join(', ')
  
  return `请根据以下论文信息生成思维导图结构。

## 论文信息
- **标题**: ${paper.title}
- **摘要**: ${paper.abstract}
- **章节**: ${sectionTitles}

## 任务要求
请生成一个 Markdown 格式的思维导图，使用缩进表示层级关系。格式如下：

# ${paper.title}
## 研究背景
### 问题描述
### 现有方法局限
## 核心方法
### 方法1
### 方法2
## 实验
### 数据集
### 评估指标
### 结果
## 结论
### 主要贡献
### 未来工作

请根据论文内容填充具体内容，保持结构清晰，每个节点简洁明了（10字以内）。`
}

// 解析脑图 Markdown 为结构化数据
export function parseMindMapMarkdown(markdown: string): MindMapNode {
  const lines = markdown.split('\n').filter(l => l.trim())
  const root: MindMapNode = { id: 'root', text: 'Paper', children: [] }
  const stack: { node: MindMapNode; level: number }[] = [{ node: root, level: 0 }]
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s*(.+)/)
    if (match) {
      const level = match[1].length
      const text = match[2].trim()
      const newNode: MindMapNode = { id: `node-${index}`, text, children: [] }
      
      // 找到父节点
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop()
      }
      
      stack[stack.length - 1].node.children.push(newNode)
      stack.push({ node: newNode, level })
    }
  })
  
  return root.children[0] || root
}

// 生成 Mermaid 脑图代码
export function generateMermaidMindMap(node: MindMapNode): string {
  let mermaid = 'mindmap\n'
  
  function addNode(n: MindMapNode, depth: number) {
    const indent = '  '.repeat(depth)
    const prefix = depth === 0 ? 'root' : ''
    mermaid += `${indent}${prefix}((${n.text}))\n`
    n.children.forEach(child => addNode(child, depth + 1))
  }
  
  addNode(node, 0)
  return mermaid
}

// 生成 Markmap 格式（Markdown）
export function generateMarkmapMarkdown(node: MindMapNode, level: number = 1): string {
  let md = `${'#'.repeat(level)} ${node.text}\n`
  node.children.forEach(child => {
    md += generateMarkmapMarkdown(child, level + 1)
  })
  return md
}

// ============================================
// 知识图谱功能
// ============================================

// 生成知识图谱提示词
export function generateKnowledgeGraphPrompt(paper: ArxivPaper, sections: PaperSection[]): string {
  const sectionContent = sections.slice(0, 5).map(s => `${s.title}: ${s.content.slice(0, 300)}`).join('\n')
  
  return `请从以下论文中提取知识图谱，识别关键概念、方法、结果之间的关系。

## 论文信息
- **标题**: ${paper.title}
- **摘要**: ${paper.abstract}

## 部分内容
${sectionContent}

## 任务要求
请提取论文中的关键实体和关系，输出 JSON 格式：

{
  "nodes": [
    {"id": "n1", "label": "Transformer", "type": "method", "description": "一种基于注意力机制的模型架构"},
    {"id": "n2", "label": "Self-Attention", "type": "concept", "description": "自注意力机制"},
    {"id": "n3", "label": "机器翻译", "type": "application", "description": "将一种语言翻译成另一种语言"}
  ],
  "edges": [
    {"source": "n1", "target": "n2", "relation": "使用"},
    {"source": "n1", "target": "n3", "relation": "应用于"}
  ]
}

节点类型包括：concept（概念）、method（方法）、result（结果）、application（应用）
请提取 8-15 个关键节点和它们之间的关系。确保输出是有效的 JSON。`
}

// 解析知识图谱 JSON
export function parseKnowledgeGraph(jsonStr: string): KnowledgeGraph | null {
  try {
    // 提取 JSON
    let json = jsonStr
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      json = jsonMatch[1]
    }
    
    json = json.trim()
    if (!json.startsWith('{')) {
      const startIdx = json.indexOf('{')
      if (startIdx !== -1) json = json.slice(startIdx)
    }
    if (!json.endsWith('}')) {
      const endIdx = json.lastIndexOf('}')
      if (endIdx !== -1) json = json.slice(0, endIdx + 1)
    }
    
    const parsed = JSON.parse(json)
    return {
      nodes: parsed.nodes || [],
      edges: parsed.edges || []
    }
  } catch (e) {
    console.error('解析知识图谱失败:', e)
    return null
  }
}

// 生成 Mermaid 知识图谱代码
export function generateMermaidGraph(graph: KnowledgeGraph): string {
  let mermaid = 'graph LR\n'
  
  // 添加节点样式
  const typeStyles: Record<string, string> = {
    concept: 'fill:#e0f2fe,stroke:#0ea5e9',
    method: 'fill:#dcfce7,stroke:#22c55e',
    result: 'fill:#fef3c7,stroke:#f59e0b',
    application: 'fill:#f3e8ff,stroke:#a855f7'
  }
  
  // 添加节点
  graph.nodes.forEach(node => {
    const shape = node.type === 'method' ? `[${node.label}]` : `(${node.label})`
    mermaid += `  ${node.id}${shape}\n`
  })
  
  // 添加边
  graph.edges.forEach(edge => {
    mermaid += `  ${edge.source} -->|${edge.relation}| ${edge.target}\n`
  })
  
  // 添加样式
  graph.nodes.forEach(node => {
    const style = typeStyles[node.type] || typeStyles.concept
    mermaid += `  style ${node.id} ${style}\n`
  })
  
  return mermaid
}

// 格式化知识图谱为 Markdown
export function formatKnowledgeGraphAsMarkdown(graph: KnowledgeGraph, paper: ArxivPaper): string {
  const typeNames: Record<string, string> = {
    concept: '📚 概念',
    method: '🔧 方法',
    result: '📊 结果',
    application: '🌍 应用'
  }
  
  let md = `# 知识图谱: ${paper.title}\n\n`
  
  // 按类型分组节点
  const nodesByType: Record<string, KnowledgeNode[]> = {}
  graph.nodes.forEach(node => {
    if (!nodesByType[node.type]) nodesByType[node.type] = []
    nodesByType[node.type].push(node)
  })
  
  // 输出节点
  md += `## 关键实体\n\n`
  Object.entries(nodesByType).forEach(([type, nodes]) => {
    md += `### ${typeNames[type] || type}\n\n`
    nodes.forEach(node => {
      md += `- **${node.label}**${node.description ? `: ${node.description}` : ''}\n`
    })
    md += '\n'
  })
  
  // 输出关系
  md += `## 关系网络\n\n`
  graph.edges.forEach(edge => {
    const source = graph.nodes.find(n => n.id === edge.source)
    const target = graph.nodes.find(n => n.id === edge.target)
    if (source && target) {
      md += `- ${source.label} **${edge.relation}** ${target.label}\n`
    }
  })
  
  // 添加 Mermaid 图
  md += `\n## 可视化图谱\n\n\`\`\`mermaid\n${generateMermaidGraph(graph)}\`\`\`\n`
  
  return md
}
