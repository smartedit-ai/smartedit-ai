/**
 * Obsidian Local REST API 集成
 * 需要用户安装 Obsidian 插件: https://github.com/coddingtonbear/obsidian-local-rest-api
 */

export interface ObsidianConfig {
  enabled: boolean
  apiUrl: string
  apiKey: string
  defaultPath: string
  autoSync: boolean
}

export const defaultObsidianConfig: ObsidianConfig = {
  enabled: false,
  apiUrl: 'https://localhost:27124',
  apiKey: '',
  defaultPath: '公众号',
  autoSync: false
}

export interface ObsidianStatus {
  connected: boolean
  authenticated: boolean
  vaultName?: string
  error?: string
}

export interface ObsidianSearchResult {
  filename: string
  path: string
  matches: string[]
  score: number
}

export class ObsidianClient {
  private config: ObsidianConfig

  constructor(config: ObsidianConfig) {
    this.config = config
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'text/markdown'
    }
  }

  async testConnection(): Promise<ObsidianStatus> {
    try {
      const response = await fetch(`${this.config.apiUrl}/`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      })

      if (response.ok) {
        const data = await response.json()
        return {
          connected: true,
          authenticated: true,
          vaultName: data.name || 'Unknown'
        }
      } else if (response.status === 401) {
        return { connected: true, authenticated: false, error: 'API Key 无效' }
      } else {
        return { connected: false, authenticated: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      const err = error as Error
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        return { connected: false, authenticated: false, error: 'Obsidian 未运行或插件未启用' }
      }
      return { connected: false, authenticated: false, error: err.message }
    }
  }

  async saveNote(path: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fullPath = path.endsWith('.md') ? path : `${path}.md`
      const response = await fetch(`${this.config.apiUrl}/vault/${encodeURIComponent(fullPath)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: content
      })

      if (response.ok) {
        return { success: true }
      } else {
        const text = await response.text()
        return { success: false, error: text || `HTTP ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async getNote(path: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const fullPath = path.endsWith('.md') ? path : `${path}.md`
      const response = await fetch(`${this.config.apiUrl}/vault/${encodeURIComponent(fullPath)}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      })

      if (response.ok) {
        const content = await response.text()
        return { success: true, content }
      } else if (response.status === 404) {
        return { success: false, error: '文件不存在' }
      } else {
        return { success: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async listFiles(path: string = '/'): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/vault/${encodeURIComponent(path)}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, files: data.files || [] }
      } else {
        return { success: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async search(query: string): Promise<{ success: boolean; results?: ObsidianSearchResult[]; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/search/simple/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, results: data }
      } else {
        return { success: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async appendToNote(path: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fullPath = path.endsWith('.md') ? path : `${path}.md`
      const response = await fetch(`${this.config.apiUrl}/vault/${encodeURIComponent(fullPath)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'text/markdown',
          'Content-Insertion-Position': 'end'
        },
        body: '\n\n' + content
      })

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }

  async deleteNote(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fullPath = path.endsWith('.md') ? path : `${path}.md`
      const response = await fetch(`${this.config.apiUrl}/vault/${encodeURIComponent(fullPath)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      })

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
}

export function formatAsObsidianNote(
  title: string,
  content: string,
  metadata: {
    type?: string
    source?: string
    sourceUrl?: string
    tags?: string[]
    created?: string
  } = {}
): string {
  const now = new Date().toISOString()
  let note = '---\n'
  note += `title: "${title}"\n`
  note += `created: ${metadata.created || now}\n`
  if (metadata.type) note += `type: ${metadata.type}\n`
  if (metadata.source) note += `source: "[[${metadata.source}]]"\n`
  if (metadata.sourceUrl) note += `url: "${metadata.sourceUrl}"\n`
  note += `tags:\n  - 公众号\n`
  if (metadata.type) note += `  - ${metadata.type}\n`
  if (metadata.tags) {
    metadata.tags.forEach(tag => {
      note += `  - ${tag}\n`
    })
  }
  note += '---\n\n'
  note += `# ${title}\n\n`
  if (metadata.source && metadata.sourceUrl) {
    note += `> 来源：[[${metadata.source}]] | [原文链接](${metadata.sourceUrl})\n\n`
  }
  note += content
  return note
}
