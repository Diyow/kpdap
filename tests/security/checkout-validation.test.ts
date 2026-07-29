import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/checkout/route';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({
      data: [{ id: 1, price: 50000, stock: 10, weight: 500 }],
      error: null
    }),
    insert: vi.fn().mockResolvedValue({
      data: [{ id: 'order-123' }],
      error: null
    })
  }))
}));

vi.mock('../../utils/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, reset_time: '' }),
  getIpAddress: vi.fn().mockReturnValue('127.0.0.1')
}));

// Helper to create a mock Request
const createRequest = (body: any) => {
  return new Request('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
};

describe('Checkout API - Validation & Security', () => {
  const validPayload = {
    items: [{ id: 1, quantity: 2 }],
    customer: { name: 'Budi', phone: '08123456789' },
    shipping_details: { destination: 'Jakarta', courier: 'jne', weight: 1000 },
    shipping_cost: 15000
  };

  it('rejects empty items array', async () => {
    const req = createRequest({ ...validPayload, items: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/kosong/i);
  });

  it('rejects missing or invalid product IDs', async () => {
    const req = createRequest({ ...validPayload, items: [{ id: null, quantity: 1 }] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/ID produk tidak valid/i);
  });

  it('rejects negative or zero quantities', async () => {
    const req = createRequest({ ...validPayload, items: [{ id: 1, quantity: 0 }] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Jumlah produk/i);
  });

  it('rejects quantities over the maximum limit (100)', async () => {
    const req = createRequest({ ...validPayload, items: [{ id: 1, quantity: 101 }] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Jumlah produk/i);
  });

  it('rejects missing customer details', async () => {
    const req = createRequest({ ...validPayload, customer: { name: '', phone: '' } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Nama dan nomor telepon/i);
  });

  it('rejects missing shipping details', async () => {
    const req = createRequest({ ...validPayload, shipping_details: null });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/Detail pengiriman wajib/i);
  });
});
