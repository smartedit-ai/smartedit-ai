import { openDB, DBSchema, IDBPDatabase } from 'idb'

// 数据库结构定义
interface SmartEditDB extends DBSchema {
  // 草稿箱
  drafts: {
    key: string
    value: {
      id: string
      title: string
      content: string
      htmlContent: string
      createdAt: string
      updatedAt: string
      tags: string[]
      status: 'draft' | 'published' | 'archived'
    }
    indexes: { 'by-updated': string; 'by-status': string }
  }
  // 素材收藏
  collections: {
    key: string
    value: {
      id: string
      type: 'article' | 'image' | 'title' | 'quote' | 'template'
      title: string
      content: string
      source: string
      sourceUrl: string
      imageUrl?: string
      createdAt: string
      tags: string[]
    }
    indexes: { 'by-type': string; 'by-created': string }
  }
  // 历史记录
  history: {
    key: string
    value: {
      id: string
      action: 'create' | 'edit' | 'publish' | 'delete'
      targetId: string
      targetType: 'draft' | 'collection'
      title: string
      timestamp: string
      snapshot?: string
    }
    indexes: { 'by-timestamp': string }
  }
}

const DB_NAME = 'smartedit-storage'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<SmartEditDB> | null = null

// 初始化数据库
async function getDB(): Promise<IDBPDatabase<SmartEditDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<SmartEditDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建草稿表
      if (!db.objectStoreNames.contains('drafts')) {
        const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' })
        draftsStore.createIndex('by-updated', 'updatedAt')
        draftsStore.createIndex('by-status', 'status')
      }

      // 创建收藏表
      if (!db.objectStoreNames.contains('collections')) {
        const collectionsStore = db.createObjectStore('collections', { keyPath: 'id' })
        collectionsStore.createIndex('by-type', 'type')
        collectionsStore.createIndex('by-created', 'createdAt')
      }

      // 创建历史记录表
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' })
        historyStore.createIndex('by-timestamp', 'timestamp')
      }
    }
  })

  return dbInstance
}

// 生成唯一 ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ==================== 草稿管理 ====================

export interface Draft {
  id: string
  title: string
  content: string
  htmlContent: string
  createdAt: string
  updatedAt: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
}

// 保存草稿
export async function saveDraft(draft: Partial<Draft> & { title: string; content: string }): Promise<Draft> {
  const db = await getDB()
  const now = new Date().toISOString()

  const fullDraft: Draft = {
    id: draft.id || generateId(),
    title: draft.title,
    content: draft.content,
    htmlContent: draft.htmlContent || '',
    createdAt: draft.createdAt || now,
    updatedAt: now,
    tags: draft.tags || [],
    status: draft.status || 'draft'
  }

  await db.put('drafts', fullDraft)

  // 记录历史
  await addHistory({
    action: draft.id ? 'edit' : 'create',
    targetId: fullDraft.id,
    targetType: 'draft',
    title: fullDraft.title
  })

  return fullDraft
}

// 获取所有草稿
export async function getAllDrafts(status?: Draft['status']): Promise<Draft[]> {
  const db = await getDB()
  
  if (status) {
    return db.getAllFromIndex('drafts', 'by-status', status)
  }
  
  const drafts = await db.getAll('drafts')
  return drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

// 获取单个草稿
export async function getDraft(id: string): Promise<Draft | undefined> {
  const db = await getDB()
  return db.get('drafts', id)
}

// 删除草稿
export async function deleteDraft(id: string): Promise<void> {
  const db = await getDB()
  const draft = await db.get('drafts', id)
  
  if (draft) {
    await addHistory({
      action: 'delete',
      targetId: id,
      targetType: 'draft',
      title: draft.title,
      snapshot: JSON.stringify(draft)
    })
  }
  
  await db.delete('drafts', id)
}

// 更新草稿状态
export async function updateDraftStatus(id: string, status: Draft['status']): Promise<void> {
  const db = await getDB()
  const draft = await db.get('drafts', id)
  
  if (draft) {
    draft.status = status
    draft.updatedAt = new Date().toISOString()
    await db.put('drafts', draft)

    if (status === 'published') {
      await addHistory({
        action: 'publish',
        targetId: id,
        targetType: 'draft',
        title: draft.title
      })
    }
  }
}

// ==================== 素材收藏 ====================

export interface Collection {
  id: string
  type: 'article' | 'image' | 'title' | 'quote' | 'template'
  title: string
  content: string
  source: string
  sourceUrl: string
  imageUrl?: string
  createdAt: string
  tags: string[]
}

// 添加收藏
export async function addCollection(item: Omit<Collection, 'id' | 'createdAt'>): Promise<Collection> {
  const db = await getDB()
  
  const collection: Collection = {
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString()
  }

  await db.put('collections', collection)

  await addHistory({
    action: 'create',
    targetId: collection.id,
    targetType: 'collection',
    title: collection.title
  })

  return collection
}

// 获取所有收藏
export async function getAllCollections(type?: Collection['type']): Promise<Collection[]> {
  const db = await getDB()
  
  if (type) {
    return db.getAllFromIndex('collections', 'by-type', type)
  }
  
  const collections = await db.getAll('collections')
  return collections.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// 获取单个收藏
export async function getCollection(id: string): Promise<Collection | undefined> {
  const db = await getDB()
  return db.get('collections', id)
}

// 删除收藏
export async function deleteCollection(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('collections', id)
}

// 检查是否已收藏（通过 URL 或标题）
export async function isCollected(sourceUrl: string): Promise<boolean> {
  const db = await getDB()
  const all = await db.getAll('collections')
  return all.some(item => item.sourceUrl === sourceUrl)
}

// ==================== 历史记录 ====================

interface HistoryItem {
  id: string
  action: 'create' | 'edit' | 'publish' | 'delete'
  targetId: string
  targetType: 'draft' | 'collection'
  title: string
  timestamp: string
  snapshot?: string
}

// 添加历史记录
async function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDB()
  
  await db.put('history', {
    ...item,
    id: generateId(),
    timestamp: new Date().toISOString()
  })

  // 只保留最近 100 条历史记录
  const allHistory = await db.getAllFromIndex('history', 'by-timestamp')
  if (allHistory.length > 100) {
    const toDelete = allHistory.slice(0, allHistory.length - 100)
    for (const h of toDelete) {
      await db.delete('history', h.id)
    }
  }
}

// 获取历史记录
export async function getHistory(limit = 50): Promise<HistoryItem[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('history', 'by-timestamp')
  return all.reverse().slice(0, limit)
}

// ==================== 数据导入导出 ====================

export interface ExportData {
  version: string
  exportedAt: string
  drafts: Draft[]
  collections: Collection[]
}

// 导出所有数据
export async function exportAllData(): Promise<ExportData> {
  const drafts = await getAllDrafts()
  const collections = await getAllCollections()

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    drafts,
    collections
  }
}

// 导入数据
export async function importData(data: ExportData, merge = true): Promise<{ drafts: number; collections: number }> {
  const db = await getDB()
  let draftsCount = 0
  let collectionsCount = 0

  // 如果不是合并模式，先清空
  if (!merge) {
    const allDrafts = await db.getAll('drafts')
    for (const d of allDrafts) {
      await db.delete('drafts', d.id)
    }
    const allCollections = await db.getAll('collections')
    for (const c of allCollections) {
      await db.delete('collections', c.id)
    }
  }

  // 导入草稿
  for (const draft of data.drafts || []) {
    if (merge) {
      const existing = await db.get('drafts', draft.id)
      if (existing) {
        // 如果已存在且更新时间更早，则跳过
        if (new Date(existing.updatedAt) >= new Date(draft.updatedAt)) {
          continue
        }
      }
    }
    await db.put('drafts', draft)
    draftsCount++
  }

  // 导入收藏
  for (const collection of data.collections || []) {
    if (merge) {
      const existing = await db.get('collections', collection.id)
      if (existing) continue
    }
    await db.put('collections', collection)
    collectionsCount++
  }

  return { drafts: draftsCount, collections: collectionsCount }
}

// 导出为 Markdown（单个草稿）
export function draftToMarkdown(draft: Draft): string {
  const frontmatter = `---
title: "${draft.title}"
created: ${draft.createdAt}
updated: ${draft.updatedAt}
status: ${draft.status}
tags: [${draft.tags.map(t => `"${t}"`).join(', ')}]
---

`
  return frontmatter + draft.content
}

// 导出为 Markdown（单个收藏）
export function collectionToMarkdown(item: Collection): string {
  const frontmatter = `---
title: "${item.title}"
type: ${item.type}
source: "${item.source}"
sourceUrl: "${item.sourceUrl}"
created: ${item.createdAt}
tags: [${item.tags.map(t => `"${t}"`).join(', ')}]
---

`
  return frontmatter + item.content
}

// 获取存储统计
export async function getStorageStats(): Promise<{
  draftsCount: number
  collectionsCount: number
  historyCount: number
}> {
  const db = await getDB()
  
  return {
    draftsCount: await db.count('drafts'),
    collectionsCount: await db.count('collections'),
    historyCount: await db.count('history')
  }
}

// 清空所有数据
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  
  const drafts = await db.getAll('drafts')
  for (const d of drafts) {
    await db.delete('drafts', d.id)
  }
  
  const collections = await db.getAll('collections')
  for (const c of collections) {
    await db.delete('collections', c.id)
  }
  
  const history = await db.getAll('history')
  for (const h of history) {
    await db.delete('history', h.id)
  }
}
