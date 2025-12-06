import { FORMAT_TEMPLATES } from '../constants'
import { applyTemplate, clearFormat, addIndent, adjustLineHeight, adjustParagraphSpacing } from '../utils'

interface ToolPanelProps {
  themeColor: string
}

export default function ToolPanel({ themeColor }: ToolPanelProps) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500 mb-2">一键排版</div>
      {FORMAT_TEMPLATES.map(item => (
        <button
          key={item.name}
          onClick={() => applyTemplate(item.name, themeColor)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#07C160] text-left flex items-center gap-3"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center text-white text-sm">{item.icon}</span>
          <div>
            <div className="text-sm font-medium text-gray-800">{item.name}</div>
            <div className="text-[10px] text-gray-500">{item.desc}</div>
          </div>
        </button>
      ))}

      <div className="border-t border-gray-100 pt-3 mt-4">
        <div className="text-xs text-gray-500 mb-2">快捷操作</div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={clearFormat}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
          >
            🧹 清除格式
          </button>
          <button 
            onClick={addIndent}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
          >
            📐 首行缩进
          </button>
          <button 
            onClick={() => adjustLineHeight('2')}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
          >
            📏 行高 2.0
          </button>
          <button 
            onClick={() => adjustParagraphSpacing('20px')}
            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#07C160]"
          >
            📄 段落间距
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 mt-4">
        <div className="text-xs text-gray-500 mb-2">更多行高选项</div>
        <div className="flex gap-2">
          {['1.5', '1.75', '2', '2.2', '2.5'].map(h => (
            <button
              key={h}
              onClick={() => adjustLineHeight(h)}
              className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-[#07C160] hover:text-white"
            >
              {h}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
