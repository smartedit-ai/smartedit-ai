// 智编助手 - Content Script 入口
// 注入到微信公众平台页面

import './content.css'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import Sidebar from './Sidebar'
import { aiRequest, getEditor } from './utils'
import { addCollection } from '../lib/storage'

// 敏感词库
const SENSITIVE_WORDS: Record<string, string[]> = {
  illegal: ['赌博', '色情', '暴力', '毒品', '枪支', '诈骗', '传销', '洗钱', '走私', '黄赌毒', '博彩', '赌场', '六合彩', '私彩'],
  political: ['政变', '暴动', '分裂', '颠覆', '反动', '邪教', '法轮'],
  medical: ['包治百病', '根治', '祖传秘方', '无效退款', '药到病除', '特效药', '神药', '癌症克星', '糖尿病克星', '一针见效', '立竿见影', '无副作用', '纯天然无害'],
  exaggerate: ['第一', '最好', '最强', '绝对', '100%', '永久', '万能', '唯一', '首选', '顶级', '极致', '史上最', '全网最', '独家', '限时', '仅此一次', '错过不再'],
  finance: ['稳赚不赔', '高额回报', '零风险', '内幕消息', '暴富', '躺赚', '日入过万', '月入百万', '财务自由', '一夜暴富', '稳定收益', '保本保息', '翻倍', '原始股'],
  privacy: ['身份证号', '银行卡号', '手机号码', '家庭住址', '个人隐私'],
  copyright: ['盗版', '破解版', '免费下载', '资源分享', '网盘链接', '百度云', '迅雷下载'],
  vulgar: ['屌丝', '逼格', '装逼', '牛逼', '傻逼', '他妈的', '卧槽'],
}

// 全局状态
let sidebarRoot: Root | null = null
let sidebarRef: { setIsOpen: (open: boolean) => void; setActiveTab: (tab: string) => void } | null = null

// 暴露给 Sidebar 组件的注册函数
;(window as unknown as { __SMARTEDIT_REGISTER__: typeof registerSidebar }).__SMARTEDIT_REGISTER__ = registerSidebar

function registerSidebar(ref: typeof sidebarRef) {
  sidebarRef = ref
}

// 排除特殊页面（扩展页面、浏览器内置页面等）
const isExcludedPage = () => {
  const url = window.location.href
  return url.startsWith('chrome://') || 
         url.startsWith('chrome-extension://') || 
         url.startsWith('edge://') ||
         url.startsWith('about:') ||
         url.startsWith('moz-extension://') ||
         url === 'about:blank'
}

if (isExcludedPage()) {
  console.log('智编助手: 跳过特殊页面')
} else if ((window as unknown as { __SMARTEDIT_INJECTED__?: boolean }).__SMARTEDIT_INJECTED__) {
  console.log('智编助手: 已加载')
} else {
  (window as unknown as { __SMARTEDIT_INJECTED__: boolean }).__SMARTEDIT_INJECTED__ = true
  console.log('智编助手已加载 -', window.location.hostname)
  init()
}

function init() {
  // 创建侧边栏容器
  const container = document.createElement('div')
  container.id = 'smartedit-root'
  document.body.appendChild(container)

  // 渲染 React 组件
  sidebarRoot = createRoot(container)
  sidebarRoot.render(React.createElement(Sidebar))

  // 监听来自 popup 和 background 的消息
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('收到消息:', message)
    
    if (message.type === 'TOGGLE_SIDEBAR') {
      if (sidebarRef) {
        sidebarRef.setIsOpen(true)
      }
      sendResponse({ success: true })
    } else if (message.type === 'OPEN_TAB') {
      if (sidebarRef) {
        sidebarRef.setIsOpen(true)
        sidebarRef.setActiveTab(message.tab || 'styles')
      }
      sendResponse({ success: true })
    } else if (message.type === 'CONTEXT_MENU_ACTION') {
      // 处理右键菜单操作
      handleContextMenuAction(message.action, message.text, message.linkUrl, message.srcUrl)
      sendResponse({ success: true })
    }
    
    return true
  })
}

// 处理右键菜单操作
async function handleContextMenuAction(action: string, text: string, linkUrl?: string, srcUrl?: string) {
  const editor = getEditor()
  
  switch (action) {
    // AI 写作功能
    case 'rewrite':
      if (!text) { alert('请先选中文字'); return }
      showLoading('AI 润色中...')
      try {
        const result = await aiRequest('rewrite', text)
        if (result) {
          const use = confirm(`✨ AI 润色结果\n\n${result}\n\n是否替换选中文字？`)
          if (use) {
            document.execCommand('insertText', false, result)
          }
        }
      } catch { alert('AI 润色失败') }
      hideLoading()
      break

    case 'expand':
      if (!text) { alert('请先选中文字'); return }
      showLoading('AI 扩写中...')
      try {
        const result = await aiRequest('expand', text)
        if (result) {
          const use = confirm(`📝 AI 扩写结果\n\n${result.slice(0, 500)}${result.length > 500 ? '...' : ''}\n\n是否替换选中文字？`)
          if (use) {
            document.execCommand('insertText', false, result)
          }
        }
      } catch { alert('AI 扩写失败') }
      hideLoading()
      break

    case 'summarize':
      if (!text) { alert('请先选中文字'); return }
      showLoading('AI 缩写中...')
      try {
        const result = await aiRequest('summarize', text)
        if (result) {
          const use = confirm(`📋 AI 缩写结果\n\n${result}\n\n是否替换选中文字？`)
          if (use) {
            document.execCommand('insertText', false, result)
          }
        }
      } catch { alert('AI 缩写失败') }
      hideLoading()
      break

    case 'translate':
      if (!text) { alert('请先选中文字'); return }
      const isChinese = /[\u4e00-\u9fa5]/.test(text)
      const direction = isChinese ? '中译英' : '英译中'
      showLoading(`AI ${direction}中...`)
      try {
        const result = await aiRequest('translate', `${direction}：${text}`)
        if (result) {
          const use = confirm(`🌐 AI 翻译 (${direction})\n\n译文：${result}\n\n点击「确定」替换，「取消」复制到剪贴板`)
          if (use) {
            document.execCommand('insertText', false, result)
          } else {
            navigator.clipboard.writeText(result)
            alert('译文已复制！')
          }
        }
      } catch { alert('AI 翻译失败') }
      hideLoading()
      break

    case 'style-rewrite':
      if (!text) { alert('请先选中文字'); return }
      const styles = ['正式商务', '轻松活泼', '幽默风趣', '文艺抒情', '简洁精炼']
      const styleChoice = prompt(`选择改写风格（输入数字）：\n\n1. 正式商务\n2. 轻松活泼\n3. 幽默风趣\n4. 文艺抒情\n5. 简洁精炼`)
      if (!styleChoice || !['1', '2', '3', '4', '5'].includes(styleChoice)) return
      const targetStyle = styles[parseInt(styleChoice) - 1]
      showLoading(`改写为${targetStyle}风格...`)
      try {
        const result = await aiRequest('style-rewrite', `将以下内容改写为${targetStyle}风格：\n\n${text}`)
        if (result) {
          const use = confirm(`🔄 ${targetStyle}风格改写\n\n${result}\n\n是否替换？`)
          if (use) {
            document.execCommand('insertText', false, result)
          }
        }
      } catch { alert('AI 改写失败') }
      hideLoading()
      break

    case 'continue':
      if (!text) { alert('请先选中文字'); return }
      showLoading('AI 续写中...')
      try {
        const result = await aiRequest('continue', text)
        if (result && editor) {
          const use = confirm(`➡️ AI 续写\n\n${result.slice(0, 500)}${result.length > 500 ? '...' : ''}\n\n是否追加到选中文字后？`)
          if (use) {
            document.execCommand('insertText', false, text + result)
          }
        }
      } catch { alert('AI 续写失败') }
      hideLoading()
      break

    // 标题工具
    case 'title-score':
      if (!text) { alert('请先选中标题文字'); return }
      showLoading('AI 评分中...')
      try {
        const result = await aiRequest('title-score', text)
        if (result) {
          alert(`📊 标题评分\n\n${result}`)
        }
      } catch { alert('AI 评分失败') }
      hideLoading()
      break

    case 'generate-title':
      if (!text) { alert('请先选中文章内容'); return }
      showLoading('生成标题中...')
      try {
        const result = await aiRequest('generate-title', text)
        if (result) {
          alert(`📝 AI 生成标题\n\n${result}`)
        }
      } catch { alert('标题生成失败') }
      hideLoading()
      break

    // 内容工具
    case 'summary':
      if (!text) { alert('请先选中文字'); return }
      showLoading('生成摘要中...')
      try {
        const result = await aiRequest('summarize', text)
        if (result) {
          const use = confirm(`📝 AI 摘要\n\n${result}\n\n是否插入到编辑器？`)
          if (use && editor) {
            const summaryHtml = `<blockquote style="background:#f8f9fa;border-left:4px solid #07C160;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><p style="font-size:14px;line-height:1.8;color:#666;margin:0"><strong>📝 摘要：</strong>${result}</p></blockquote>`
            editor.innerHTML = summaryHtml + editor.innerHTML
          }
        }
      } catch { alert('摘要生成失败') }
      hideLoading()
      break

    case 'outline':
      if (!text) { alert('请先选中主题或关键词'); return }
      showLoading('生成大纲中...')
      try {
        const result = await aiRequest('outline', text)
        if (result) {
          alert(`📋 AI 大纲\n\n${result}`)
        }
      } catch { alert('大纲生成失败') }
      hideLoading()
      break

    case 'violation-check':
      if (!text) { alert('请先选中要检测的文字'); return }
      const results: { category: string; words: string[] }[] = []
      Object.entries(SENSITIVE_WORDS).forEach(([category, words]) => {
        const found = words.filter(w => text.includes(w))
        if (found.length > 0) {
          const categoryNames: Record<string, string> = {
            illegal: '🚫 违法违规', political: '⚠️ 政治敏感', medical: '💊 医疗夸大',
            exaggerate: '📢 绝对化用语', finance: '💰 金融风险', privacy: '🔒 隐私信息',
            copyright: '©️ 版权风险', vulgar: '🤬 低俗用语',
          }
          results.push({ category: categoryNames[category] || category, words: found })
        }
      })
      if (results.length > 0) {
        const report = results.map(r => `【${r.category}】${r.words.join('、')}`).join('\n')
        alert(`⚠️ 违规检测报告\n\n${report}`)
      } else {
        alert('✅ 未检测到敏感词')
      }
      break

    // 收藏工具
    case 'collect-text':
      if (!text) { alert('请先选中文字'); return }
      try {
        await addCollection({
          type: 'quote',
          title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
          content: text,
          source: document.title,
          sourceUrl: window.location.href,
          tags: ['右键收藏']
        })
        alert('✅ 已收藏到素材库')
      } catch { alert('收藏失败') }
      break

    case 'collect-image':
      if (!srcUrl) { alert('无法获取图片地址'); return }
      try {
        await addCollection({
          type: 'image',
          title: '收藏图片',
          content: srcUrl,
          source: document.title,
          sourceUrl: window.location.href,
          tags: ['图片', '右键收藏']
        })
        alert('✅ 图片已收藏')
      } catch { alert('收藏失败') }
      break

    case 'collect-link':
      if (!linkUrl) { alert('无法获取链接'); return }
      try {
        await addCollection({
          type: 'article',
          title: text || linkUrl,
          content: linkUrl,
          source: document.title,
          sourceUrl: linkUrl,
          tags: ['链接', '右键收藏']
        })
        alert('✅ 链接已收藏')
      } catch { alert('收藏失败') }
      break

    // 快捷操作
    case 'copy-md':
      if (!text) { alert('请先选中文字'); return }
      // 简单转换为 Markdown
      const md = text.replace(/<h(\d)>/g, (_, n) => '#'.repeat(parseInt(n)) + ' ')
        .replace(/<\/h\d>/g, '\n')
        .replace(/<p>/g, '\n').replace(/<\/p>/g, '')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '')
      navigator.clipboard.writeText(md)
      alert('✅ 已复制为 Markdown')
      break

    case 'word-count':
      if (!text) { alert('请先选中文字'); return }
      const charCount = text.replace(/\s/g, '').length
      const wordCount = text.trim().split(/\s+/).filter(w => w).length
      const readTime = Math.ceil(charCount / 500)
      alert(`📊 字数统计\n\n字符数：${charCount}\n词数：${wordCount}\n预计阅读：${readTime} 分钟`)
      break

    case 'gen-qrcode':
      const qrText = text || linkUrl
      if (!qrText) { alert('请先选中文字或链接'); return }
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`
      if (editor) {
        editor.innerHTML += `<p style="text-align:center"><img src="${qrUrl}" alt="二维码" style="max-width:200px"></p>`
        alert('✅ 二维码已插入编辑器')
      } else {
        window.open(qrUrl, '_blank')
      }
      break

    default:
      console.log('未处理的右键菜单操作:', action)
  }
}

// 显示加载提示
function showLoading(message: string) {
  let overlay = document.getElementById('smartedit-loading')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'smartedit-loading'
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999'
    document.body.appendChild(overlay)
  }
  overlay.innerHTML = `<div style="background:white;padding:24px 40px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.2);display:flex;align-items:center;gap:12px">
    <div style="width:24px;height:24px;border:3px solid #e5e5e5;border-top-color:#07C160;border-radius:50%;animation:spin 1s linear infinite"></div>
    <span style="font-size:14px;color:#333">${message}</span>
  </div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`
  overlay.style.display = 'flex'
}

// 隐藏加载提示
function hideLoading() {
  const overlay = document.getElementById('smartedit-loading')
  if (overlay) {
    overlay.style.display = 'none'
  }
}
