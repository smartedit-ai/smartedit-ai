# 右侧智能助手 - Side Panel 使用指南

## 功能说明

右侧智能助手使用了 Chrome 浏览器原生的 **Side Panel API**，实现了类似开发者工具的独立侧边面板效果。

### 与传统浮层的区别

- ✅ **独立区域**：右侧是完全独立的浏览器面板，不是浮动在页面上的遮罩
- ✅ **原生体验**：使用浏览器原生 API，性能更好，体验更流畅
- ✅ **自动布局**：浏览器自动调整页面宽度，无需手动处理推移效果
- ✅ **持久化**：面板状态由浏览器管理，切换标签页时保持打开状态

## 使用方式

### 1. 通过扩展弹窗打开
1. 点击浏览器工具栏的扩展图标
2. 点击"右侧助手"按钮
3. 右侧会打开独立的侧边面板

### 2. 通过右键菜单打开
1. 在任意页面右键
2. 选择"智编助手" → "🎯 打开右侧助手"
3. 右侧会打开独立的侧边面板

## 功能模块

### 🔧 快捷工具
- 字数统计
- 复制链接/标题
- 生成二维码
- 页面翻译
- 截图工具（开发中）

### 📝 快速笔记
- 随时记录想法
- 自动保存到浏览器存储
- 导出为文本文件
- 字符计数

### ✨ AI 助手
- 文本总结
- 中英互译
- 内容润色
- 文本扩写
- 支持使用选中文字

### 📄 页面信息
- 页面元数据（标题、URL、描述等）
- 统计信息（字符数、图片数、链接数）
- 一键复制功能

## 技术实现

### Chrome Side Panel API
```javascript
// 打开侧边面板
chrome.sidePanel.open({ windowId: windowId })
```

### manifest.json 配置
```json
{
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "src/sidepanel/index.html"
  }
}
```

### 项目结构
```
src/sidepanel/
├── index.html          # 侧边面板 HTML 入口
├── index.tsx           # React 入口
├── sidepanel.css       # 样式文件
└── SidePanel.tsx       # 主组件
```

## 浏览器兼容性

- ✅ Chrome 114+
- ✅ Edge 114+
- ❌ Firefox（不支持 Side Panel API）
- ❌ Safari（不支持 Side Panel API）

## 开发说明

### 构建
```bash
npm run dev    # 开发模式
npm run build  # 生产构建
```

### 调试
1. 打开侧边面板
2. 在面板内右键 → 检查
3. 会打开独立的开发者工具窗口

## 注意事项

1. **首次使用**：需要 Chrome 114 或更高版本
2. **权限要求**：需要 `sidePanel` 权限
3. **状态管理**：侧边面板是独立的页面，不能直接访问 content script 的状态
4. **通信方式**：通过 `chrome.runtime.sendMessage` 与 background 和 content script 通信

## 后续优化

- [ ] 添加更多快捷工具
- [ ] 支持自定义面板宽度
- [ ] 添加主题切换功能
- [ ] 优化 AI 功能的响应速度
- [ ] 添加数据同步功能
