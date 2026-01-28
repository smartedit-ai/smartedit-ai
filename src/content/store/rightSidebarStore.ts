import { create } from 'zustand'

export type RightSidebarTab = 'quickTools' | 'notes' | 'aiAssist' | 'pageInfo' | 'bookmarks'

interface RightSidebarState {
  isOpen: boolean
  activeTab: RightSidebarTab
  noteContent: string
  pageContent: string
  
  // Actions
  setIsOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
  setActiveTab: (tab: RightSidebarTab) => void
  setNoteContent: (content: string) => void
  setPageContent: (content: string) => void
  reset: () => void
}

const initialState = {
  isOpen: false,
  activeTab: 'quickTools' as RightSidebarTab,
  noteContent: '',
  pageContent: '',
}

export const useRightSidebarStore = create<RightSidebarState>((set) => ({
  ...initialState,
  
  setIsOpen: (isOpen) => set({ isOpen }),
  
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  
  setActiveTab: (activeTab) => set({ activeTab }),
  
  setNoteContent: (noteContent) => set({ noteContent }),
  
  setPageContent: (pageContent) => set({ pageContent }),
  
  reset: () => set(initialState),
}))
