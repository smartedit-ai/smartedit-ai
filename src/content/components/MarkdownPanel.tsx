import { autoFormatMarkdown, getEditor } from '../utils'

interface MarkdownPanelProps {
  themeColor: string
}

export default function MarkdownPanel({ themeColor }: MarkdownPanelProps) {
  return (
    <div className="p-4">
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 mb-4">
        <div className="text-sm font-medium text-gray-800 mb-1">📝 Markdown 排版</div>
        <div className="text-xs text-gray-500">
          支持将 Markdown 语法转换为精美排版
        </div>
      </div>
      
      <div className="space-y-3">
        <button 
          onClick={() => autoFormatMarkdown(themeColor)}
          className="w-full p-3 bg-[#07C160] text-white rounded-lg text-sm font-medium hover:bg-[#06AD56]"
        >
          ✨ 一键转换 Markdown
        </button>
        <button 
          onClick={() => {
            const editor = getEditor()
            if (editor) {
              editor.querySelectorAll('p').forEach(p => {
                const el = p as HTMLElement
                el.style.fontSize = '15px'
                el.style.lineHeight = '2'
                el.style.marginBottom = '16px'
                el.style.textIndent = '2em'
              })
              alert('自动排版完成')
            }
          }}
          className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          🎨 自动美化排版
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-3">支持的 Markdown 语法</div>
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex justify-between">
            <code className="bg-gray-200 px-1 rounded"># 标题</code>
            <span>一级标题</span>
          </div>
          <div className="flex justify-between">
            <code className="bg-gray-200 px-1 rounded">## 标题</code>
            <span>二级标题</span>
          </div>
          <div className="flex justify-between">
            <code className="bg-gray-200 px-1 rounded">**加粗**</code>
            <span>加粗文字</span>
          </div>
          <div className="flex justify-between">
            <code className="bg-gray-200 px-1 rounded">*斜体*</code>
            <span>斜体文字</span>
          </div>
          <div className="flex justify-between">
            <code className="bg-gray-200 px-1 rounded">&gt; 引用</code>
            <span>引用块</span>
          </div>
          <div className="flex justify-between">
            <code className="bg-gray-200 px-1 rounded">---</code>
            <span>分割线</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="text-xs font-medium text-blue-700 mb-2">💡 快捷键提示</div>
        <div className="text-xs text-blue-600 space-y-1">
          <div>Ctrl+B 加粗</div>
          <div>Ctrl+I 斜体</div>
          <div>Ctrl+U 下划线</div>
        </div>
      </div>
    </div>
  )
}
