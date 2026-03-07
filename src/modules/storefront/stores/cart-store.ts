import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: string;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  businessSlug: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, businessSlug: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      businessSlug: null,

      addItem: (item, businessSlug) => {
        const { items, businessSlug: currentSlug } = get();

        // If switching to a different business, clear the cart
        if (currentSlug && currentSlug !== businessSlug) {
          set({ items: [{ ...item, quantity: 1 }], businessSlug });
          return;
        }

        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i)),
            businessSlug,
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }], businessSlug });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        });
      },

      clearCart: () => set({ items: [], businessSlug: null }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotal: () => get().items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),
    }),
    {
      name: 'vitriona-cart',
    }
  )
);
