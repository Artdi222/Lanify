import { create } from 'zustand';

/**
 * Song progress (0-100) for the HUD. Lives outside useGameStore and outside React state of the play page so
 * a progress tick re-renders only the progress indicator, not the whole page.
 */
interface ProgressState {
  progress: number;
  setProgress: (progress: number) => void;
}

export const useProgressStore = create<ProgressState>()((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
