# 智编助手 SmartEdit AI

<p align="center">
  <img src="assets/icons/icon128.png" alt="智编助手" width="128" height="128">
</p>

<p align="center">
  <strong>微信公众号编辑器增强工具</strong><br>
  AI 写作 · 样式库 · 一键排版 · 配图中心
</p>

---

## ✨ 功能特性

### 🎨 超级编辑器
- **侧边栏样式库** - 丰富的标题、正文、分割线、卡片、列表样式，点击即用
- **一键换色系统** - 10+ 预设主题色，支持自定义颜色，一键替换全文配色
- **全文一键排版** - 4 套精选模板（简约清新/商务专业/文艺优雅/科技现代）
- **快捷格式工具** - 清除格式、首行缩进、调整行高

### 🤖 AI 创作引擎
- **AI 标题生成** - 基于文章内容，一键生成 10 个高点击率标题
- **AI 标题评分** - 对标题进行 0-100 分评分，提供优化建议
- **AI 划词改写** - 选中文字即可润色、扩写、缩写、换语气
- **AI 写作助手** - 输入主题，生成文章大纲或完整文章

### 🖼️ 配图中心
- **Unsplash 集成** - 海量高质量免费图片
- **Pixabay 集成** - 丰富的免版权图片素材
- **一键插入** - 搜索图片后直接插入编辑器

### 🛠️ 便捷工具
- **悬浮工具栏** - 页面左侧快捷入口
- **划词工具栏** - 选中文字自动弹出 AI 工具
- **右键菜单** - 快速调用 AI 改写功能

---

## 📦 安装方法

### 开发者模式安装

1. 下载或克隆本项目到本地
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目文件夹

### 图标生成（可选）

如果图标显示异常，请运行：

```bash
npm install sharp
node scripts/generate-icons.js
```

---

## ⚙️ 配置说明

### AI 服务配置

1. 点击扩展图标，选择「设置」
2. 在「AI 配置」中选择服务提供商：
   - **OpenAI** - 需要 OpenAI API Key
   - **智谱 AI** - 需要智谱 API Key
3. 输入对应的 API Key
4. 点击「测试连接」验证配置

### 图片服务配置

1. **Unsplash**
   - 访问 [Unsplash Developers](https://unsplash.com/developers)
   - 创建应用获取 Access Key

2. **Pixabay**
   - 访问 [Pixabay API](https://pixabay.com/api/docs/)
   - 注册获取 API Key

---

## 🚀 使用指南

### 基本使用

1. 打开 [微信公众平台](https://mp.weixin.qq.com)
2. 进入图文编辑页面
3. 页面左侧会出现悬浮工具栏
4. 点击工具栏按钮打开侧边栏

### 插入样式

1. 在侧边栏「样式库」中浏览样式
2. 点击样式即可插入到编辑器光标位置
3. 使用「一键换色」修改主题色

### AI 写作

1. 切换到「AI 写作」标签
2. 粘贴文章内容，点击「生成标题」
3. 选中生成的标题即可复制使用

### 划词改写

1. 在编辑器中选中一段文字
2. 弹出的工具栏中选择操作：
   - 润色 - 优化文字表达
   - 扩写 - 增加内容细节
   - 缩写 - 精简内容
   - 换语气 - 改变表达风格

---

## 📁 项目结构

```
EditorHelper/
├── manifest.json          # 扩展配置文件
├── background/
│   └── background.js      # 后台服务脚本
├── content/
│   ├── content.js         # 内容脚本
│   └── content.css        # 内容样式
├── popup/
│   ├── popup.html         # 弹出页面
│   ├── popup.css          # 弹出样式
│   └── popup.js           # 弹出脚本
├── options/
│   ├── options.html       # 设置页面
│   ├── options.css        # 设置样式
│   └── options.js         # 设置脚本
├── assets/
│   └── icons/             # 扩展图标
└── scripts/
    └── generate-icons.js  # 图标生成脚本
```

---

## 🔧 技术栈

- **扩展标准**: Chrome Manifest V3
- **前端**: 原生 JavaScript + CSS
- **AI 接口**: OpenAI API / 智谱 AI API
- **图片服务**: Unsplash API / Pixabay API

---

## 📝 更新日志

### v1.0.0 (2024-01)
- 🎉 首次发布
- ✨ 样式库功能
- ✨ AI 标题生成
- ✨ AI 划词改写
- ✨ 配图中心
- ✨ 一键排版

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 💬 联系我们

- 问题反馈: [GitHub Issues](https://github.com/smartedit/issues)
- 邮箱: support@smartedit.ai

---

<p align="center">
  Made with ❤️ for WeChat Official Account Creators
</p>
