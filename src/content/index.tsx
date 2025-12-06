// 智编助手 - Content Script 入口
// 注入到微信公众平台页面

import './content.css'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import Sidebar from './Sidebar'

// 全局状态
let sidebarRoot: Root | null = null
let sidebarRef: { setIsOpen: (open: boolean) => void; setActiveTab: (tab: string) => void } | null = null

// 暴露给 Sidebar 组件的注册函数
;(window as unknown as { __SMARTEDIT_REGISTER__: typeof registerSidebar }).__SMARTEDIT_REGISTER__ = registerSidebar

function registerSidebar(ref: typeof sidebarRef) {
  sidebarRef = ref
}

if (!window.location.hostname.includes('mp.weixin.qq.com')) {
  console.log('智编助手: 非微信公众平台页面')
} else if ((window as unknown as { __SMARTEDIT_INJECTED__?: boolean }).__SMARTEDIT_INJECTED__) {
  console.log('智编助手: 已加载')
} else {
  (window as unknown as { __SMARTEDIT_INJECTED__: boolean }).__SMARTEDIT_INJECTED__ = true
  console.log('智编助手已加载')
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

  // 监听来自 popup 的消息
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
    }
    
    return true
  })
}
