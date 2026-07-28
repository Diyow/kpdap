import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  cartItemId: string; // id + variation
  id: number;
  title: string;
  price: number;
  image: string;
  quantity: number;
  variation?: string;
  weight?: number;
  availableVariations?: { name: string; price: number }[];
};

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (product: Omit<CartItem, 'quantity' | 'cartItemId'>, variation?: string, price?: number, quantity?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemVariation: (oldCartItemId: string, newVariation: string, newPrice: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  setIsCartOpen: (isOpen: boolean) => void;
  pendingOrderId: string | null;
  pendingOrderToken: string | null;
  setPendingOrderId: (id: string | null, token?: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      pendingOrderId: null,
      pendingOrderToken: null,
      setPendingOrderId: (id, token = null) => set({ pendingOrderId: id, pendingOrderToken: token }),
      setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      addItem: (product, variation, price, qty = 1) => {
        const currentItems = get().items;
        
        // Generate a unique cart item ID based on product ID and its chosen variation
        const cartItemId = `${product.id}${variation ? '-' + variation : ''}`;
        const finalPrice = price !== undefined ? price : product.price;
        
        const existingItem = currentItems.find((item) => item.cartItemId === cartItemId);
        
        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity + qty }
                : item
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, cartItemId, variation, price: finalPrice, quantity: qty }] });
        }
      },
      removeItem: (cartItemId) => {
        set({ items: get().items.filter((item) => item.cartItemId !== cartItemId) });
      },
      updateQuantity: (cartItemId, quantity) => {
        set({
          items: get().items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        });
      },
      updateItemVariation: (oldCartItemId, newVariation, newPrice) => {
        const currentItems = get().items;
        const itemToUpdate = currentItems.find(i => i.cartItemId === oldCartItemId);
        if (!itemToUpdate) return;

        const newCartItemId = `${itemToUpdate.id}-${newVariation}`;
        
        // Check if the new variation already exists in the cart
        const existingNewItem = currentItems.find(i => i.cartItemId === newCartItemId);

        if (existingNewItem) {
          // Merge quantities and remove the old item
          set({
            items: currentItems
              .map(item => 
                item.cartItemId === newCartItemId 
                  ? { ...item, quantity: item.quantity + itemToUpdate.quantity } 
                  : item
              )
              .filter(item => item.cartItemId !== oldCartItemId)
          });
        } else {
          // Update the existing item with new variation, price, and ID
          set({
            items: currentItems.map(item => 
              item.cartItemId === oldCartItemId
                ? { ...item, cartItemId: newCartItemId, variation: newVariation, price: newPrice }
                : item
            )
          });
        }
      },
      clearCart: () => set({ items: [] }),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'kpdap-cart-storage', // name of the item in the storage (must be unique)
    }
  )
);
