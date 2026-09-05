import { create } from 'zustand';

export const useAppStore = create((set) => ({
  globalSearch: '',
  setGlobalSearch: (term) => set({ globalSearch: term }),
  
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
