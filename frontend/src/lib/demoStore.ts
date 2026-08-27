import { create } from 'zustand';

interface DemoState {
  isDemoMode: boolean;
  setDemoMode: (isDemo: boolean) => void;
  toggleDemoMode: () => void;
}

const STORAGE_KEY = 'kukkutpro_demo_mode';

export const useDemoStore = create<DemoState>((set) => ({
  isDemoMode: localStorage.getItem(STORAGE_KEY) === 'true',
  setDemoMode: (isDemo: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(isDemo));
    set({ isDemoMode: isDemo });
  },
  toggleDemoMode: () => {
    set((state) => {
      const next = !state.isDemoMode;
      localStorage.setItem(STORAGE_KEY, String(next));
      return { isDemoMode: next };
    });
  },
}));
