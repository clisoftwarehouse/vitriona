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
  carts: Record<string, CartItem[]>;
  addItem: (item: Omit<CartItem, 'quantity'>, businessSlug: string) => void;
  removeItem: (productId: string, businessSlug: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, businessSlug: string, variantId?: string) => void;
  clearCart: (businessSlug: string) => void;
  getItems: (businessSlug: string) => CartItem[];
  getItemCount: (businessSlug: string) => number;
  getTotal: (businessSlug: string) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},

      addItem: (item, businessSlug) => {
        const items = get().carts[businessSlug] ?? [];
        const key = cartKey(item);
        const existing = items.find((i) => cartKey(i) === key);

        const updated = existing
          ? items.map((i) => (cartKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i))
          : [...items, { ...item, quantity: 1 }];

        set({ carts: { ...get().carts, [businessSlug]: updated } });
      },

      removeItem: (productId, businessSlug, variantId) => {
        const items = get().carts[businessSlug] ?? [];
        const key = cartKey({ productId, variantId });
        set({ carts: { ...get().carts, [businessSlug]: items.filter((i) => cartKey(i) !== key) } });
      },

      updateQuantity: (productId, quantity, businessSlug, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, businessSlug, variantId);
          return;
        }
        const items = get().carts[businessSlug] ?? [];
        const key = cartKey({ productId, variantId });
        set({
          carts: { ...get().carts, [businessSlug]: items.map((i) => (cartKey(i) === key ? { ...i, quantity } : i)) },
        });
      },

      clearCart: (businessSlug) => {
        const { [businessSlug]: _removed, ...rest } = get().carts;
        void _removed;
        set({ carts: rest });
      },

      getItems: (businessSlug) => get().carts[businessSlug] ?? [],

      getItemCount: (businessSlug) => (get().carts[businessSlug] ?? []).reduce((sum, i) => sum + i.quantity, 0),

      getTotal: (businessSlug) =>
        (get().carts[businessSlug] ?? []).reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0),
    }),
    {
      name: 'vitriona-cart',
    }
  )
);
