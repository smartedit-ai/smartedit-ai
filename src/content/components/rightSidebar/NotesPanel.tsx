import { useEffect, useState } from 'react'
import { useRightSidebarStore } from '../../store/rightSidebarStore'

export default function NotesPanel() {
  const { noteContent, setNoteContent } = useRightSidebarStore()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    chrome.storage.local.get(['rightSidebarNotes'], (result) => {
      if (result.rightSidebarNotes) {
        setNoteContent(result.rightSidebarNotes)
      }
    })
  }, [setNoteContent])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await chrome.storage.local.set({ rightSidebarNotes: noteContent })
      setLastSaved(new Date())
      setTimeout(() => setIsSaving(false), 500)
    } catch (error) {
      console.error('保存笔记失败:', error)
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    if (confirm('确定要清空笔记吗？')) {
      setNoteContent('')
      chrome.storage.local.remove('rightSidebarNotes')
      setLastSaved(null)
    }
  }

  const handleExport = () => {
    const blob = new Blob([noteContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `笔记-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">快速笔记</h3>
        <p className="text-xs text-gray-500">随时记录你的想法</p>
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="在这里记录想法、待办事项、灵感..."
          className="flex-1 w-full px-3 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
          style={{ 
            lineHeight: '1.6',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        />

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{noteContent.length} 字符</span>
          {lastSaved && (
            <span>上次保存: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>保存笔记</span>
              </>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={!noteContent}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="导出笔记"
          >
            📤
          </button>
          <button
            onClick={handleClear}
            disabled={!noteContent}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="清空笔记"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
