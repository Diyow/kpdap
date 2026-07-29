import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from '../../proxy';
import { NextRequest } from 'next/server';

// We need to mock next/server
vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: vi.fn().mockReturnValue({ cookies: { set: vi.fn() } }),
      redirect: vi.fn((url) => ({ status: 307, url: url.toString() }))
    },
    NextRequest: vi.fn()
  };
});

// We need to mock @supabase/ssr
let mockUser: any = null;
let mockAdminRole: any = null;

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: mockAdminRole }))
        }))
      }))
    }))
  }))
}));

const createMockRequest = (pathname: string) => {
  const url = new URL(`http://localhost:3000${pathname}`);
  return {
    nextUrl: {
      pathname,
      clone: () => new URL(url.toString())
    },
    cookies: {
      getAll: vi.fn().mockReturnValue([])
    }
  } as unknown as NextRequest;
};

describe('Proxy Middleware RBAC', () => {
  beforeEach(() => {
    mockUser = null;
    mockAdminRole = null;
    vi.clearAllMocks();
  });

  it('allows access to non-admin routes without auth', async () => {
    const req = createMockRequest('/products');
    const res: any = await proxy(req);
    // Should return the NextResponse.next() object, not a redirect
    expect(res.status).toBeUndefined(); 
  });

  it('redirects unauthenticated users from /admin to /admin/login', async () => {
    const req = createMockRequest('/admin/dashboard');
    mockUser = null; // Unauthenticated
    const res: any = await proxy(req);
    
    expect(res.status).toBe(307);
    expect(res.url).toContain('/admin/login');
  });

  it('redirects authenticated non-admin users from /admin to /', async () => {
    const req = createMockRequest('/admin/dashboard');
    mockUser = { id: 'user-123', app_metadata: {} };
    const res: any = await proxy(req);
    
    expect(res.status).toBe(307);
    expect(res.url.endsWith('/')).toBe(true);
  });

  it('allows authenticated admins to access /admin', async () => {
    const req = createMockRequest('/admin/dashboard');
    mockUser = { id: 'admin-123', app_metadata: { role: 'admin' } };
    const res: any = await proxy(req);
    
    // Should pass through (no redirect)
    expect(res.status).toBeUndefined();
  });

  it('allows access to /admin/login without auth', async () => {
    const req = createMockRequest('/admin/login');
    const res: any = await proxy(req);
    expect(res.status).toBeUndefined();
  });
});
