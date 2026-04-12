// Stub for future product delivery feature
import { create } from 'zustand';

type CartItem = {
  product_id: string;
  name: string;
  qty: number;
  price: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  clearCart: () => void;
  total: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.product_id === item.product_id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === item.product_id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  removeItem: (product_id) =>
    set((state) => ({ items: state.items.filter((i) => i.product_id !== product_id) })),

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));
