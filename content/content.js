// 智编助手 - Content Script (Part 1)
// 在微信公众平台页面注入侧边栏和功能

(function() {
  'use strict';

  if (!window.location.hostname.includes('mp.weixin.qq.com')) return;
  if (window.__SMARTEDIT_INJECTED__) return;
  window.__SMARTEDIT_INJECTED__ = true;

  console.log('智编助手已加载');

  // 样式库数据
  const STYLES = {
    titles: [
      { name: '简约标题', html: '<section style="text-align:center;margin:20px 0"><h2 style="display:inline-block;font-size:18px;font-weight:bold;color:#333;border-bottom:3px solid #07C160;padding-bottom:8px">标题文字</h2></section>' },
      { name: '左侧装饰', html: '<section style="display:flex;align-items:center;margin:20px 0"><span style="width:4px;height:24px;background:#07C160;margin-right:12px;border-radius:2px"></span><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
      { name: '编号标题', html: '<section style="display:flex;align-items:center;margin:20px 0"><span style="width:32px;height:32px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;margin-right:12px">01</span><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0">标题文字</h2></section>' },
      { name: '底色标题', html: '<section style="background:linear-gradient(135deg,#07C160 0%,#06AD56 100%);padding:12px 20px;border-radius:8px;margin:20px 0"><h2 style="font-size:18px;font-weight:bold;color:#fff;margin:0;text-align:center">标题文字</h2></section>' },
      { name: '引用标题', html: '<section style="border-left:4px solid #07C160;padding-left:16px;margin:20px 0"><h2 style="font-size:18px;font-weight:bold;color:#333;margin:0 0 4px 0">标题文字</h2><p style="font-size:13px;color:#999;margin:0">副标题描述</p></section>' },
      { name: '居中圆角', html: '<section style="text-align:center;margin:20px 0"><span style="display:inline-block;background:#07C160;color:#fff;padding:10px 30px;border-radius:25px;font-size:16px;font-weight:bold">标题文字</span></section>' }
    ],
    paragraphs: [
      { name: '首字下沉', html: '<p style="font-size:15px;line-height:2;color:#333;text-align:justify"><span style="float:left;font-size:48px;line-height:1;font-weight:bold;color:#07C160;margin-right:8px">这</span>是一段示例文字，首字下沉效果让文章开头更加醒目。</p>' },
      { name: '引用段落', html: '<blockquote style="background:#f8f9fa;border-left:4px solid #07C160;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0"><p style="font-size:15px;line-height:1.8;color:#666;margin:0;font-style:italic">这是一段引用文字，适合用于名人名言、重要观点。</p></blockquote>' },
      { name: '重点提示', html: '<section style="background:linear-gradient(135deg,#fff9e6 0%,#fff3cd 100%);border:1px solid #ffc107;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#856404;margin:0"><strong>💡 提示：</strong>这是一段重点提示内容。</p></section>' },
      { name: '注意警告', html: '<section style="background:linear-gradient(135deg,#ffe6e6 0%,#ffcccc 100%);border:1px solid #dc3545;padding:16px 20px;border-radius:8px;margin:20px 0"><p style="font-size:14px;line-height:1.8;color:#721c24;margin:0"><strong>⚠️ 注意：</strong>这是一段警告内容。</p></section>' }
    ],
    dividers: [
      { name: '简约线条', html: '<section style="text-align:center;margin:30px 0"><hr style="border:none;border-top:1px solid #e8e8e8;margin:0"></section>' },
      { name: '渐变线条', html: '<section style="text-align:center;margin:30px 0"><div style="height:2px;background:linear-gradient(90deg,transparent,#07C160,transparent)"></div></section>' },
      { name: '圆点分割', html: '<section style="text-align:center;margin:30px 0;display:flex;align-items:center;justify-content:center;gap:8px"><span style="width:6px;height:6px;background:#07C160;border-radius:50%"></span><span style="width:6px;height:6px;background:#07C160;border-radius:50%;opacity:0.6"></span><span style="width:6px;height:6px;background:#07C160;border-radius:50%;opacity:0.3"></span></section>' },
      { name: '星星分割', html: '<section style="text-align:center;margin:30px 0;font-size:14px;color:#07C160">✦ ✦ ✦</section>' },
      { name: '文字分割', html: '<section style="display:flex;align-items:center;margin:30px 0"><span style="flex:1;height:1px;background:#e8e8e8"></span><span style="padding:0 20px;font-size:13px;color:#999">END</span><span style="flex:1;height:1px;background:#e8e8e8"></span></section>' }
    ],
    cards: [
      { name: '简约卡片', html: '<section style="background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:20px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,0.05)"><h3 style="font-size:16px;font-weight:bold;color:#333;margin:0 0 12px 0">卡片标题</h3><p style="font-size:14px;line-height:1.8;color:#666;margin:0">这是卡片内容区域。</p></section>' },
      { name: '数据卡片', html: '<section style="display:flex;gap:16px;margin:20px 0"><div style="flex:1;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:20px;text-align:center"><div style="font-size:32px;font-weight:bold;color:#fff">99%</div><div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">满意度</div></div><div style="flex:1;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);border-radius:12px;padding:20px;text-align:center"><div style="font-size:32px;font-weight:bold;color:#fff">10W+</div><div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">阅读量</div></div></section>' }
    ],
    lists: [
      { name: '图标列表', html: '<section style="margin:20px 0"><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第一条列表内容</span></div><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第二条列表内容</span></div><div style="display:flex;align-items:flex-start"><span style="color:#07C160;margin-right:10px;font-size:16px">✓</span><span style="font-size:15px;color:#333;line-height:1.6">第三条列表内容</span></div></section>' },
      { name: '编号列表', html: '<section style="margin:20px 0"><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="min-width:24px;height:24px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;margin-right:12px">1</span><span style="font-size:15px;color:#333;line-height:1.6;padding-top:2px">第一条内容</span></div><div style="display:flex;align-items:flex-start;margin-bottom:12px"><span style="min-width:24px;height:24px;background:#07C160;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;margin-right:12px">2</span><span style="font-size:15px;color:#333;line-height:1.6;padding-top:2px">第二条内容</span></div></section>' }
    ],
    followGuide: [
      { name: '简约关注', html: '<section style="text-align:center;padding:30px 20px;margin:30px 0;background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border-radius:12px"><p style="font-size:14px;color:#666;margin:0 0 12px 0">觉得有用？点个关注吧 👇</p><p style="font-size:16px;font-weight:bold;color:#07C160;margin:0">长按识别二维码关注我们</p></section>' },
      { name: '底部引导', html: '<section style="background:linear-gradient(135deg,#07C160 0%,#06AD56 100%);border-radius:12px;padding:24px;margin:30px 0;text-align:center"><p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 12px 0">如果觉得文章对你有帮助</p><p style="font-size:18px;font-weight:bold;color:#fff;margin:0">👍 点赞 | ⭐ 收藏 | 🔄 转发</p></section>' }
    ]
  };

  const TEMPLATES = [
    { name: '简约清新', desc: '适合日常分享', styles: { fontSize: '15px', lineHeight: '2', color: '#333', paragraphSpacing: '20px', textIndent: '2em' } },
    { name: '商务专业', desc: '适合职场商业', styles: { fontSize: '16px', lineHeight: '1.8', color: '#2c3e50', paragraphSpacing: '16px', textIndent: '0' } },
    { name: '文艺优雅', desc: '适合情感文学', styles: { fontSize: '15px', lineHeight: '2.2', color: '#4a4a4a', paragraphSpacing: '24px', textIndent: '2em', letterSpacing: '1px' } },
    { name: '科技现代', desc: '适合科技互联网', styles: { fontSize: '15px', lineHeight: '1.9', color: '#1a1a1a', paragraphSpacing: '18px', textIndent: '0' } }
  ];

  const PRESET_COLORS = ['#07C160', '#1890ff', '#722ed1', '#eb2f96', '#fa541c', '#faad14', '#52c41a', '#13c2c2', '#2f54eb', '#333333'];

  // 创建侧边栏
  function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'smartedit-sidebar';
    sidebar.innerHTML = getSidebarHTML();
    document.body.appendChild(sidebar);
    return sidebar;
  }

  function getSidebarHTML() {
    return `
      <div class="smartedit-header">
        <div class="smartedit-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg><span>智编助手</span></div>
        <button class="smartedit-close" id="smartedit-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="smartedit-tabs">
        <button class="smartedit-tab active" data-tab="styles">样式库</button>
        <button class="smartedit-tab" data-tab="ai">AI 写作</button>
        <button class="smartedit-tab" data-tab="images">配图</button>
        <button class="smartedit-tab" data-tab="format">排版</button>
      </div>
      <div class="smartedit-content">
        <div class="smartedit-panel active" id="panel-styles">
          <div class="color-picker-section">
            <div class="color-picker-title">🎨 一键换色</div>
            <div class="color-presets" id="color-presets"></div>
            <div class="color-custom">
              <input type="color" id="custom-color" value="#07C160">
              <input type="text" id="color-hex" value="#07C160" placeholder="#07C160">
              <button class="color-apply-btn" id="apply-color-btn">应用</button>
            </div>
          </div>
          <div class="style-category"><div class="style-category-title">标题样式</div><div class="style-grid" id="style-titles"></div></div>
          <div class="style-category"><div class="style-category-title">正文样式</div><div class="style-grid" id="style-paragraphs"></div></div>
          <div class="style-category"><div class="style-category-title">分割线</div><div class="style-grid" id="style-dividers"></div></div>
          <div class="style-category"><div class="style-category-title">卡片组件</div><div class="style-grid" id="style-cards"></div></div>
          <div class="style-category"><div class="style-category-title">列表样式</div><div class="style-grid" id="style-lists"></div></div>
          <div class="style-category"><div class="style-category-title">引导关注</div><div class="style-grid" id="style-followGuide"></div></div>
        </div>
        <div class="smartedit-panel" id="panel-ai">
          <div class="ai-section">
            <div class="ai-section-title">✨ AI 标题生成</div>
            <textarea class="ai-textarea" id="ai-title-input" placeholder="粘贴文章内容，AI 将生成高点击率标题..."></textarea>
            <div class="ai-btn-group"><button class="ai-btn primary" id="generate-titles-btn">生成标题</button></div>
            <div class="ai-result" id="ai-titles-result" style="display:none"></div>
          </div>
          <div class="ai-section">
            <div class="ai-section-title">📝 AI 标题评分</div>
            <textarea class="ai-textarea" id="ai-score-input" placeholder="输入标题，AI 给出评分和优化建议..." style="min-height:60px"></textarea>
            <div class="ai-btn-group"><button class="ai-btn primary" id="score-title-btn">评分分析</button></div>
            <div class="ai-result" id="ai-score-result" style="display:none"></div>
          </div>
          <div class="ai-section">
            <div class="ai-section-title">📖 AI 写作助手</div>
            <textarea class="ai-textarea" id="ai-write-input" placeholder="输入主题或关键词，AI 生成文章大纲或全文..."></textarea>
            <div class="ai-btn-group">
              <button class="ai-btn" id="generate-outline-btn">生成大纲</button>
              <button class="ai-btn primary" id="generate-article-btn">生成全文</button>
            </div>
            <div class="ai-result" id="ai-write-result" style="display:none"></div>
          </div>
        </div>
        <div class="smartedit-panel" id="panel-images">
          <div class="image-search">
            <input type="text" class="image-search-input" id="image-search-input" placeholder="搜索图片...">
            <button class="image-search-btn" id="image-search-btn">搜索</button>
          </div>
          <div class="image-source-tabs">
            <button class="image-source-tab active" data-source="unsplash">Unsplash</button>
            <button class="image-source-tab" data-source="pixabay">Pixabay</button>
          </div>
          <div class="image-grid" id="image-grid"><div style="grid-column:1/-1;text-align:center;padding:40px;color:#999">输入关键词搜索免费图片</div></div>
        </div>
        <div class="smartedit-panel" id="panel-format">
          <div class="style-category"><div class="style-category-title">一键排版模板</div><div class="template-list" id="template-list"></div></div>
          <div class="style-category">
            <div class="style-category-title">快捷操作</div>
            <div class="ai-btn-group">
              <button class="ai-btn" id="clear-format-btn">清除格式</button>
              <button class="ai-btn" id="add-indent-btn">首行缩进</button>
              <button class="ai-btn" id="line-height-btn">调整行高</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function createFloatingToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'smartedit-floating-toolbar';
    toolbar.innerHTML = `
      <button class="floating-btn" id="toggle-sidebar-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg><span class="floating-btn-tooltip">智编助手</span></button>
      <button class="floating-btn" id="quick-style-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span class="floating-btn-tooltip">样式库</span></button>
      <button class="floating-btn" id="quick-ai-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg><span class="floating-btn-tooltip">AI 写作</span></button>
      <button class="floating-btn" id="quick-format-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"/></svg><span class="floating-btn-tooltip">一键排版</span></button>`;
    document.body.appendChild(toolbar);
    return toolbar;
  }

  function createSelectionToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'smartedit-selection-toolbar';
    toolbar.innerHTML = `
      <button class="selection-btn" data-action="rewrite">润色</button>
      <button class="selection-btn" data-action="expand">扩写</button>
      <button class="selection-btn" data-action="summarize">缩写</button>
      <button class="selection-btn" data-action="change-tone">换语气</button>`;
    document.body.appendChild(toolbar);
    return toolbar;
  }

  function createToast() {
    const toast = document.createElement('div');
    toast.id = 'smartedit-toast';
    document.body.appendChild(toast);
    return toast;
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('smartedit-toast');
    toast.textContent = message;
    toast.className = 'show ' + type;
    setTimeout(() => { toast.className = ''; }, 3000);
  }
  window.showToast = showToast;

  function getEditor() {
    const selectors = ['#ueditor_0', '.edui-body-container', '[contenteditable="true"]', '.rich_media_content', '#js_editor'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        for (const sel of selectors) {
          const el = doc.querySelector(sel);
          if (el) return el;
        }
        if (doc.body && doc.body.contentEditable === 'true') return doc.body;
      } catch (e) {}
    }
    return null;
  }

  function insertStyle(html) {
    const editor = getEditor();
    if (!editor) { showToast('请先打开文章编辑页面', 'error'); return; }
    const themeColor = document.getElementById('custom-color').value;
    const coloredHtml = html.replace(/#07C160/g, themeColor);
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        range.insertNode(range.createContextualFragment(coloredHtml));
        showToast('样式已插入', 'success');
        return;
      }
    }
    editor.innerHTML += coloredHtml;
    showToast('样式已插入', 'success');
  }

  function applyTemplate(template) {
    const editor = getEditor();
    if (!editor) { showToast('请先打开文章编辑页面', 'error'); return; }
    const { styles } = template;
    editor.querySelectorAll('p, div, section').forEach(p => {
      if (styles.fontSize) p.style.fontSize = styles.fontSize;
      if (styles.lineHeight) p.style.lineHeight = styles.lineHeight;
      if (styles.color) p.style.color = styles.color;
      if (styles.textIndent) p.style.textIndent = styles.textIndent;
      if (styles.letterSpacing) p.style.letterSpacing = styles.letterSpacing;
      if (styles.paragraphSpacing) p.style.marginBottom = styles.paragraphSpacing;
    });
    showToast(`已应用「${template.name}」模板`, 'success');
  }

  function applyThemeColor(color) {
    const editor = getEditor();
    if (!editor) { showToast('请先打开文章编辑页面', 'error'); return; }
    const oldColors = ['#07C160', '#06AD56', '#1890ff', '#722ed1', '#eb2f96', '#fa541c'];
    editor.querySelectorAll('[style*="color"], [style*="background"]').forEach(el => {
      let style = el.getAttribute('style') || '';
      oldColors.forEach(c => { style = style.replace(new RegExp(c, 'gi'), color); });
      el.setAttribute('style', style);
    });
    showToast('主题色已更新', 'success');
  }

  async function aiRequest(action, text, options = {}) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'AI_REQUEST', data: { action, text, options } });
      if (response.success) return response.data;
      throw new Error(response.error);
    } catch (error) {
      showToast(error.message || 'AI 请求失败', 'error');
      throw error;
    }
  }

  async function searchImages(query, source = 'unsplash') {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'SEARCH_IMAGES', data: { query, source } });
      if (response.success) return response.data;
      throw new Error(response.error);
    } catch (error) {
      showToast(error.message || '图片搜索失败', 'error');
      throw error;
    }
  }

  function initStyleLibrary() {
    const colorPresetsContainer = document.getElementById('color-presets');
    PRESET_COLORS.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'color-preset';
      btn.style.background = color;
      btn.dataset.color = color;
      btn.onclick = () => {
        document.getElementById('custom-color').value = color;
        document.getElementById('color-hex').value = color;
        document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
      colorPresetsContainer.appendChild(btn);
    });

    Object.keys(STYLES).forEach(category => {
      const container = document.getElementById(`style-${category}`);
      if (!container) return;
      STYLES[category].forEach(style => {
        const item = document.createElement('div');
        item.className = 'style-item';
        item.innerHTML = `<div class="style-item-preview">${style.html}</div><div class="style-item-name">${style.name}</div>`;
        item.onclick = () => insertStyle(style.html);
        container.appendChild(item);
      });
    });

    const templateList = document.getElementById('template-list');
    TEMPLATES.forEach(template => {
      const item = document.createElement('div');
      item.className = 'template-item';
      item.innerHTML = `<div class="template-preview"><div class="template-preview-line title"></div><div class="template-preview-line"></div><div class="template-preview-line"></div></div><div class="template-info"><div class="template-name">${template.name}</div><div class="template-desc">${template.desc}</div></div>`;
      item.onclick = () => applyTemplate(template);
      templateList.appendChild(item);
    });
  }

  function switchTab(tabName) {
    document.querySelectorAll('.smartedit-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
    document.querySelectorAll('.smartedit-panel').forEach(panel => panel.classList.toggle('active', panel.id === `panel-${tabName}`));
  }

  function bindEvents() {
    const sidebar = document.getElementById('smartedit-sidebar');
    const selectionToolbar = document.getElementById('smartedit-selection-toolbar');

    document.getElementById('smartedit-close-btn').onclick = () => sidebar.classList.remove('open');
    document.getElementById('toggle-sidebar-btn').onclick = () => sidebar.classList.toggle('open');
    document.getElementById('quick-style-btn').onclick = () => { sidebar.classList.add('open'); switchTab('styles'); };
    document.getElementById('quick-ai-btn').onclick = () => { sidebar.classList.add('open'); switchTab('ai'); };
    document.getElementById('quick-format-btn').onclick = () => { sidebar.classList.add('open'); switchTab('format'); };

    document.querySelectorAll('.smartedit-tab').forEach(tab => { tab.onclick = () => switchTab(tab.dataset.tab); });

    document.getElementById('custom-color').oninput = e => { document.getElementById('color-hex').value = e.target.value; };
    document.getElementById('color-hex').oninput = e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) document.getElementById('custom-color').value = e.target.value; };
    document.getElementById('apply-color-btn').onclick = () => applyThemeColor(document.getElementById('custom-color').value);

    document.getElementById('generate-titles-btn').onclick = async () => {
      const input = document.getElementById('ai-title-input').value.trim();
      if (!input) { showToast('请输入文章内容', 'error'); return; }
      const btn = document.getElementById('generate-titles-btn');
      btn.disabled = true; btn.textContent = '生成中...';
      try {
        const result = await aiRequest('generate-title', input);
        const container = document.getElementById('ai-titles-result');
        container.style.display = 'block';
        container.innerHTML = result.split('\n').filter(t => t.trim()).map(t => `<div class="ai-result-item">${t}</div>`).join('');
      } catch (e) {} finally { btn.disabled = false; btn.textContent = '生成标题'; }
    };

    document.getElementById('score-title-btn').onclick = async () => {
      const input = document.getElementById('ai-score-input').value.trim();
      if (!input) { showToast('请输入标题', 'error'); return; }
      const btn = document.getElementById('score-title-btn');
      btn.disabled = true; btn.textContent = '分析中...';
      try {
        const result = await aiRequest('score-title', input);
        const container = document.getElementById('ai-score-result');
        container.style.display = 'block';
        container.innerHTML = `<div style="white-space:pre-wrap;line-height:1.8">${result}</div>`;
      } catch (e) {} finally { btn.disabled = false; btn.textContent = '评分分析'; }
    };

    document.getElementById('generate-outline-btn').onclick = async () => {
      const input = document.getElementById('ai-write-input').value.trim();
      if (!input) { showToast('请输入主题', 'error'); return; }
      const btn = document.getElementById('generate-outline-btn');
      btn.disabled = true;
      try {
        const result = await aiRequest('generate-outline', input);
        document.getElementById('ai-write-result').style.display = 'block';
        document.getElementById('ai-write-result').innerHTML = `<div style="white-space:pre-wrap;line-height:1.8">${result}</div>`;
      } catch (e) {} finally { btn.disabled = false; }
    };

    document.getElementById('generate-article-btn').onclick = async () => {
      const input = document.getElementById('ai-write-input').value.trim();
      if (!input) { showToast('请输入主题', 'error'); return; }
      const btn = document.getElementById('generate-article-btn');
      btn.disabled = true;
      try {
        const result = await aiRequest('generate-article', input);
        window.__smartedit_article_result = result;
        document.getElementById('ai-write-result').style.display = 'block';
        document.getElementById('ai-write-result').innerHTML = `<div style="white-space:pre-wrap;line-height:1.8">${result}</div><button class="ai-btn primary" style="margin-top:12px" onclick="insertToEditor()">插入到编辑器</button>`;
      } catch (e) {} finally { btn.disabled = false; }
    };

    document.getElementById('image-search-btn').onclick = async () => {
      const query = document.getElementById('image-search-input').value.trim();
      if (!query) { showToast('请输入搜索关键词', 'error'); return; }
      const source = document.querySelector('.image-source-tab.active').dataset.source;
      const grid = document.getElementById('image-grid');
      grid.innerHTML = '<div class="smartedit-loading"><div class="smartedit-spinner"></div></div>';
      try {
        const images = await searchImages(query, source);
        grid.innerHTML = images.length ? images.map(img => `<div class="image-item" onclick="insertImage('${img.url}')"><img src="${img.thumb}" loading="lazy"><div class="image-item-overlay">${img.author || ''}</div></div>`).join('') : '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999">未找到相关图片</div>';
      } catch (e) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#fa5151">搜索失败</div>'; }
    };

    document.querySelectorAll('.image-source-tab').forEach(tab => { tab.onclick = () => { document.querySelectorAll('.image-source-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); }; });

    document.getElementById('clear-format-btn').onclick = () => { if (window.getSelection().toString()) { document.execCommand('removeFormat'); showToast('已清除格式', 'success'); } else showToast('请先选中文本', 'error'); };
    document.getElementById('add-indent-btn').onclick = () => { const editor = getEditor(); if (editor) { editor.querySelectorAll('p').forEach(p => p.style.textIndent = '2em'); showToast('已添加缩进', 'success'); } };
    document.getElementById('line-height-btn').onclick = () => { const editor = getEditor(); if (editor) { editor.querySelectorAll('p,div,section').forEach(p => p.style.lineHeight = '2'); showToast('已调整行高', 'success'); } };

    document.addEventListener('mouseup', e => {
      const text = window.getSelection().toString().trim();
      if (text) {
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();
        selectionToolbar.style.left = `${rect.left + rect.width / 2 - 100}px`;
        selectionToolbar.style.top = `${rect.top - 50 + window.scrollY}px`;
        selectionToolbar.classList.add('show');
      } else selectionToolbar.classList.remove('show');
    });

    document.querySelectorAll('.selection-btn').forEach(btn => {
      btn.onclick = async e => {
        e.stopPropagation();
        const text = window.getSelection().toString().trim();
        if (!text) return;
        selectionToolbar.classList.remove('show');
        showToast('AI 处理中...', 'info');
        try {
          const result = await aiRequest(btn.dataset.action, text);
          const range = window.getSelection().getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(result));
          showToast('已完成', 'success');
        } catch (e) {}
      };
    });
  }

  window.insertImage = function(url) {
    const editor = getEditor();
    if (!editor) { showToast('请先打开编辑页面', 'error'); return; }
    const img = document.createElement('img');
    img.src = url; img.style.cssText = 'max-width:100%;height:auto;display:block;margin:20px auto';
    editor.appendChild(img);
    showToast('图片已插入', 'success');
  };

  window.insertToEditor = function() {
    const result = window.__smartedit_article_result;
    if (!result) return;
    const editor = getEditor();
    if (!editor) { showToast('请先打开编辑页面', 'error'); return; }
    const html = result.split('\n').map(line => line.trim() ? `<p style="font-size:15px;line-height:2;color:#333;margin-bottom:16px">${line}</p>` : '').join('');
    editor.innerHTML += html;
    showToast('文章已插入', 'success');
  };

  function init() {
    createSidebar();
    createFloatingToolbar();
    createSelectionToolbar();
    createToast();
    initStyleLibrary();
    bindEvents();
    console.log('智编助手初始化完成');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
