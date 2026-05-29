import { create } from "zustand";

export const useChatStore = create((set) => ({
  isOpen: false,
  conversationHistory: [],

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, message],
    })),
  setHistory: (history) => set({ conversationHistory: history }),
  clearHistory: () => set({ conversationHistory: [] }),
}));
