import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../../store/useCartStore';

describe('useCartStore Unit Tests', () => {
  const sampleProduct = {
    id: 1,
    title: 'Kopi Arabika',
    price: 50000,
    image: '/test.jpg'
  };

  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({ items: [], isCartOpen: false, pendingOrderId: null, pendingOrderToken: null });
  });

  it('adds a new item correctly', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, undefined, undefined, 1);
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].id).toBe(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].cartItemId).toBe('1');
  });

  it('increments quantity when adding an existing item', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, undefined, undefined, 1);
    store.addItem(sampleProduct, undefined, undefined, 2);
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(1); // Still 1 unique item
    expect(items[0].quantity).toBe(3); // 1 + 2
  });

  it('treats different variations as separate items', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, '250g', 50000, 1);
    store.addItem(sampleProduct, '500g', 90000, 1);
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(2);
    expect(items[0].cartItemId).toBe('1-250g');
    expect(items[1].cartItemId).toBe('1-500g');
  });

  it('calculates the correct cart total', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, '250g', 50000, 2); // 100,000
    store.addItem(sampleProduct, '500g', 90000, 1); // 90,000
    
    expect(useCartStore.getState().getCartTotal()).toBe(190000);
  });

  it('removes an item by cartItemId', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, undefined, undefined, 1);
    expect(useCartStore.getState().items.length).toBe(1);
    
    store.removeItem('1');
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it('updates quantity with a minimum of 1', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, undefined, undefined, 1);
    
    store.updateQuantity('1', 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
    
    store.updateQuantity('1', -2); // Should clamp to 1
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('updates an item variation and merges if target variation already exists', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, '250g', 50000, 1);
    store.addItem(sampleProduct, '500g', 90000, 1);
    
    // Change the 250g item to 500g. It should merge with the existing 500g item.
    store.updateItemVariation('1-250g', '500g', 90000);
    
    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].cartItemId).toBe('1-500g');
    expect(items[0].quantity).toBe(2);
  });

  it('clears the cart', () => {
    const store = useCartStore.getState();
    store.addItem(sampleProduct, undefined, undefined, 5);
    expect(useCartStore.getState().items.length).toBe(1);
    
    store.clearCart();
    expect(useCartStore.getState().items.length).toBe(0);
  });
});
