import { create } from "zustand";
import { persist } from "zustand/middleware";

// persisted — survives page refresh
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      role: null,

      setAuth: (user, accessToken, role) => set({ user, accessToken, role }),
      updateUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, accessToken: null, role: null }),
    }),
    {
      name: "munchy-auth", // localStorage key
    },
  ),
);
