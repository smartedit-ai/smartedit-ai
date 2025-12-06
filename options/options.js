// 智编助手 - 设置页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 加载设置
  await loadSettings();
  
  // 导航切换
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');
    });
  });
  
  // API Key 显示/隐藏
  document.getElementById('toggle-api-key').addEventListener('click', (e) => {
    const input = document.getElementById('api-key');
    if (input.type === 'password') {
      input.type = 'text';
      e.target.textContent = '隐藏';
    } else {
      input.type = 'password';
      e.target.textContent = '显示';
    }
  });
  
  // 测试 AI 连接
  document.getElementById('test-ai-btn').addEventListener('click', async () => {
    const resultEl = document.getElementById('ai-test-result');
    resultEl.textContent = '测试中...';
    resultEl.className = 'test-result';
    
    const apiKey = document.getElementById('api-key').value;
    const provider = document.getElementById('ai-provider').value;
    
    if (!apiKey) {
      resultEl.textContent = '请先输入 API Key';
      resultEl.className = 'test-result error';
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'AI_REQUEST',
        data: {
          action: 'test',
          text: '你好'
        }
      });
      
      if (response.success) {
        resultEl.textContent = '✓ 连接成功！';
        resultEl.className = 'test-result success';
      } else {
        resultEl.textContent = `✗ ${response.error}`;
        resultEl.className = 'test-result error';
      }
    } catch (error) {
      resultEl.textContent = `✗ ${error.message}`;
      resultEl.className = 'test-result error';
    }
  });
  
  // 保存设置
  document.getElementById('save-btn').addEventListener('click', async () => {
    await saveSettings();
    showNotification('设置已保存');
  });
  
  // 恢复默认
  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (confirm('确定要恢复默认设置吗？')) {
      await resetSettings();
      await loadSettings();
      showNotification('已恢复默认设置');
    }
  });
  
  // 检查是否是欢迎页面
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('welcome') === 'true') {
    showWelcomeMessage();
  }
});

// 加载设置
async function loadSettings() {
  const result = await chrome.storage.sync.get('settings');
  const settings = result.settings || getDefaultSettings();
  
  document.getElementById('theme-color').value = settings.themeColor || '#07C160';
  document.getElementById('show-floating-toolbar').checked = settings.showFloatingToolbar !== false;
  document.getElementById('auto-insert-style').checked = settings.autoInsertStyle !== false;
  document.getElementById('show-selection-toolbar').checked = settings.showSelectionToolbar !== false;
  document.getElementById('ai-provider').value = settings.aiProvider || 'openai';
  document.getElementById('api-key').value = settings.apiKey || '';
  document.getElementById('custom-api-url').value = settings.customApiUrl || '';
  document.getElementById('unsplash-key').value = settings.unsplashKey || '';
  document.getElementById('pixabay-key').value = settings.pixabayKey || '';
}

// 保存设置
async function saveSettings() {
  const settings = {
    themeColor: document.getElementById('theme-color').value,
    showFloatingToolbar: document.getElementById('show-floating-toolbar').checked,
    autoInsertStyle: document.getElementById('auto-insert-style').checked,
    showSelectionToolbar: document.getElementById('show-selection-toolbar').checked,
    aiProvider: document.getElementById('ai-provider').value,
    apiKey: document.getElementById('api-key').value,
    customApiUrl: document.getElementById('custom-api-url').value,
    unsplashKey: document.getElementById('unsplash-key').value,
    pixabayKey: document.getElementById('pixabay-key').value
  };
  
  await chrome.storage.sync.set({ settings });
}

// 获取默认设置
function getDefaultSettings() {
  return {
    themeColor: '#07C160',
    showFloatingToolbar: true,
    autoInsertStyle: true,
    showSelectionToolbar: true,
    aiProvider: 'openai',
    apiKey: '',
    customApiUrl: '',
    unsplashKey: '',
    pixabayKey: ''
  };
}

// 恢复默认设置
async function resetSettings() {
  await chrome.storage.sync.set({ settings: getDefaultSettings() });
}

// 显示通知
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #07C160;
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// 显示欢迎消息
function showWelcomeMessage() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  overlay.innerHTML = `
    <div style="
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      animation: scaleIn 0.3s ease;
    ">
      <div style="margin-bottom: 20px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="#07C160" stroke-width="2" width="64" height="64">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h2 style="font-size: 24px; color: #333; margin-bottom: 12px;">欢迎使用智编助手！</h2>
      <p style="font-size: 15px; color: #666; line-height: 1.8; margin-bottom: 24px;">
        感谢您安装智编助手。在开始使用之前，请先配置您的 AI API Key，以启用 AI 写作功能。
      </p>
      <button id="welcome-close-btn" style="
        padding: 12px 32px;
        background: #07C160;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        cursor: pointer;
      ">开始配置</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  document.getElementById('welcome-close-btn').addEventListener('click', () => {
    overlay.remove();
    // 切换到 AI 配置页面
    document.querySelector('[data-section="ai"]').click();
  });
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100px); opacity: 0; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);
