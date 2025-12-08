import { useState } from 'react'
import { BG_TEMPLATES, GRADIENT_TEMPLATES, IMAGE_SEARCH_TAGS } from '../constants'
import { getEditor, insertImage } from '../utils'

// 图片源配置
const IMAGE_SOURCES = [
  { id: 'unsplash', name: 'Unsplash', desc: '高质量摄影' },
  { id: 'pixabay', name: 'Pixabay', desc: '免版权素材' },
]

// 图片尺寸选项
const IMAGE_SIZES = [
  { id: 'original', label: '原图', width: null },
  { id: 'large', label: '大图', width: 1080 },
  { id: 'medium', label: '中图', width: 720 },
  { id: 'small', label: '小图', width: 480 },
]

export default function ImagePanel() {
  const [imageTab, setImageTab] = useState<'bg' | 'search' | 'gradient'>('bg')
  const [imageQuery, setImageQuery] = useState('')
  const [images, setImages] = useState<Array<{id: string; url: string; thumb: string; description?: string; author?: string}>>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [imageSource, setImageSource] = useState('unsplash')
  const [selectedSize, setSelectedSize] = useState('large')
  const [previewImage, setPreviewImage] = useState<{url: string; description?: string} | null>(null)

  const handleSearchImages = async (source?: string) => {
    if (!imageQuery.trim()) return
    setImageLoading(true)
    setImages([])
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEARCH_IMAGES',
        data: { query: imageQuery, source: source || imageSource }
      })
      if (response.success) {
        setImages(response.data)
      } else {
        alert(response.error || '搜索失败')
      }
    } catch (error) {
      alert((error as Error).message)
    }
    setImageLoading(false)
  }

  // 处理图片插入
  const handleInsertImage = (img: {url: string; description?: string}) => {
    const sizeConfig = IMAGE_SIZES.find(s => s.id === selectedSize)
    let finalUrl = img.url
    
    // 如果是 Unsplash 图片，可以通过 URL 参数调整尺寸
    if (sizeConfig?.width && img.url.includes('unsplash')) {
      finalUrl = img.url.replace(/w=\d+/, `w=${sizeConfig.width}`)
    }
    
    insertImage(finalUrl, img.description)
  }

  return (
    <div>
      {/* 图片分类 */}
      <div className="flex border-b border-gray-100">
        <button 
          onClick={() => setImageTab('bg')}
          className={`flex-1 py-2.5 text-xs font-medium ${imageTab === 'bg' ? 'text-[#07C160] border-b-2 border-[#07C160]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          背景素材
        </button>
        <button 
          onClick={() => setImageTab('search')}
          className={`flex-1 py-2.5 text-xs font-medium ${imageTab === 'search' ? 'text-[#07C160] border-b-2 border-[#07C160]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          图片搜索
        </button>
        <button 
          onClick={() => setImageTab('gradient')}
          className={`flex-1 py-2.5 text-xs font-medium ${imageTab === 'gradient' ? 'text-[#07C160] border-b-2 border-[#07C160]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          渐变背景
        </button>
      </div>

      {/* 背景色选择 */}
      {imageTab === 'bg' && (
        <div className="p-3">
          <div className="text-xs text-gray-500 mb-2">纯色背景</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {BG_TEMPLATES.map((bg, i) => (
              <button
                key={i}
                onClick={() => {
                  const editor = getEditor()
                  if (editor) {
                    editor.style.backgroundColor = bg.color
                    alert(`已应用「${bg.name}」背景`)
                  }
                }}
                className="aspect-square rounded-lg border-2 border-gray-200 hover:border-[#07C160] transition-all flex items-center justify-center"
                style={{ background: bg.color }}
                title={bg.name}
              >
                <span className="text-[10px] text-gray-500">{bg.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 图片搜索 */}
      {imageTab === 'search' && (
        <div className="p-3">
          {/* 图片源选择 */}
          <div className="flex gap-1 mb-3">
            {IMAGE_SOURCES.map(source => (
              <button
                key={source.id}
                onClick={() => setImageSource(source.id)}
                className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                  imageSource === source.id
                    ? 'bg-[#07C160] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={imageQuery}
                onChange={e => setImageQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchImages()}
                placeholder={`搜索 ${imageSource === 'unsplash' ? 'Unsplash' : 'Pixabay'} 图片...`}
                className="w-full px-3 py-2 pl-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#07C160]"
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <button
              onClick={() => handleSearchImages()}
              disabled={imageLoading}
              className="px-3 py-2 bg-[#07C160] text-white rounded-lg text-sm hover:bg-[#06AD56] disabled:opacity-50"
            >
              {imageLoading ? '...' : '搜索'}
            </button>
          </div>
          
          {/* 快捷搜索标签 */}
          <div className="flex flex-wrap gap-1 mb-3">
            {IMAGE_SEARCH_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setImageQuery(tag)
                  setTimeout(() => handleSearchImages(), 100)
                }}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 图片尺寸选择 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500">插入尺寸:</span>
            <div className="flex gap-1">
              {IMAGE_SIZES.map(size => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={`px-2 py-0.5 text-[10px] rounded ${
                    selectedSize === size.id
                      ? 'bg-[#07C160] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* 图片网格 */}
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {images.length > 0 ? (
              images.map(img => (
                <div key={img.id} className="relative group">
                  <button
                    onClick={() => handleInsertImage(img)}
                    className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-[#07C160]"
                  >
                    <img src={img.thumb} alt={img.description} className="w-full h-full object-cover" />
                  </button>
                  {/* 悬停操作 */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => handleInsertImage(img)}
                      className="px-3 py-1 bg-[#07C160] text-white text-xs rounded-full hover:bg-[#06AD56]"
                    >
                      插入图片
                    </button>
                    <button
                      onClick={() => setPreviewImage(img)}
                      className="px-3 py-1 bg-white/20 text-white text-xs rounded-full hover:bg-white/30"
                    >
                      预览大图
                    </button>
                  </div>
                  {/* 作者信息 */}
                  {img.author && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                      <span className="text-[10px] text-white/80">📷 {img.author}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-gray-400 text-sm">
                {imageLoading ? '搜索中...' : '输入关键词搜索图片'}
              </div>
            )}
          </div>
          
          <div className="mt-3 text-[10px] text-gray-400 text-center">
            图片来自 {imageSource === 'unsplash' ? 'Unsplash' : 'Pixabay'}，请在设置中配置 API Key
          </div>
        </div>
      )}

      {/* 渐变背景 */}
      {imageTab === 'gradient' && (
        <div className="p-3">
          <div className="text-xs text-gray-500 mb-2">渐变背景</div>
          <div className="grid grid-cols-2 gap-2">
            {GRADIENT_TEMPLATES.map((bg, i) => (
              <button
                key={i}
                onClick={() => {
                  const editor = getEditor()
                  if (editor) {
                    editor.style.background = bg.gradient
                    alert(`已应用「${bg.name}」渐变背景`)
                  }
                }}
                className="h-16 rounded-lg border-2 border-gray-200 hover:border-[#07C160] transition-all flex items-center justify-center"
                style={{ background: bg.gradient }}
              >
                <span className="text-white text-xs font-medium drop-shadow">{bg.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-[9999999] flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img 
              src={previewImage.url} 
              alt={previewImage.description} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <p className="text-white text-sm mb-2">{previewImage.description || '无描述'}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleInsertImage(previewImage)
                    setPreviewImage(null)
                  }}
                  className="px-4 py-2 bg-[#07C160] text-white text-sm rounded-lg hover:bg-[#06AD56]"
                >
                  插入图片
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30"
                >
                  关闭
                </button>
              </div>
            </div>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full hover:bg-black/70 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
