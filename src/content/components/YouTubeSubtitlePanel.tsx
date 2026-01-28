/**
 * YouTube AI 字幕面板组件
 * 在视频播放器下方显示，提供 AI 字幕、双语字幕、下载等功能
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  isYouTubeWatchPage,
  getVideoInfo,
  getVideoId,
  getCurrentTime,
  seekTo,
  formatDisplayTime,
  fetchYouTubeSubtitles,
  exportToSrt,
  exportToVtt,
  exportToText,
  downloadFile,
  generateTranslationPrompt,
  generateVideoSummaryPrompt,
  loadSubtitleConfig,
  saveSubtitleConfig,
  SubtitleEntry,
  YouTubeVideoInfo,
  SubtitlePanelConfig
} from '../../lib/youtubeSubtitle'
import { aiRequest } from '../utils'

interface YouTubeSubtitlePanelProps {
  onClose?: () => void
}

export default function YouTubeSubtitlePanel({ onClose }: YouTubeSubtitlePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'subtitle' | 'summary' | 'settings'>('subtitle')
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null)
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingTask, setLoadingTask] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<SubtitlePanelConfig | null>(null)
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1)
  const [videoSummary, setVideoSummary] = useState<string | null>(null)
  const [translationProgress, setTranslationProgress] = useState<{ current: number; total: number } | null>(null)
  
  const subtitleListRef = useRef<HTMLDivElement>(null)
  const timeUpdateIntervalRef = useRef<number | null>(null)

  // 加载配置和视频信息
  useEffect(() => {
    loadSubtitleConfig().then(setConfig)
    
    const info = getVideoInfo()
    setVideoInfo(info)
    
    // 尝试获取原生字幕
    const videoId = getVideoId()
    if (videoId) {
      fetchYouTubeSubtitles(videoId).then(subs => {
        if (subs && subs.length > 0) {
          setSubtitles(subs)
        }
      })
    }
    
    // 监听视频时间变化
    timeUpdateIntervalRef.current = window.setInterval(() => {
      if (subtitles.length > 0) {
        const currentTime = getCurrentTime()
        const index = subtitles.findIndex(s => currentTime >= s.start && currentTime < s.end)
        if (index !== currentSubtitleIndex) {
          setCurrentSubtitleIndex(index)
          // 自动滚动到当前字幕
          if (index >= 0 && subtitleListRef.current) {
            const item = subtitleListRef.current.children[index] as HTMLElement
            if (item) {
              item.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }
        }
      }
    }, 200)
    
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
      }
    }
  }, [subtitles.length, currentSubtitleIndex])

  // 翻译字幕
  const handleTranslateSubtitles = useCallback(async () => {
    if (subtitles.length === 0) {
      setError('请先获取字幕')
      return
    }
    
    setIsLoading(true)
    setLoadingTask('translate')
    setError(null)
    
    const batchSize = 10 // 每批翻译的字幕数量
    const batches = Math.ceil(subtitles.length / batchSize)
    const translatedSubtitles = [...subtitles]
    
    try {
      for (let i = 0; i < batches; i++) {
        setTranslationProgress({ current: i + 1, total: batches })
        
        const start = i * batchSize
        const end = Math.min(start + batchSize, subtitles.length)
        const batch = subtitles.slice(start, end)
        const batchText = batch.map((s, idx) => `[${start + idx}] ${s.text}`).join('\n')
        
        const prompt = generateTranslationPrompt(batchText, config?.targetLanguage || '中文')
        const result = await aiRequest('translate', prompt)
        
        if (result) {
          // 解析翻译结果
          const lines = result.split('\n').filter(l => l.trim())
          lines.forEach(line => {
            const match = line.match(/^\[(\d+)\]\s*(.+)/)
            if (match) {
              const idx = parseInt(match[1])
              const translation = match[2].trim()
              if (idx >= 0 && idx < translatedSubtitles.length) {
                translatedSubtitles[idx] = { ...translatedSubtitles[idx], translation }
              }
            } else {
              // 如果没有索引标记，按顺序分配
              const lineIdx = start + lines.indexOf(line)
              if (lineIdx < translatedSubtitles.length) {
                translatedSubtitles[lineIdx] = { ...translatedSubtitles[lineIdx], translation: line.trim() }
              }
            }
          })
        }
      }
      
      setSubtitles(translatedSubtitles)
    } catch (e) {
      setError(`翻译失败: ${(e as Error).message}`)
    }
    
    setIsLoading(false)
    setLoadingTask('')
    setTranslationProgress(null)
  }, [subtitles, config?.targetLanguage])

  // 生成视频总结
  const handleGenerateSummary = useCallback(async () => {
    if (!videoInfo) {
      setError('无法获取视频信息')
      return
    }
    
    setIsLoading(true)
    setLoadingTask('summary')
    setError(null)
    
    try {
      const subtitleText = subtitles.map(s => s.text).join(' ')
      const prompt = generateVideoSummaryPrompt(videoInfo, subtitleText)
      const result = await aiRequest('video-summary', prompt)
      
      if (result) {
        setVideoSummary(result)
        setActiveTab('summary')
      } else {
        setError('生成总结失败')
      }
    } catch (e) {
      setError(`生成总结失败: ${(e as Error).message}`)
    }
    
    setIsLoading(false)
    setLoadingTask('')
  }, [videoInfo, subtitles])

  // 下载字幕
  const handleDownload = useCallback((format: 'srt' | 'vtt' | 'txt', bilingual: boolean = false) => {
    if (subtitles.length === 0) {
      setError('没有可下载的字幕')
      return
    }
    
    const videoId = getVideoId() || 'video'
    let content: string
    let filename: string
    let mimeType: string
    
    switch (format) {
      case 'srt':
        content = exportToSrt(subtitles, bilingual)
        filename = `${videoId}${bilingual ? '_bilingual' : ''}.srt`
        mimeType = 'text/plain'
        break
      case 'vtt':
        content = exportToVtt(subtitles, bilingual)
        filename = `${videoId}${bilingual ? '_bilingual' : ''}.vtt`
        mimeType = 'text/vtt'
        break
      case 'txt':
        content = exportToText(subtitles, bilingual)
        filename = `${videoId}${bilingual ? '_bilingual' : ''}.txt`
        mimeType = 'text/plain'
        break
    }
    
    downloadFile(content, filename, mimeType)
  }, [subtitles])

  // 更新配置
  const handleConfigChange = useCallback((key: keyof SubtitlePanelConfig, value: unknown) => {
    if (!config) return
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    saveSubtitleConfig(newConfig)
  }, [config])

  // 点击字幕跳转
  const handleSubtitleClick = useCallback((entry: SubtitleEntry) => {
    seekTo(entry.start)
  }, [])

  if (!isYouTubeWatchPage()) {
    return null
  }

  return (
    <div className="smartedit-youtube-panel" style={{
      position: 'relative',
      width: '100%',
      backgroundColor: '#0f0f0f',
      borderRadius: '12px',
      marginTop: '12px',
      overflow: 'hidden',
      fontFamily: 'Roboto, Arial, sans-serif',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>✨</span>
          <span style={{ color: '#fff', fontWeight: 500, fontSize: '14px' }}>AI 字幕助手</span>
          {subtitles.length > 0 && (
            <span style={{ 
              backgroundColor: '#3ea6ff', 
              color: '#000', 
              padding: '2px 8px', 
              borderRadius: '10px', 
              fontSize: '11px',
              fontWeight: 500
            }}>
              {subtitles.length} 条字幕
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '16px'
            }}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* 功能按钮栏 */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#1a1a1a',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleTranslateSubtitles}
              disabled={isLoading || subtitles.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#3ea6ff',
                color: '#000',
                border: 'none',
                borderRadius: '18px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isLoading || subtitles.length === 0 ? 'not-allowed' : 'pointer',
                opacity: isLoading || subtitles.length === 0 ? 0.5 : 1
              }}
            >
              {isLoading && loadingTask === 'translate' ? (
                <>
                  <span style={{ 
                    width: '14px', 
                    height: '14px', 
                    border: '2px solid #000', 
                    borderTopColor: 'transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></span>
                  翻译中 {translationProgress ? `${translationProgress.current}/${translationProgress.total}` : ''}
                </>
              ) : (
                <>🌐 双语字幕</>
              )}
            </button>
            
            <button
              onClick={handleGenerateSummary}
              disabled={isLoading || subtitles.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '18px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isLoading || subtitles.length === 0 ? 'not-allowed' : 'pointer',
                opacity: isLoading || subtitles.length === 0 ? 0.5 : 1
              }}
            >
              {isLoading && loadingTask === 'summary' ? '生成中...' : '📝 视频总结'}
            </button>
            
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveTab(activeTab === 'settings' ? 'subtitle' : 'settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'settings' ? '#444' : '#2a2a2a',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                ⚙️ 设置
              </button>
            </div>
            
            {subtitles.length > 0 && (
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <select
                  onChange={(e) => {
                    const [format, bilingual] = e.target.value.split('-')
                    handleDownload(format as 'srt' | 'vtt' | 'txt', bilingual === 'bi')
                    e.target.value = ''
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid #444',
                    borderRadius: '18px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    appearance: 'none',
                    paddingRight: '30px'
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>⬇️ 下载字幕</option>
                  <option value="srt-single">SRT (原文)</option>
                  <option value="srt-bi">SRT (双语)</option>
                  <option value="vtt-single">VTT (原文)</option>
                  <option value="vtt-bi">VTT (双语)</option>
                  <option value="txt-single">TXT (原文)</option>
                  <option value="txt-bi">TXT (双语)</option>
                </select>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{
              padding: '10px 16px',
              backgroundColor: '#ff4444',
              color: '#fff',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          {/* 标签页切换 */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #333',
            backgroundColor: '#1a1a1a'
          }}>
            {[
              { id: 'subtitle', label: '📜 字幕' },
              { id: 'summary', label: '📝 总结' },
              { id: 'settings', label: '⚙️ 设置' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? '#3ea6ff' : '#aaa',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #3ea6ff' : '2px solid transparent',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 内容区域 */}
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {/* 字幕列表 */}
            {activeTab === 'subtitle' && (
              <div ref={subtitleListRef} style={{ padding: '8px' }}>
                {subtitles.length === 0 ? (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: '#888' 
                  }}>
                    <p style={{ fontSize: '14px', marginBottom: '12px' }}>暂无字幕</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      该视频可能没有可用的字幕，或正在加载中...
                    </p>
                  </div>
                ) : (
                  subtitles.map((entry, index) => (
                    <div
                      key={index}
                      onClick={() => handleSubtitleClick(entry)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '10px 12px',
                        backgroundColor: index === currentSubtitleIndex ? '#2a2a2a' : 'transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <span style={{ 
                        color: '#3ea6ff', 
                        fontSize: '12px', 
                        fontFamily: 'monospace',
                        minWidth: '50px'
                      }}>
                        {formatDisplayTime(entry.start)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          color: '#fff', 
                          fontSize: '13px', 
                          lineHeight: 1.5,
                          margin: 0
                        }}>
                          {entry.text}
                        </p>
                        {entry.translation && (
                          <p style={{ 
                            color: '#aaa', 
                            fontSize: '12px', 
                            lineHeight: 1.5,
                            margin: '4px 0 0 0'
                          }}>
                            {entry.translation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 视频总结 */}
            {activeTab === 'summary' && (
              <div style={{ padding: '16px' }}>
                {videoSummary ? (
                  <div style={{ 
                    color: '#ddd', 
                    fontSize: '14px', 
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {videoSummary}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(videoSummary)
                        alert('✅ 总结已复制')
                      }}
                      style={{
                        display: 'block',
                        marginTop: '16px',
                        padding: '8px 16px',
                        backgroundColor: '#2a2a2a',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      📋 复制总结
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '40px 20px', 
                    textAlign: 'center', 
                    color: '#888' 
                  }}>
                    <p style={{ fontSize: '14px', marginBottom: '12px' }}>暂无视频总结</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      点击上方「视频总结」按钮生成 AI 总结
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 设置 */}
            {activeTab === 'settings' && config && (
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    color: '#ddd',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={config.autoBilingual}
                      onChange={(e) => handleConfigChange('autoBilingual', e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    自动开启双语字幕
                  </label>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block',
                    color: '#ddd',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    目标语言
                  </label>
                  <select
                    value={config.targetLanguage}
                    onChange={(e) => handleConfigChange('targetLanguage', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#2a2a2a',
                      color: '#fff',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="中文">中文</option>
                    <option value="English">English</option>
                    <option value="日本語">日本語</option>
                    <option value="한국어">한국어</option>
                    <option value="Español">Español</option>
                    <option value="Français">Français</option>
                    <option value="Deutsch">Deutsch</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block',
                    color: '#ddd',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    字幕字号: {config.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={config.fontSize}
                    onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* CSS 动画 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
