import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from '../app/admin/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin',
}));

// Mock next/dynamic to render the component directly
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<any>) => {
    // Return a simple placeholder component for dynamic imports
    const Component = (props: any) => <div data-testid="dynamic-component">Dashboard</div>;
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

// Mock the child components to simplify testing
vi.mock('../app/admin/components/ProductsManager', () => ({
  default: () => <div data-testid="products-manager">Products</div>
}));
vi.mock('../app/admin/components/ContactInfoManager', () => ({
  default: () => <div data-testid="contact-info-manager">Contact Info</div>
}));
vi.mock('../app/admin/components/AdminsManager', () => ({
  default: () => <div data-testid="admins-manager">Admins</div>
}));
vi.mock('../app/admin/components/CustomersManager', () => ({
  default: () => <div data-testid="customers-manager">Customers</div>
}));
vi.mock('../app/admin/components/OrdersManager', () => ({
  default: () => <div data-testid="orders-manager">Orders</div>
}));
vi.mock('../app/admin/components/AdminLogsManager', () => ({
  default: () => <div data-testid="admin-logs-manager">Admin Logs</div>
}));
vi.mock('../app/admin/components/ArticlesManager', () => ({
  default: () => <div data-testid="articles-manager">Articles</div>
}));

describe('AdminDashboard Component', () => {
  it('renders the dashboard with sidebar navigation', () => {
    render(<AdminDashboard />);
    
    // Check if sidebar contains the current nav items
    expect(screen.getByRole('button', { name: /Ringkasan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pesanan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Produk/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pelanggan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Artikel/i })).toBeInTheDocument();
  });
});
