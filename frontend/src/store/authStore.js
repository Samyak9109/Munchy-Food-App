import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      role: null, // 'user' | 'partner'

      setAuth: (user, accessToken, role) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, role });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, role: null });
      },

      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.user && !!state.accessToken;
      },
    }),
    {
      name: 'munchy-auth',
      partialize: (s) => ({ user: s.user, role: s.role, accessToken: s.accessToken }),
    }
  )
);
