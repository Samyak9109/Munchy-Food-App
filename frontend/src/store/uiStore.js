import { create } from "zustand";

// global UI state — loading, toasts, modals
export const useUIStore = create((set) => ({
  isLoading: false,
  toast: null,

  setLoading: (isLoading) => set({ isLoading }),
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000); // auto dismiss
  },
  clearToast: () => set({ toast: null }),
}));
