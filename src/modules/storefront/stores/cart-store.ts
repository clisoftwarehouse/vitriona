import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string;
  variantName?: string;
  name: string;
  slug: string;
  price: string;
  imageUrl: string | null;
  quantity: number;
}

function cartKey(item: { productId: string; variantId?: string }) {
  return item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
}

interface CartState {
  items: CartItem[];
  businessSlug: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, businessSlug: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
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

        const key = cartKey(item);
        const existing = items.find((i) => cartKey(i) === key);
        if (existing) {
          set({
            items: items.map((i) => (cartKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i)),
            businessSlug,
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }], businessSlug });
        }
      },

      removeItem: (productId, variantId) => {
        const key = cartKey({ productId, variantId });
        set({ items: get().items.filter((i) => cartKey(i) !== key) });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        const key = cartKey({ productId, variantId });
        set({
          items: get().items.map((i) => (cartKey(i) === key ? { ...i, quantity } : i)),
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
