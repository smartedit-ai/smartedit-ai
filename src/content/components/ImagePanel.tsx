import { useState } from 'react'
import { BG_TEMPLATES, GRADIENT_TEMPLATES, IMAGE_SEARCH_TAGS } from '../constants'
import { getEditor, insertImage, searchImages } from '../utils'

export default function ImagePanel() {
  const [imageTab, setImageTab] = useState<'bg' | 'search' | 'gradient'>('bg')
  const [imageQuery, setImageQuery] = useState('')
  const [images, setImages] = useState<Array<{id: string; url: string; thumb: string; description?: string; author?: string}>>([])
  const [imageLoading, setImageLoading] = useState(false)

  const handleSearchImages = async () => {
    if (!imageQuery.trim()) return
    setImageLoading(true)
    const result = await searchImages(imageQuery)
    if (result) {
      setImages(result)
    }
    setImageLoading(false)
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
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={imageQuery}
                onChange={e => setImageQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchImages()}
                placeholder="搜索 Unsplash 图片..."
                className="w-full px-3 py-2 pl-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#07C160]"
              />
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <button
              onClick={handleSearchImages}
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
                  setTimeout(handleSearchImages, 100)
                }}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 图片网格 */}
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {images.length > 0 ? (
              images.map(img => (
                <button
                  key={img.id}
                  onClick={() => insertImage(img.url, img.description)}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-[#07C160] group"
                >
                  <img src={img.thumb} alt={img.description} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">点击插入</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-gray-400 text-sm">
                {imageLoading ? '搜索中...' : '输入关键词搜索图片'}
              </div>
            )}
          </div>
          
          <div className="mt-3 text-[10px] text-gray-400 text-center">
            图片来自 Unsplash，请在设置中配置 API Key
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
    </div>
  )
}
