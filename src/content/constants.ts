// 样式模板数据
export const STYLE_TEMPLATES = {
  titles: [
    { name: '简约标题', preview: '━━ 标题 ━━', html: '<section style="text-align:center;margin:20px 0"><h2 style="display:inline-block;font-size:18px;font-weight:bold;color:#333;border-bottom:3px solid #07C160;padding-bottom:8px">标题文字</h2></section>' },
    { name: '左侧装饰', preview: '▌标题', html: '<section style="display:flex;align-items:center;margin:20px 0"><span style="width:4px;height:24px;background:#07C160;margin-right:12px;border-radius:2px"></span><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
    { name: '编号标题', preview: '① 标题', html: '<section style="display:flex;align-items:center;margin:20px 0"><span style="width:32px;height:32px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;margin-right:12px">01</span><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
    { name: '底色标题', preview: '█ 标题 █', html: '<section style="background:linear-gradient(135deg,#07C160 0%,#06AD56 100%);padding:12px 20px;border-radius:8px;margin:20px 0"><h2 style="font-size:18px;font-weight:bold;color:#fff;margin:0;text-align:center">标题文字</h2></section>' },
    { name: '双线标题', preview: '═══ 标题 ═══', html: '<section style="text-align:center;margin:20px 0"><div style="display:flex;align-items:center;justify-content:center;gap:12px"><span style="flex:1;height:2px;background:linear-gradient(90deg,transparent,#07C160)"></span><h2 style="font-size:18px;font-weight:bold;color:#07C160;margin:0;white-space:nowrap">标题文字</h2><span style="flex:1;height:2px;background:linear-gradient(90deg,#07C160,transparent)"></span></div></section>' },
    { name: '引用标题', preview: '『 标题 』', html: '<section style="border-left:4px solid #07C160;padding-left:16px;margin:20px 0"><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
  ],
  content: [
    { name: '引用段落', preview: '❝ 引用 ❞', html: '<blockquote style="background:#f8f9fa;border-left:4px solid #07C160;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><p style="font-size:15px;line-height:1.8;color:#666;margin:0;font-style:italic">这是一段引用文字，适合用于名人名言、重要观点。</p></blockquote>' },
    { name: '重点提示', preview: '💡 提示', html: '<section style="background:linear-gradient(135deg,#fff9e6 0%,#fff3cd 100%);border:1px solid #ffc107;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#856404;margin:0"><strong>💡 提示：</strong>这是一段重点提示内容。</p></section>' },
    { name: '警告提示', preview: '⚠️ 警告', html: '<section style="background:linear-gradient(135deg,#ffe6e6 0%,#ffcccc 100%);border:1px solid #dc3545;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#721c24;margin:0"><strong>⚠️ 注意：</strong>这是一段警告内容。</p></section>' },
    { name: '成功提示', preview: '✅ 成功', html: '<section style="background:linear-gradient(135deg,#e6ffed 0%,#c3f7d5 100%);border:1px solid #28a745;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#155724;margin:0"><strong>✅ 成功：</strong>操作已完成。</p></section>' },
  ],
  dividers: [
    { name: '简约线条', preview: '────────', html: '<section style="text-align:center;margin:30px 0"><hr style="border:none;border-top:1px solid #e8e8e8;margin:0"></section>' },
    { name: '渐变线条', preview: '━━━━━━━━', html: '<section style="text-align:center;margin:30px 0"><div style="height:2px;background:linear-gradient(90deg,transparent,#07C160,transparent)"></div></section>' },
    { name: '圆点分割', preview: '● ● ●', html: '<section style="text-align:center;margin:30px 0;display:flex;align-items:center;justify-content:center;gap:8px"><span style="width:6px;height:6px;background:#07C160;border-radius:50%"></span><span style="width:6px;height:6px;background:#07C160;border-radius:50%;opacity:0.6"></span><span style="width:6px;height:6px;background:#07C160;border-radius:50%;opacity:0.3"></span></section>' },
    { name: '星星分割', preview: '✦ ✦ ✦', html: '<section style="text-align:center;margin:30px 0;font-size:14px;color:#07C160">✦ ✦ ✦</section>' },
    { name: 'END分割', preview: '— END —', html: '<section style="display:flex;align-items:center;margin:30px 0"><span style="flex:1;height:1px;background:#e8e8e8"></span><span style="padding:0 20px;font-size:13px;color:#999">END</span><span style="flex:1;height:1px;background:#e8e8e8"></span></section>' },
  ],
  cards: [
    { name: '简约卡片', preview: '📋 卡片', html: '<section style="background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:20px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,0.05)"><h3 style="font-size:16px;font-weight:bold;color:#333;margin:0 0 12px 0">卡片标题</h3><p style="font-size:14px;line-height:1.8;color:#666;margin:0">这是卡片内容区域。</p></section>' },
    { name: '数据卡片', preview: '📊 数据', html: '<section style="display:flex;gap:16px;margin:20px 0"><div style="flex:1;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:20px;text-align:center"><div style="font-size:32px;font-weight:bold;color:#fff">99%</div><div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">满意度</div></div><div style="flex:1;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:12px;padding:20px;text-align:center"><div style="font-size:32px;font-weight:bold;color:#fff">10W+</div><div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">阅读量</div></div></section>' },
  ],
  lists: [
    { name: '勾选列表', preview: '✓ 列表', html: '<section style="margin:20px 0"><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第一条列表内容</span></div><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第二条列表内容</span></div><div style="display:flex;align-items:flex-start"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第三条列表内容</span></div></section>' },
    { name: '编号列表', preview: '① ② ③', html: '<section style="margin:20px 0"><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="min-width:24px;height:24px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;margin-right:12px">1</span><span style="font-size:15px;color:#333;line-height:1.6;padding-top:2px">第一条内容</span></div><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="min-width:24px;height:24px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;margin-right:12px">2</span><span style="font-size:15px;color:#333;line-height:1.6;padding-top:2px">第二条内容</span></div></section>' },
  ],
  follow: [
    { name: '关注引导', preview: '👆 关注', html: '<section style="text-align:center;padding:30px 20px;margin:30px 0;background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border-radius:12px"><p style="font-size:14px;color:#666;margin:0 0 12px 0">觉得有用？点个关注吧 👇</p><p style="font-size:16px;font-weight:bold;color:#07C160;margin:0">长按识别二维码关注我们</p></section>' },
    { name: '底部引导', preview: '👍 点赞', html: '<section style="background:linear-gradient(135deg,#07C160 0%,#06AD56 100%);border-radius:12px;padding:24px;margin:30px 0;text-align:center"><p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px 0">如果觉得文章对你有帮助</p><p style="font-size:18px;font-weight:bold;color:#fff;margin:0">👍 点赞 | ⭐ 收藏 | 🔄 转发</p></section>' },
  ],
}

// 背景模板
export const BG_TEMPLATES = [
  { name: '纯白', color: '#ffffff' },
  { name: '米黄', color: '#faf8f5' },
  { name: '浅灰', color: '#f5f5f5' },
  { name: '浅绿', color: '#f0fff4' },
  { name: '浅蓝', color: '#f0f9ff' },
  { name: '浅粉', color: '#fff5f5' },
]

// 渐变背景
export const GRADIENT_TEMPLATES = [
  { name: '清新绿', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: '天空蓝', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: '暖阳橙', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '日落红', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: '深海蓝', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '星空紫', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: '森林绿', gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { name: '极光', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
]

// 主题色
export const THEME_COLORS = ['#07C160', '#1890ff', '#722ed1', '#eb2f96', '#fa541c', '#faad14', '#52c41a', '#13c2c2', '#2f54eb', '#333333']

// 导航菜单
export const NAV_ITEMS = [
  { id: 'template', icon: '📝', label: '排版' },
  { id: 'markdown', icon: '📋', label: 'MD' },
  { id: 'ai', icon: '✨', label: '写作' },
  { id: 'rss', icon: '📰', label: 'RSS' },
  { id: 'image', icon: '🖼️', label: '配图' },
  { id: 'tool', icon: '🔧', label: '工具' },
]

// 样式分类标签
export const STYLE_CATEGORIES = [
  { id: 'titles', label: '标题' },
  { id: 'content', label: '正文' },
  { id: 'dividers', label: '分割' },
  { id: 'cards', label: '卡片' },
  { id: 'lists', label: '列表' },
  { id: 'follow', label: '引导' },
]

// AI 提供商配置
export const AI_PROVIDERS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-3.5-turbo' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  aliyun: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus' },
  siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', defaultModel: 'Qwen/Qwen2.5-7B-Instruct' },
  moonshot: { baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash' },
  custom: { baseUrl: '', defaultModel: '' }
}

// 排版模板
export const FORMAT_TEMPLATES = [
  { name: '简约清新', desc: '适合日常分享', icon: '🌿' },
  { name: '商务专业', desc: '适合职场内容', icon: '💼' },
  { name: '文艺优雅', desc: '适合情感文章', icon: '🎨' },
  { name: '科技现代', desc: '适合科技资讯', icon: '🚀' },
]

// 图片搜索快捷标签
export const IMAGE_SEARCH_TAGS = ['风景', '科技', '商务', '自然', '城市', '美食', '办公', '旅行', '健康', '教育']

// AI 写作模板
export const WRITING_TEMPLATES = [
  {
    id: 'hot-topic',
    name: '热点解读',
    icon: '🔥',
    desc: '追踪热点，深度解读',
    prompt: '请根据以下热点话题，撰写一篇深度解读文章，包含事件背景、多角度分析、影响评估和个人观点：'
  },
  {
    id: 'tutorial',
    name: '教程干货',
    icon: '📚',
    desc: '步骤清晰，实操性强',
    prompt: '请根据以下主题，撰写一篇详细的教程文章，要求步骤清晰、配图说明、注意事项完整：'
  },
  {
    id: 'story',
    name: '故事叙述',
    icon: '📖',
    desc: '情感共鸣，引人入胜',
    prompt: '请根据以下主题，撰写一篇故事性文章，要求有人物、情节、冲突和感悟，引起读者情感共鸣：'
  },
  {
    id: 'list',
    name: '清单盘点',
    icon: '📋',
    desc: '条理清晰，易于阅读',
    prompt: '请根据以下主题，撰写一篇清单式文章，列出5-10个要点，每个要点有标题和详细说明：'
  },
  {
    id: 'review',
    name: '测评推荐',
    icon: '⭐',
    desc: '客观评测，真实推荐',
    prompt: '请根据以下产品/服务，撰写一篇客观的测评文章，包含优缺点分析、使用体验和购买建议：'
  },
  {
    id: 'interview',
    name: '访谈对话',
    icon: '🎤',
    desc: '问答形式，观点鲜明',
    prompt: '请根据以下主题，撰写一篇访谈式文章，以问答形式展开，观点鲜明，内容深入：'
  },
]

// 文章风格选项
export const WRITING_STYLES = [
  { id: 'professional', name: '专业严谨', desc: '适合行业分析' },
  { id: 'casual', name: '轻松活泼', desc: '适合生活分享' },
  { id: 'emotional', name: '情感细腻', desc: '适合故事叙述' },
  { id: 'humorous', name: '幽默风趣', desc: '适合娱乐内容' },
]

// 文章长度选项
export const ARTICLE_LENGTHS = [
  { id: 'short', name: '短文', words: '500-800字' },
  { id: 'medium', name: '中等', words: '1000-1500字' },
  { id: 'long', name: '长文', words: '2000-3000字' },
]
