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
export function getArxivPageType(): 'abstract' | 'pdf' | 'list' | 'search' | 'unknown' {
  const path = window.location.pathname
  
  if (path.includes('/abs/')) return 'abstract'
  if (path.includes('/pdf/')) return 'pdf'
  if (path.includes('/list/')) return 'list'
  if (path.includes('/search/')) return 'search'
  
  return 'unknown'
}

// 从 URL 提取论文 ID
export function extractPaperId(): string | null {
  const path = window.location.pathname
  
  // 匹配格式: /abs/2312.12345 或 /pdf/2312.12345
  const match = path.match(/\/(abs|pdf)\/(\d+\.\d+)(v\d+)?/)
  if (match) {
    return match[2] + (match[3] || '')
  }
  
  // 旧格式: /abs/cs/0001001
  const oldMatch = path.match(/\/(abs|pdf)\/([a-z-]+\/\d+)/)
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
