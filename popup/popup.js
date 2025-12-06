// 智编助手 - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // 检查当前标签页状态
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isWeixinPage = tab?.url?.includes('mp.weixin.qq.com');
  
  const statusCard = document.getElementById('status-card');
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');
  
  if (isWeixinPage) {
    statusCard.classList.add('active');
    statusIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    `;
    statusTitle.textContent = '已激活';
    statusDesc.textContent = '智编助手已在当前页面运行';
  }
  
  // 加载统计数据
  const stats = await chrome.storage.local.get(['statsStyles', 'statsAI', 'statsImages']);
  document.getElementById('stat-styles').textContent = stats.statsStyles || 0;
  document.getElementById('stat-ai').textContent = stats.statsAI || 0;
  document.getElementById('stat-images').textContent = stats.statsImages || 0;
  
  // 快捷按钮事件
  document.getElementById('open-sidebar-btn').addEventListener('click', async () => {
    if (!isWeixinPage) {
      alert('请先打开微信公众平台 (mp.weixin.qq.com)');
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
    window.close();
  });
  
  document.getElementById('ai-title-btn').addEventListener('click', async () => {
    if (!isWeixinPage) {
      alert('请先打开微信公众平台 (mp.weixin.qq.com)');
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_TAB', tab: 'ai' });
    window.close();
  });
  
  document.getElementById('style-lib-btn').addEventListener('click', async () => {
    if (!isWeixinPage) {
      alert('请先打开微信公众平台 (mp.weixin.qq.com)');
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_TAB', tab: 'styles' });
    window.close();
  });
  
  document.getElementById('format-btn').addEventListener('click', async () => {
    if (!isWeixinPage) {
      alert('请先打开微信公众平台 (mp.weixin.qq.com)');
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_TAB', tab: 'format' });
    window.close();
  });
  
  // 设置按钮
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // 帮助按钮
  document.getElementById('help-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/smartedit/help' });
  });
});
