import { create } from 'zustand';

// Tiny toast system — replaces alert() across the app.
// One store, one component, no dependencies. Messages are pushed and
// auto-dismissed after a short delay.
export const useToastStore = create((set, get) => ({
  toasts: [],

  push: (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  success: (message, duration) => get().push(message, 'success', duration),
  error: (message, duration) => get().push(message, 'error', duration),
  info: (message, duration) => get().push(message, 'info', duration),
}));

export default useToastStore;