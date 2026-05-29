import { create } from "zustand";

export const useCartStore = create((set) => ({
  cart: null,

  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: null }),
}));
