import { useState, useCallback } from 'react'
import { FORMAT_TEMPLATES } from '../constants'
import { applyTemplate, clearFormat, addIndent, adjustLineHeight, adjustParagraphSpacing, getEditor, aiRequest } from '../utils'
import {
  isArxivPage,
  getArxivPageType,
  extractPaperFromPage,
  generateInterpretationPrompt,
  parseInterpretationResult,
  formatInterpretationAsMarkdown,
  generatePaperSavePath,
  getCategoryName,
  getDifficultyDescription,
  ArxivPaper,
  PaperInterpretation,
  // HTML 页面相关
  isArxivHtmlPage,
  extractPaperFromHtmlPage,
  extractPaperSections,
  PaperSection,
  // 沉浸式翻译
  startImmersiveTranslation,
  stopImmersiveTranslation,
  removeAllTranslations,
  getTranslationStatus,
  // 总结和脑图
  generateSummaryPrompt,
  generateMindMapPrompt,
  parseMindMapMarkdown,
  generateMermaidMindMap,
  MindMapNode,
  // 知识图谱
  generateKnowledgeGraphPrompt,
  parseKnowledgeGraph,
  formatKnowledgeGraphAsMarkdown,
  KnowledgeGraph
} from '../../lib/arxivParser'
import { ObsidianClient, ObsidianConfig } from '../../lib/obsidian'

interface ToolPanelProps {
  themeColor: string
}

// 脑图树形组件
function MindMapTree({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div className={`flex items-center gap-1 py-0.5 ${depth === 0 ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${depth === 0 ? 'bg-purple-500' : depth === 1 ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
        <span className="text-xs">{node.text}</span>
      </div>
      {node.children.map((child, i) => (
        <MindMapTree key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

// 将脑图转为 Markdown
function renderMindMapAsMarkdown(node: MindMapNode, level: number): string {
  let md = `${'#'.repeat(level)} ${node.text}\n\n`
  node.children.forEach(child => {
    md += renderMindMapAsMarkdown(child, level + 1)
  })
  return md
}

// 效率工具配置
const EFFICIENCY_TOOLS = [
  { id: 'import-article', icon: '📄', label: '导入文章', color: 'from-blue-400 to-blue-500', desc: '从剪贴板导入' },
  { id: 'import-word', icon: '📝', label: '导入Word', color: 'from-blue-500 to-blue-600', desc: '粘贴Word内容' },
  { id: 'gen-qrcode', icon: '📱', label: '生成二维码', color: 'from-green-400 to-green-500', desc: '文字转二维码' },
  { id: 'gen-longimg', icon: '🖼️', label: '生成长图', color: 'from-orange-400 to-orange-500', desc: '文章转图片' },
  { id: 'permanent-link', icon: '🔗', label: '永久链接', color: 'from-blue-300 to-blue-400', desc: '获取文章链接' },
  { id: 'word-count', icon: '📊', label: '字数统计', color: 'from-cyan-400 to-cyan-500', desc: '统计文章字数' },
  { id: 'image-design', icon: '🎨', label: '图片设计', color: 'from-purple-400 to-purple-500', desc: '在线设计' },
  { id: 'ai-layout', icon: '✨', label: 'AI排版', color: 'from-green-500 to-green-600', desc: '智能美化' },
]

// 特色功能配置
const SPECIAL_FEATURES = [
  { id: 'title-score', icon: '📊', label: '标题评分', color: 'from-amber-400 to-amber-500', desc: 'AI评估标题' },
  { id: 'violation-check', icon: '🛡️', label: '违规检测', color: 'from-green-400 to-green-500', desc: '敏感词检查' },
  { id: 'ai-summary', icon: '📝', label: 'AI摘要', color: 'from-purple-400 to-purple-500', desc: '生成文章摘要' },
  { id: 'ai-polish', icon: '✨', label: 'AI润色', color: 'from-blue-400 to-blue-500', desc: '优化文章表达' },
  { id: 'ai-outline', icon: '📋', label: 'AI大纲', color: 'from-indigo-400 to-indigo-500', desc: '生成文章大纲' },
  { id: 'ai-continue', icon: '➡️', label: 'AI续写', color: 'from-teal-400 to-teal-500', desc: '智能续写内容' },
  { id: 'ai-translate', icon: '🌐', label: 'AI翻译', color: 'from-rose-400 to-rose-500', desc: '中英互译' },
  { id: 'ai-rewrite', icon: '🔄', label: '改写风格', color: 'from-orange-400 to-orange-500', desc: '换种方式表达' },
]

// 敏感词库（扩展版）
const SENSITIVE_WORDS = {
  illegal: ['赌博', '色情', '暴力', '毒品', '枪支', '诈骗', '传销', '洗钱', '走私', '黄赌毒', '博彩', '赌场', '六合彩', '私彩'],
  political: ['政变', '暴动', '分裂', '颠覆', '反动', '邪教', '法轮'],
  medical: ['包治百病', '根治', '祖传秘方', '无效退款', '药到病除', '特效药', '神药', '癌症克星', '糖尿病克星', '一针见效', '立竿见影', '无副作用', '纯天然无害'],
  exaggerate: ['第一', '最好', '最强', '绝对', '100%', '永久', '万能', '唯一', '首选', '顶级', '极致', '史上最', '全网最', '独家', '限时', '仅此一次', '错过不再'],
  finance: ['稳赚不赔', '高额回报', '零风险', '内幕消息', '暴富', '躺赚', '日入过万', '月入百万', '财务自由', '一夜暴富', '稳定收益', '保本保息', '翻倍', '原始股'],
  privacy: ['身份证号', '银行卡号', '手机号码', '家庭住址', '个人隐私'],
  copyright: ['盗版', '破解版', '免费下载', '资源分享', '网盘链接', '百度云', '迅雷下载'],
  vulgar: ['屌丝', '逼格', '装逼', '牛逼', '傻逼', '他妈的', '卧槽'],
}

export default function ToolPanel({ themeColor }: ToolPanelProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'format' | 'paper'>('tools')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTool, setLoadingTool] = useState('')
  
  // arXiv 论文解读相关状态
  const [currentPaper, setCurrentPaper] = useState<ArxivPaper | null>(null)
  const [interpretation, setInterpretation] = useState<PaperInterpretation | null>(null)
  const [paperError, setPaperError] = useState<string | null>(null)
  const [isSavingToObsidian, setIsSavingToObsidian] = useState(false)
  
  // HTML 页面高级功能状态
  const [paperSections, setPaperSections] = useState<PaperSection[]>([])
  const [translationProgress, setTranslationProgress] = useState<{ current: number; total: number } | null>(null)
  const [paperSummary, setPaperSummary] = useState<string | null>(null)
  const [mindMap, setMindMap] = useState<MindMapNode | null>(null)
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null)
  const [activeFeature, setActiveFeature] = useState<'interpret' | 'translate' | 'summary' | 'mindmap' | 'knowledge'>('interpret')

  // 处理效率工具点击
  const handleToolClick = (toolId: string) => {
    const editor = getEditor()
    
    switch (toolId) {
      case 'import-article':
        navigator.clipboard.readText().then(text => {
          if (text && editor) {
            editor.innerHTML = `<p>${text.split('\n').filter(l => l.trim()).join('</p><p>')}</p>`
            alert('文章已导入！')
          } else {
            alert('剪贴板为空或无法访问编辑器')
          }
        }).catch(() => alert('无法访问剪贴板，请检查权限'))
        break
      case 'import-word':
        alert('请直接在编辑器中粘贴 Word 内容（Ctrl+V），系统会自动清理格式')
        break
      case 'gen-qrcode':
        const qrText = prompt('请输入要生成二维码的文字或链接：')
        if (qrText && editor) {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`
          editor.innerHTML += `<p style="text-align:center"><img src="${qrUrl}" alt="二维码" style="max-width:200px"></p>`
          alert('二维码已插入！')
        }
        break
      case 'gen-longimg':
        if (editor) {
          // 使用 html2canvas 思路，提示用户截图
          alert('💡 长图生成提示：\n\n1. 按 F12 打开开发者工具\n2. 按 Ctrl+Shift+P 输入 "screenshot"\n3. 选择 "Capture full size screenshot"\n\n或使用浏览器扩展如 "FireShot" 进行截图')
        }
        break
      case 'permanent-link':
        const currentUrl = window.location.href
        navigator.clipboard.writeText(currentUrl).then(() => {
          alert('当前页面链接已复制到剪贴板！')
        })
        break
      case 'word-count':
        if (editor) {
          const text = editor.innerText || ''
          const charCount = text.replace(/\s/g, '').length
          const wordCount = text.trim().split(/\s+/).filter(w => w).length
          const paragraphCount = editor.querySelectorAll('p').length || text.split('\n\n').filter(p => p.trim()).length
          const readTime = Math.ceil(charCount / 500) // 按每分钟500字计算
          alert(`📊 文章统计\n\n字符数：${charCount}\n词数：${wordCount}\n段落数：${paragraphCount}\n预计阅读：${readTime} 分钟`)
        } else {
          alert('请先打开文章编辑页面')
        }
        break
      case 'image-design':
        window.open('https://www.canva.cn/', '_blank')
        break
      case 'ai-layout':
        if (editor) {
          applyTemplate('简约清新', themeColor)
          alert('✨ AI排版已应用「简约清新」模板')
        }
        break
      default:
        alert('功能开发中...')
    }
  }

  // 处理特色功能点击
  const handleFeatureClick = async (featureId: string) => {
    const editor = getEditor()
    
    switch (featureId) {
      case 'title-score':
        const titleEl = document.querySelector('input[placeholder*="标题"], .title-input, #title, [class*="title"]') as HTMLInputElement
        const title = titleEl?.value || prompt('请输入要评分的标题：')
        if (title) {
          setIsLoading(true)
          setLoadingTool('title-score')
          try {
            // 使用 AI 评分
            const result = await aiRequest('title-score', title)
            if (result) {
              alert(`📊 AI 标题评分\n\n${result}`)
            } else {
              // 降级到本地评分
              let score = 60
              const feedback: string[] = []
              
              if (title.length >= 10 && title.length <= 30) {
                score += 15
                feedback.push('✅ 标题长度适中')
              } else if (title.length < 10) {
                score -= 10
                feedback.push('❌ 标题过短，建议10-30字')
              } else {
                score -= 5
                feedback.push('⚠️ 标题略长，建议精简')
              }
              
              if (/[！？!?]/.test(title)) {
                score += 5
                feedback.push('✅ 使用了感叹/疑问句式')
              }
              if (/\d/.test(title)) {
                score += 10
                feedback.push('✅ 包含数字，更具体')
              }
              if (/[「」【】《》]/.test(title)) {
                score += 5
                feedback.push('✅ 使用了特殊符号')
              }
              if (/如何|为什么|揭秘|必看|干货|技巧|方法/.test(title)) {
                score += 10
                feedback.push('✅ 包含吸引词汇')
              }
              
              score = Math.min(100, Math.max(0, score))
              const level = score >= 80 ? '🌟 优秀' : score >= 60 ? '👍 良好' : '⚠️ 待优化'
              
              alert(`📊 标题评分：${score}分 ${level}\n\n${feedback.join('\n')}`)
            }
          } catch {
            alert('AI 评分失败，请检查 API 配置')
          }
          setIsLoading(false)
          setLoadingTool('')
        }
        break
        
      case 'violation-check':
        if (editor) {
          const content = editor.innerText
          const results: { category: string; words: string[] }[] = []
          
          // 检查各类敏感词
          Object.entries(SENSITIVE_WORDS).forEach(([category, words]) => {
            const found = words.filter(w => content.includes(w))
            if (found.length > 0) {
              const categoryNames: Record<string, string> = {
                illegal: '🚫 违法违规',
                political: '⚠️ 政治敏感',
                medical: '💊 医疗夸大',
                exaggerate: '📢 绝对化用语',
                finance: '💰 金融风险',
                privacy: '🔒 隐私信息',
                copyright: '©️ 版权风险',
                vulgar: '🤬 低俗用语',
              }
              results.push({ category: categoryNames[category] || category, words: found })
            }
          })
          
          if (results.length > 0) {
            const report = results.map(r => `【${r.category}】${r.words.join('、')}`).join('\n')
            alert(`⚠️ 违规检测报告\n\n检测到以下风险内容：\n\n${report}\n\n建议修改后再发布`)
          } else {
            alert('✅ 违规检测通过\n\n未检测到常见敏感词和违规内容，文章基本合规。\n\n提示：本检测仅供参考，请确保内容符合平台规范。')
          }
        } else {
          alert('请先打开文章编辑页面')
        }
        break
        
      case 'ai-summary':
        if (editor) {
          const content = editor.innerText
          if (content.length < 50) {
            alert('文章内容过短，无法生成摘要')
            return
          }
          setIsLoading(true)
          setLoadingTool('ai-summary')
          try {
            const result = await aiRequest('summarize', content.slice(0, 3000))
            if (result) {
              const useSummary = confirm(`📝 AI 摘要\n\n${result}\n\n是否插入到文章开头？`)
              if (useSummary) {
                const summaryHtml = `<blockquote style="background:#f8f9fa;border-left:4px solid ${themeColor};padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><p style="font-size:14px;line-height:1.8;color:#666;margin:0"><strong>📝 摘要：</strong>${result}</p></blockquote>`
                editor.innerHTML = summaryHtml + editor.innerHTML
                alert('摘要已插入文章开头！')
              }
            }
          } catch {
            alert('AI 摘要生成失败，请检查 API 配置')
          }
          setIsLoading(false)
          setLoadingTool('')
        } else {
          alert('请先打开文章编辑页面')
        }
        break
        
      case 'ai-polish':
        if (editor) {
          const selection = window.getSelection()
          const selectedText = selection?.toString().trim()
          
          if (!selectedText) {
            alert('请先选中要润色的文字')
            return
          }
          
          setIsLoading(true)
          setLoadingTool('ai-polish')
          try {
            const result = await aiRequest('rewrite', selectedText)
            if (result) {
              const usePolished = confirm(`✨ AI 润色结果\n\n原文：${selectedText.slice(0, 100)}${selectedText.length > 100 ? '...' : ''}\n\n润色后：${result}\n\n是否替换原文？`)
              if (usePolished) {
                document.execCommand('insertText', false, result)
                alert('文字已润色替换！')
              }
            }
          } catch {
            alert('AI 润色失败，请检查 API 配置')
          }
          setIsLoading(false)
          setLoadingTool('')
        } else {
          alert('请先打开文章编辑页面')
        }
        break

      case 'ai-outline':
        // AI 大纲生成
        if (editor) {
          const topic = prompt('请输入文章主题或关键词：')
          if (!topic) return
          
          setIsLoading(true)
          setLoadingTool('ai-outline')
          try {
            const result = await aiRequest('outline', topic)
            if (result) {
              const useOutline = confirm(`📋 AI 生成大纲\n\n${result}\n\n是否插入到编辑器？`)
              if (useOutline) {
                // 将大纲转换为 HTML 格式
                const outlineHtml = result.split('\n').map((line: string) => {
                  if (line.match(/^#+\s/)) {
                    const level = line.match(/^#+/)?.[0].length || 1
                    const text = line.replace(/^#+\s*/, '')
                    return `<h${Math.min(level + 1, 4)} style="font-size:${20 - level * 2}px;font-weight:bold;color:#333;margin:16px 0 8px">${text}</h${Math.min(level + 1, 4)}>`
                  } else if (line.match(/^[-*]\s/)) {
                    return `<p style="margin:8px 0;padding-left:20px">• ${line.replace(/^[-*]\s*/, '')}</p>`
                  } else if (line.match(/^\d+\.\s/)) {
                    return `<p style="margin:8px 0;padding-left:20px">${line}</p>`
                  }
                  return line ? `<p style="margin:8px 0">${line}</p>` : ''
                }).join('')
                editor.innerHTML = outlineHtml + '<p><br></p>' + editor.innerHTML
                alert('大纲已插入文章开头！')
              }
            }
          } catch {
            alert('AI 大纲生成失败，请检查 API 配置')
          }
          setIsLoading(false)
          setLoadingTool('')
        } else {
          alert('请先打开文章编辑页面')
        }
        break

      case 'ai-continue':
        // AI 续写
        if (editor) {
          const content = editor.innerText
          if (content.length < 20) {
            alert('请先输入一些内容，AI 将基于现有内容续写')
            return
          }
          
          setIsLoading(true)
          setLoadingTool('ai-continue')
          try {
            const result = await aiRequest('continue', content.slice(-1500)) // 取最后1500字作为上下文
            if (result) {
              const useContinue = confirm(`➡️ AI 续写内容\n\n${result.slice(0, 500)}${result.length > 500 ? '...' : ''}\n\n是否追加到文章末尾？`)
              if (useContinue) {
                editor.innerHTML += `<p style="margin:16px 0;line-height:1.8">${result.replace(/\n/g, '</p><p style="margin:16px 0;line-height:1.8">')}</p>`
                alert('续写内容已追加！')
              }
            }
          } catch {
            alert('AI 续写失败，请检查 API 配置')
          }
          setIsLoading(false)
          setLoadingTool('')
        } else {
          alert('请先打开文章编辑页面')
        }
        break

      case 'ai-translate':
        // AI 翻译
        if (editor) {
          const selection = window.getSelection()
          const selectedText = selection?.toString().trim()
          
          if (!selectedText) {
            alert('请先选中要翻译的文字')
            return
          }
          
          // 检测语言方向
          const isChinese = /[\u4e00-\u9fa5]/.test(selectedText)
          const direction = isChinese ? '中译英' : '英译中'
          
          setIsLoading(true)
          setLoadingTool('ai-translate')
          try {
            const result = await aiRequest('translate', `${direction}：${selectedText}`)
            if (result) {
              const action = confirm(`🌐 AI 翻译 (${direction})\n\n原文：${selectedText.slice(0, 100)}${selectedText.length > 100 ? '...' : ''}\n\n译文：${result}\n\n点击「确定」替换原文，「取消」仅复制译文`)
              if (action) {
                document.execCommand('insertText', false, result)
                alert('已替换为译文！')
              } else {
                navigator.clipboard.writeText(result)
                alert('译文已复制到剪贴板！')
              }
            }
          } catch {
            alert('AI 翻译失败，请检查 API 配置')
          }
          setIsLoading(false)
          setLoadingTool('')
        } else {
          alert('请先打开文章编辑页面')
        }
        break

      case 'ai-rewrite':
        // 改写风格
        if (editor) {
          const selection = window.getSelection()
          const selectedText = selection?.toString().trim()
          
          if (!selectedText) {
            alert('请先选中要改写的文字')
            return
          }
          
          const styles = ['正式商务', '轻松活泼', '幽默风趣', '文艺抒情', '简洁精炼']
          const styleChoice = prompt(`请选择改写风格（输入数字）：\n\n1. 正式商务\n2. 轻松活泼\n3. 幽默风趣\n4. 文艺抒情\n5. 简洁精炼`)
          
          if (!styleChoice || !['1', '2', '3', '4', '5'].includes(styleChoice)) {
            alert('请输入有效的数字 1-5')
            return
          }
          
          const targetStyle = styles[parseInt(styleChoice) - 1]
          
          setIsLoading(true)
          setLoadingTool('ai-rewrite')
          try {
            const result = await aiRequest('style-rewrite', `将以下内容改写为${targetStyle}风格：\n\n${selectedText}`)
            if (result) {
              const useRewrite = confirm(`🔄 ${targetStyle}风格改写\n\n原文：${selectedText.slice(0, 100)}${selectedText.length > 100 ? '...' : ''}\n\n改写后：${result}\n\n是否替换原文？`)
              if (useRewrite) {
                document.execCommand('insertText', false, result)
                alert('已替换为改写内容！')
              }
            }
          } catch {
            alert('AI 改写失败，请检查 API 配置')
          }
          setIsLoading(false)
          setLoadingTool('')
        } else {
          alert('请先打开文章编辑页面')
        }
        break
        
      default:
        alert('功能开发中...')
    }
  }

  // AI 解读论文
  const handleInterpretPaper = useCallback(async () => {
    if (!currentPaper) {
      setPaperError('请先提取论文信息')
      return
    }
    
    setIsLoading(true)
    setLoadingTool('paper-interpret')
    setPaperError(null)
    
    try {
      const prompt = generateInterpretationPrompt(currentPaper)
      const result = await aiRequest('paper-interpret', prompt)
      
      if (result) {
        const parsed = parseInterpretationResult(currentPaper, result)
        if (parsed) {
          setInterpretation(parsed)
        } else {
          setPaperError('AI 返回格式解析失败，请重试')
        }
      } else {
        setPaperError('AI 解读失败，请检查 API 配置')
      }
    } catch (e) {
      setPaperError(`解读失败: ${(e as Error).message}`)
    }
    
    setIsLoading(false)
    setLoadingTool('')
  }, [currentPaper])

  // 保存解读到 Obsidian
  const handleSaveToObsidian = useCallback(async () => {
    if (!interpretation) return
    
    setIsSavingToObsidian(true)
    
    try {
      const result = await chrome.storage.sync.get(['settings'])
      const obsidianConfig = result.settings?.obsidian as ObsidianConfig | undefined
      
      if (!obsidianConfig?.enabled) {
        alert('❌ 请先在设置中启用 Obsidian 集成')
        setIsSavingToObsidian(false)
        return
      }
      
      const noteContent = formatInterpretationAsMarkdown(interpretation)
      const basePath = obsidianConfig.defaultPath || ''
      const notePath = generatePaperSavePath(interpretation.paper, basePath)
      
      const client = new ObsidianClient(obsidianConfig)
      const saveResult = await client.saveNote(notePath, noteContent)
      
      if (saveResult.success) {
        alert(`✅ 论文解读已保存到 Obsidian\n\n📁 路径: ${notePath}.md`)
      } else {
        alert(`❌ 保存失败: ${saveResult.error || '未知错误'}`)
      }
    } catch (e) {
      alert(`❌ 保存失败: ${(e as Error).message}`)
    }
    
    setIsSavingToObsidian(false)
  }, [interpretation])

  // 复制解读内容
  const handleCopyInterpretation = useCallback(() => {
    if (!interpretation) return
    
    const text = `# ${interpretation.paper.title}

## 一句话总结
${interpretation.oneSentenceSummary}

## 通俗解读
${interpretation.laymansExplanation}

## 核心贡献
${interpretation.keyContributions.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## 研究背景
${interpretation.background}

## 研究方法
${interpretation.methodology}

## 主要发现
${interpretation.findings}

## 实际应用
${interpretation.applications.map(a => `- ${a}`).join('\n')}

## 术语表
${interpretation.glossary.map(g => `- ${g.term}: ${g.explanation}`).join('\n')}

---
arXiv: ${interpretation.paper.arxivUrl}
`
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ 解读内容已复制到剪贴板')
    })
  }, [interpretation])

  // 提取 HTML 页面论文信息和章节
  const handleExtractHtmlPaper = useCallback(() => {
    setPaperError(null)
    setInterpretation(null)
    setPaperSummary(null)
    setMindMap(null)
    setKnowledgeGraph(null)
    
    // 尝试从 HTML 页面提取
    let paper = extractPaperFromHtmlPage()
    
    // 如果不是 HTML 页面，尝试从摘要页提取
    if (!paper) {
      paper = extractPaperFromPage()
    }
    
    if (!paper) {
      setPaperError('无法提取论文信息，请确保在 arXiv 论文页面')
      return
    }
    
    setCurrentPaper(paper)
    
    // 如果是 HTML 页面，提取章节
    if (isArxivHtmlPage()) {
      const sections = extractPaperSections()
      setPaperSections(sections)
    }
  }, [])

  // 沉浸式翻译
  const handleStartTranslation = useCallback(async () => {
    if (!isArxivHtmlPage()) {
      alert('⚠️ 沉浸式翻译仅支持 arXiv HTML 页面\n\n请访问论文的 HTML 版本（/html/xxx）')
      return
    }
    
    const status = getTranslationStatus()
    if (status.active) {
      stopImmersiveTranslation()
      setTranslationProgress(null)
      return
    }
    
    setIsLoading(true)
    setLoadingTool('translate')
    
    try {
      await startImmersiveTranslation(
        async (text) => {
          const result = await aiRequest('translate', `请将以下学术论文内容翻译成中文，保持专业术语的准确性：\n\n${text}`)
          return result || ''
        },
        (current, total) => {
          setTranslationProgress({ current, total })
        }
      )
    } catch (e) {
      console.error('翻译失败:', e)
    }
    
    setIsLoading(false)
    setLoadingTool('')
    setTranslationProgress(null)
  }, [])

  // 移除翻译
  const handleRemoveTranslation = useCallback(() => {
    removeAllTranslations()
    setTranslationProgress(null)
  }, [])

  // 生成论文总结
  const handleGenerateSummary = useCallback(async () => {
    if (!currentPaper) {
      setPaperError('请先提取论文信息')
      return
    }
    
    setIsLoading(true)
    setLoadingTool('summary')
    setPaperError(null)
    
    try {
      const prompt = generateSummaryPrompt(currentPaper, paperSections)
      const result = await aiRequest('paper-summary', prompt)
      
      if (result) {
        setPaperSummary(result)
      } else {
        setPaperError('生成总结失败，请检查 API 配置')
      }
    } catch (e) {
      setPaperError(`生成总结失败: ${(e as Error).message}`)
    }
    
    setIsLoading(false)
    setLoadingTool('')
  }, [currentPaper, paperSections])

  // 生成脑图
  const handleGenerateMindMap = useCallback(async () => {
    if (!currentPaper) {
      setPaperError('请先提取论文信息')
      return
    }
    
    setIsLoading(true)
    setLoadingTool('mindmap')
    setPaperError(null)
    
    try {
      const prompt = generateMindMapPrompt(currentPaper, paperSections)
      const result = await aiRequest('paper-mindmap', prompt)
      
      if (result) {
        const parsed = parseMindMapMarkdown(result)
        setMindMap(parsed)
      } else {
        setPaperError('生成脑图失败，请检查 API 配置')
      }
    } catch (e) {
      setPaperError(`生成脑图失败: ${(e as Error).message}`)
    }
    
    setIsLoading(false)
    setLoadingTool('')
  }, [currentPaper, paperSections])

  // 生成知识图谱
  const handleGenerateKnowledgeGraph = useCallback(async () => {
    if (!currentPaper) {
      setPaperError('请先提取论文信息')
      return
    }
    
    setIsLoading(true)
    setLoadingTool('knowledge')
    setPaperError(null)
    
    try {
      const prompt = generateKnowledgeGraphPrompt(currentPaper, paperSections)
      const result = await aiRequest('paper-knowledge', prompt)
      
      if (result) {
        const parsed = parseKnowledgeGraph(result)
        if (parsed) {
          setKnowledgeGraph(parsed)
        } else {
          setPaperError('解析知识图谱失败，请重试')
        }
      } else {
        setPaperError('生成知识图谱失败，请检查 API 配置')
      }
    } catch (e) {
      setPaperError(`生成知识图谱失败: ${(e as Error).message}`)
    }
    
    setIsLoading(false)
    setLoadingTool('')
  }, [currentPaper, paperSections])

  // 复制脑图 Mermaid 代码
  const handleCopyMindMap = useCallback(() => {
    if (!mindMap) return
    const mermaid = generateMermaidMindMap(mindMap)
    navigator.clipboard.writeText(mermaid).then(() => {
      alert('✅ Mermaid 脑图代码已复制')
    })
  }, [mindMap])

  // 复制知识图谱
  const handleCopyKnowledgeGraph = useCallback(() => {
    if (!knowledgeGraph || !currentPaper) return
    const md = formatKnowledgeGraphAsMarkdown(knowledgeGraph, currentPaper)
    navigator.clipboard.writeText(md).then(() => {
      alert('✅ 知识图谱已复制')
    })
  }, [knowledgeGraph, currentPaper])

  // 保存知识图谱到 Obsidian
  const handleSaveKnowledgeGraphToObsidian = useCallback(async () => {
    if (!knowledgeGraph || !currentPaper) return
    
    setIsSavingToObsidian(true)
    
    try {
      const result = await chrome.storage.sync.get(['settings'])
      const obsidianConfig = result.settings?.obsidian as ObsidianConfig | undefined
      
      if (!obsidianConfig?.enabled) {
        alert('❌ 请先在设置中启用 Obsidian 集成')
        setIsSavingToObsidian(false)
        return
      }
      
      const noteContent = formatKnowledgeGraphAsMarkdown(knowledgeGraph, currentPaper)
      const basePath = obsidianConfig.defaultPath || ''
      const notePath = `${basePath}/论文解读/知识图谱/${currentPaper.id}-${currentPaper.title.slice(0, 30)}`
      
      const client = new ObsidianClient(obsidianConfig)
      const saveResult = await client.saveNote(notePath, noteContent)
      
      if (saveResult.success) {
        alert(`✅ 知识图谱已保存到 Obsidian\n\n📁 路径: ${notePath}.md`)
      } else {
        alert(`❌ 保存失败: ${saveResult.error || '未知错误'}`)
      }
    } catch (e) {
      alert(`❌ 保存失败: ${(e as Error).message}`)
    }
    
    setIsSavingToObsidian(false)
  }, [knowledgeGraph, currentPaper])

  return (
    <div className="p-4 space-y-4">
      {/* Tab 切换 */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'tools' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          效率工具
        </button>
        <button
          onClick={() => setActiveTab('format')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'format' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          排版工具
        </button>
        <button
          onClick={() => setActiveTab('paper')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'paper' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
          }`}
        >
          📄 论文
        </button>
      </div>

      {activeTab === 'tools' && (
        <>
          {/* 效率工具 */}
          <div>
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <span className="w-1 h-3 bg-[#07C160] rounded-full"></span>
              效率工具
            </div>
            <div className="grid grid-cols-4 gap-3">
              {EFFICIENCY_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tool.color} flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                    {tool.icon}
                  </div>
                  <span className="text-[10px] text-gray-600 text-center leading-tight">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 特色功能 */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
              <span className="w-1 h-3 bg-[#07C160] rounded-full"></span>
              特色功能 (AI)
            </div>
            <div className="grid grid-cols-4 gap-3">
              {SPECIAL_FEATURES.map(feature => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature.id)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group disabled:opacity-50"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-110 transition-transform relative`}>
                    {isLoading && loadingTool === feature.id ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      feature.icon
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600 text-center leading-tight">{feature.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 加载提示 */}
          {isLoading && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></span>
                AI 正在处理中，请稍候...
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'format' && (
        <>
          {/* 一键排版 */}
          <div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-1 h-3 bg-[#07C160] rounded-full"></span>
              一键排版
            </div>
            {FORMAT_TEMPLATES.map(item => (
              <button
                key={item.name}
                onClick={() => applyTemplate(item.name, themeColor)}
                className="w-full p-3 mb-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#07C160] text-left flex items-center gap-3"
              >
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center text-white text-sm">{item.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-800">{item.name}</div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* 快捷操作 */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-1 h-3 bg-[#07C160] rounded-full"></span>
              快捷操作
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={clearFormat}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
              >
                🧹 清除格式
              </button>
              <button 
                onClick={addIndent}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
              >
                📐 首行缩进
              </button>
              <button 
                onClick={() => adjustLineHeight('2')}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
              >
                📏 行高 2.0
              </button>
              <button 
                onClick={() => adjustParagraphSpacing('20px')}
                className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
              >
                📄 段落间距
              </button>
            </div>
          </div>

          {/* 行高选项 */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <span className="w-1 h-3 bg-[#07C160] rounded-full"></span>
              行高选项
            </div>
            <div className="flex gap-2">
              {['1.5', '1.75', '2', '2.2', '2.5'].map(h => (
                <button
                  key={h}
                  onClick={() => adjustLineHeight(h)}
                  className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-[#07C160] hover:text-white"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 论文解读标签页 */}
      {activeTab === 'paper' && (
        <div className="space-y-4">
          {/* 页面状态检测 */}
          <div className={`p-3 rounded-lg ${isArxivPage() ? (isArxivHtmlPage() ? 'bg-green-50' : 'bg-blue-50') : 'bg-yellow-50'}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{isArxivPage() ? (isArxivHtmlPage() ? '📄' : '📋') : '⚠️'}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isArxivPage() ? (isArxivHtmlPage() ? 'text-green-700' : 'text-blue-700') : 'text-yellow-700'}`}>
                  {isArxivHtmlPage() ? 'HTML 论文页面 - 支持全部功能' : 
                   isArxivPage() ? `${getArxivPageType() === 'abstract' ? '摘要页' : getArxivPageType()} - 支持基础解读` : 
                   '请打开 arXiv.org 论文页面'}
                </p>
                {isArxivPage() && !isArxivHtmlPage() && (
                  <p className="text-xs text-blue-500 mt-0.5">
                    💡 访问 /html/ 页面可使用沉浸式翻译等高级功能
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleExtractHtmlPaper}
              disabled={!isArxivPage()}
              className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              📥 提取论文信息
            </button>
          </div>

          {/* 错误提示 */}
          {paperError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {paperError}
            </div>
          )}

          {/* 论文信息展示 */}
          {currentPaper && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{currentPaper.title}</h3>
              <div className="text-xs text-gray-500">
                <p>👥 {currentPaper.authors.slice(0, 3).join(', ')}{currentPaper.authors.length > 3 ? ` 等 ${currentPaper.authors.length} 人` : ''}</p>
                {currentPaper.categories.length > 0 && <p>📂 {currentPaper.categories.map(c => getCategoryName(c)).join(', ')}</p>}
                {currentPaper.publishedDate && <p>📅 {currentPaper.publishedDate}</p>}
                {paperSections.length > 0 && <p>📑 {paperSections.length} 个章节</p>}
              </div>
              
              {/* 摘要预览 */}
              {currentPaper.abstract && (
                <details className="text-xs">
                  <summary className="text-blue-600 cursor-pointer hover:text-blue-700">查看原文摘要</summary>
                  <p className="mt-2 text-gray-600 leading-relaxed">{currentPaper.abstract}</p>
                </details>
              )}
            </div>
          )}

          {/* 功能切换按钮 */}
          {currentPaper && (
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'interpret', icon: '🤖', label: '解读', color: 'purple' },
                { id: 'translate', icon: '🌐', label: '翻译', color: 'blue', htmlOnly: true },
                { id: 'summary', icon: '📝', label: '总结', color: 'green' },
                { id: 'mindmap', icon: '🧠', label: '脑图', color: 'orange' },
                { id: 'knowledge', icon: '🔗', label: '图谱', color: 'pink' }
              ].map(feat => (
                <button
                  key={feat.id}
                  onClick={() => setActiveFeature(feat.id as typeof activeFeature)}
                  disabled={feat.htmlOnly && !isArxivHtmlPage()}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFeature === feat.id 
                      ? `bg-${feat.color}-500 text-white` 
                      : `bg-gray-100 text-gray-600 hover:bg-gray-200`
                  } ${feat.htmlOnly && !isArxivHtmlPage() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={feat.htmlOnly && !isArxivHtmlPage() ? '需要 HTML 页面' : ''}
                >
                  {feat.icon} {feat.label}
                </button>
              ))}
            </div>
          )}

          {/* 功能面板 */}
          {currentPaper && activeFeature === 'interpret' && (
            <div className="space-y-3">
              <button
                onClick={handleInterpretPaper}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 transition-all"
              >
                {isLoading && loadingTool === 'paper-interpret' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    AI 正在解读...
                  </span>
                ) : (
                  '🤖 生成通俗解读'
                )}
              </button>
            </div>
          )}

          {/* 沉浸式翻译面板 */}
          {currentPaper && activeFeature === 'translate' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 mb-2">
                  🌐 沉浸式翻译会在每个段落下方显示中文翻译，方便双语对照阅读
                </p>
                {translationProgress && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-blue-600 mb-1">
                      <span>翻译进度</span>
                      <span>{translationProgress.current}/{translationProgress.total}</span>
                    </div>
                    <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleStartTranslation}
                    disabled={isLoading || !isArxivHtmlPage()}
                    className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {isLoading && loadingTool === 'translate' ? '翻译中...' : 
                     getTranslationStatus().active ? '⏸️ 暂停翻译' : '▶️ 开始翻译'}
                  </button>
                  <button
                    onClick={handleRemoveTranslation}
                    className="py-2 px-3 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                  >
                    🗑️ 清除
                  </button>
                </div>
                {getTranslationStatus().count > 0 && (
                  <p className="text-xs text-green-600 mt-2">✅ 已翻译 {getTranslationStatus().count} 个段落</p>
                )}
              </div>
            </div>
          )}

          {/* 论文总结面板 */}
          {currentPaper && activeFeature === 'summary' && (
            <div className="space-y-3">
              <button
                onClick={handleGenerateSummary}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium text-sm hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all"
              >
                {isLoading && loadingTool === 'summary' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    生成总结中...
                  </span>
                ) : (
                  '📝 生成论文总结'
                )}
              </button>
              
              {paperSummary && (
                <div className="p-3 bg-white rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
                  <div className="prose prose-sm text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {paperSummary}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paperSummary)
                      alert('✅ 总结已复制')
                    }}
                    className="mt-2 w-full py-1.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                  >
                    📋 复制总结
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 脑图面板 */}
          {currentPaper && activeFeature === 'mindmap' && (
            <div className="space-y-3">
              <button
                onClick={handleGenerateMindMap}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium text-sm hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all"
              >
                {isLoading && loadingTool === 'mindmap' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    生成脑图中...
                  </span>
                ) : (
                  '🧠 生成思维导图'
                )}
              </button>
              
              {mindMap && (
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">📊 思维导图结构</div>
                  <div className="max-h-60 overflow-y-auto">
                    <MindMapTree node={mindMap} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleCopyMindMap}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                    >
                      📋 复制 Mermaid
                    </button>
                    <button
                      onClick={() => {
                        const md = `# ${currentPaper.title}\n\n` + mindMap.children.map(c => renderMindMapAsMarkdown(c, 2)).join('')
                        navigator.clipboard.writeText(md)
                        alert('✅ Markdown 已复制')
                      }}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                    >
                      📄 复制 Markdown
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 知识图谱面板 */}
          {currentPaper && activeFeature === 'knowledge' && (
            <div className="space-y-3">
              <button
                onClick={handleGenerateKnowledgeGraph}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-medium text-sm hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all"
              >
                {isLoading && loadingTool === 'knowledge' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    提取知识图谱...
                  </span>
                ) : (
                  '🔗 提取知识图谱'
                )}
              </button>
              
              {knowledgeGraph && (
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">🔗 知识图谱 ({knowledgeGraph.nodes.length} 节点, {knowledgeGraph.edges.length} 关系)</div>
                  
                  {/* 节点列表 */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {['concept', 'method', 'result', 'application'].map(type => {
                      const nodes = knowledgeGraph.nodes.filter(n => n.type === type)
                      if (nodes.length === 0) return null
                      const typeInfo: Record<string, { icon: string; label: string; color: string }> = {
                        concept: { icon: '📚', label: '概念', color: 'blue' },
                        method: { icon: '🔧', label: '方法', color: 'green' },
                        result: { icon: '📊', label: '结果', color: 'yellow' },
                        application: { icon: '🌍', label: '应用', color: 'purple' }
                      }
                      const info = typeInfo[type]
                      return (
                        <div key={type}>
                          <div className="text-xs font-medium text-gray-600 mb-1">{info.icon} {info.label}</div>
                          <div className="flex flex-wrap gap-1">
                            {nodes.map(node => (
                              <span 
                                key={node.id} 
                                className={`px-2 py-0.5 bg-${info.color}-50 text-${info.color}-700 text-xs rounded`}
                                title={node.description}
                              >
                                {node.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* 关系预览 */}
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">查看关系 ({knowledgeGraph.edges.length})</summary>
                    <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                      {knowledgeGraph.edges.map((edge, i) => {
                        const source = knowledgeGraph.nodes.find(n => n.id === edge.source)
                        const target = knowledgeGraph.nodes.find(n => n.id === edge.target)
                        return (
                          <div key={i} className="text-xs text-gray-600">
                            {source?.label} → <span className="text-blue-600">{edge.relation}</span> → {target?.label}
                          </div>
                        )
                      })}
                    </div>
                  </details>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleCopyKnowledgeGraph}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                    >
                      📋 复制
                    </button>
                    <button
                      onClick={handleSaveKnowledgeGraphToObsidian}
                      disabled={isSavingToObsidian}
                      className="flex-1 py-1.5 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50"
                    >
                      {isSavingToObsidian ? '保存中...' : '💾 存到 Obsidian'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 解读结果展示 */}
          {interpretation && (
            <div className="space-y-3">
              {/* 一句话总结 */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">💡 一句话总结</div>
                <p className="text-sm font-medium text-gray-800">{interpretation.oneSentenceSummary}</p>
              </div>

              {/* 难度评级 */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">难度:</span>
                <span className="text-yellow-500">{'⭐'.repeat(interpretation.difficultyLevel)}{'☆'.repeat(5 - interpretation.difficultyLevel)}</span>
                <span className="text-xs text-gray-400">{getDifficultyDescription(interpretation.difficultyLevel)}</span>
              </div>

              {/* 通俗解读 */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">🎯 通俗解读（给普通人看的）</div>
                <p className="text-sm text-gray-700 leading-relaxed">{interpretation.laymansExplanation}</p>
              </div>

              {/* 核心贡献 */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">✨ 核心贡献</div>
                <ul className="space-y-1">
                  {interpretation.keyContributions.map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-500">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 研究背景和方法 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">🔍 背景</div>
                  <p className="text-xs text-gray-700">{interpretation.background}</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">🛠️ 方法</div>
                  <p className="text-xs text-gray-700">{interpretation.methodology}</p>
                </div>
              </div>

              {/* 主要发现 */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">📊 主要发现</div>
                <p className="text-sm text-gray-700">{interpretation.findings}</p>
              </div>

              {/* 实际应用 */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">🌍 实际应用</div>
                <div className="flex flex-wrap gap-1">
                  {interpretation.applications.map((app, i) => (
                    <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                      {app}
                    </span>
                  ))}
                </div>
              </div>

              {/* 术语表 */}
              {interpretation.glossary.length > 0 && (
                <details className="p-3 bg-white rounded-lg border border-gray-200">
                  <summary className="text-xs text-gray-500 cursor-pointer">📖 术语表 ({interpretation.glossary.length})</summary>
                  <div className="mt-2 space-y-1">
                    {interpretation.glossary.map((g, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-gray-700">{g.term}:</span>
                        <span className="text-gray-600 ml-1">{g.explanation}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCopyInterpretation}
                  className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  📋 复制解读
                </button>
                <button
                  onClick={handleSaveToObsidian}
                  disabled={isSavingToObsidian}
                  className="flex-1 py-2 px-3 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50 transition-colors"
                >
                  {isSavingToObsidian ? '保存中...' : '💾 存到 Obsidian'}
                </button>
              </div>

              {/* 原文链接 */}
              <div className="flex gap-2 text-xs">
                <a
                  href={interpretation.paper.arxivUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 text-center bg-gray-50 text-blue-600 rounded hover:bg-gray-100"
                >
                  🔗 arXiv 原文
                </a>
                <a
                  href={interpretation.paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 text-center bg-gray-50 text-blue-600 rounded hover:bg-gray-100"
                >
                  📄 下载 PDF
                </a>
              </div>
            </div>
          )}

          {/* 使用说明 */}
          {!currentPaper && !paperError && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">📚 论文解读功能</h4>
              <p className="text-xs text-gray-500 mb-3">
                让 AI 帮你用通俗易懂的语言解读学术论文，即使没有专业背景也能看懂！
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>1️⃣ 打开 <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">arxiv.org</a> 论文页面</p>
                <p>2️⃣ 点击「提取论文信息」</p>
                <p>3️⃣ 点击「AI 通俗解读」</p>
                <p>4️⃣ 保存到 Obsidian 或复制分享</p>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-600">
                💡 支持 arXiv 上的所有论文，包括 AI、机器学习、物理、数学等领域
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
