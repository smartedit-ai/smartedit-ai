# 智编助手 - 配置文件
# SmartEdit AI Configuration
# 
# 使用说明：
# 1. 填写下方配置项的值（替换 YOUR_xxx 占位符）
# 2. 保存文件后，在设置中心点击"导入配置"
# 3. 选择此文件即可自动更新所有配置
#
# 注意：请妥善保管此文件，其中包含 API 密钥等敏感信息
# ============================================================

## 通用设置
# 主题色（十六进制颜色值）
themeColor: #07C160

# 显示浮动工具栏（true/false）
showFloatingToolbar: true

# 自动插入样式（true/false）
autoInsertStyle: true

# 显示选中文本工具栏（true/false）
showSelectionToolbar: true

## AI 配置
# AI 服务提供商（openai/deepseek/moonshot/aliyun/siliconflow/zhipu/custom）
aiProvider: openai

# API Key（必填）
apiKey: YOUR_API_KEY

# 自定义 API Base URL（可选，使用自定义服务商时填写）
customBaseUrl: 

# 自定义模型名称（可选）
customModel: 

## 热点搜索配置
# Tavily API Key（用于热点资讯搜索）
# 获取地址：https://tavily.com/
tavilyKey: YOUR_TAVILY_API_KEY

## 图片服务配置
# Unsplash Access Key（用于图片搜索）
# 获取地址：https://unsplash.com/developers
unsplashKey: YOUR_UNSPLASH_ACCESS_KEY

# Pixabay API Key（用于图片搜索）
# 获取地址：https://pixabay.com/api/docs/
pixabayKey: YOUR_PIXABAY_API_KEY

## 网络代理配置
# 启用代理（true/false）
proxyEnabled: false

# 代理类型（http/socks5/custom）
proxyType: http

# 代理地址（例如：http://127.0.0.1:7890）
proxyUrl: 

## Obsidian 集成配置
# 需要安装 Obsidian Local REST API 插件
# 插件地址：https://github.com/coddingtonbear/obsidian-local-rest-api

# 启用 Obsidian 集成（true/false）
obsidian_enabled: false

# Obsidian REST API 地址（默认：https://localhost:27124）
obsidian_apiUrl: https://localhost:27124

# Obsidian REST API Key（在 Obsidian 插件设置中获取）
obsidian_apiKey: YOUR_OBSIDIAN_API_KEY

# 默认保存路径（Vault 中的文件夹路径）
obsidian_defaultPath: 公众号

# 自动同步（true/false）
obsidian_autoSync: false

## RSS 订阅配置
# RSS 刷新间隔（分钟）
rssRefreshInterval: 30

# RSS 订阅源列表（JSON 格式）
# 格式：[{"id":"1","name":"名称","url":"RSS地址","category":"分类","enabled":true}]
rssFeeds: [{"id":"1","name":"少数派","url":"https://sspai.com/feed","category":"科技","enabled":true},{"id":"2","name":"36氪","url":"https://36kr.com/feed","category":"科技","enabled":false},{"id":"3","name":"虎嗅","url":"https://www.huxiu.com/rss/0.xml","category":"科技","enabled":false},{"id":"4","name":"知乎日报","url":"https://daily.zhihu.com/api/4/news/latest","category":"综合","enabled":false}]

# ============================================================
# 配置文件版本：1.1
# 生成时间：2025/12/9 16:41:33
