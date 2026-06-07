import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cart: null,
  itemCount: 0,

  setCart: (cart) => {
    const count = cart?.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
    set({ cart, itemCount: count });
  },

  clearCart: () => set({ cart: null, itemCount: 0 }),
}));
