import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from '../app/admin/page';

// Mock the child components to simplify testing
vi.mock('../app/admin/components/ProductsManager', () => ({
  default: () => <div data-testid="products-manager">Products</div>
}));
vi.mock('../app/admin/components/BusinessUnitsManager', () => ({
  default: () => <div data-testid="business-units-manager">Business Units</div>
}));
vi.mock('../app/admin/components/ContactInfoManager', () => ({
  default: () => <div data-testid="contact-info-manager">Contact Info</div>
}));

describe('AdminDashboard Component', () => {
  it('renders the dashboard with sidebar navigation', () => {
    render(<AdminDashboard />);
    
    // Check if Ringkasan is active by default
    expect(screen.getByText('Ringkasan Dasbor')).toBeInTheDocument();
    
    // Check if sidebar contains the tabs
    expect(screen.getByRole('button', { name: /Ringkasan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Produk/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unit Bisnis/i })).toBeInTheDocument();
  });
});
