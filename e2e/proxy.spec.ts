import { test, expect } from '@playwright/test';

test.describe('Proxy RBAC Validation', () => {
  
  test('unauthenticated users are redirected from /admin to /admin/login', async ({ page }) => {
    // Attempt to go to admin directly
    await page.goto('/admin');
    
    // Check that we were redirected to login
    await expect(page).toHaveURL(/.*\/admin\/login/);
    
    // Verify login page content
    await expect(page.getByRole('heading', { name: /portal admin/i })).toBeVisible();
  });

});
