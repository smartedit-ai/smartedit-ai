import { useState } from 'react'
import { STYLE_TEMPLATES, STYLE_CATEGORIES, THEME_COLORS } from '../constants'
import { insertStyle } from '../utils'

interface TemplatePanelProps {
  themeColor: string
  setThemeColor: (color: string) => void
}

export default function TemplatePanel({ themeColor, setThemeColor }: TemplatePanelProps) {
  const [styleCategory, setStyleCategory] = useState('titles')

  return (
    <div>
      {/* 样式分类 */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {STYLE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setStyleCategory(cat.id)}
            className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium transition-colors ${
              styleCategory === cat.id
                ? 'text-[#07C160] border-b-2 border-[#07C160]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 一键换色 */}
      <div className="p-3 border-b border-gray-100">
        <div className="text-xs text-gray-500 mb-2">🎨 主题色</div>
        <div className="flex gap-1.5 flex-wrap">
          {THEME_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setThemeColor(color)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                themeColor === color ? 'border-gray-800 scale-110' : 'border-white shadow-sm'
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>

      {/* 样式列表 */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {(STYLE_TEMPLATES[styleCategory as keyof typeof STYLE_TEMPLATES] || []).map((style, i) => (
          <button
            key={i}
            onClick={() => insertStyle(style.html, themeColor)}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#07C160] hover:shadow-md transition-all text-center group"
          >
            <div className="text-lg mb-1 opacity-70 group-hover:opacity-100">{style.preview}</div>
            <div className="text-[10px] text-gray-500">{style.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
