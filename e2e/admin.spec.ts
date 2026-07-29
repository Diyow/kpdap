import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Security & Flow', () => {
  
  test('unauthenticated users are redirected from /admin to /admin/login', async ({ page }) => {
    // Attempt to go to admin directly
    await page.goto('/admin');
    
    // Check that we were redirected to login
    await expect(page).toHaveURL(/.*\/admin\/login/);
    
    // Verify login page content
    await expect(page.getByRole('button', { name: /masuk/i })).toBeVisible();
  });

  test('admin login page renders correctly', async ({ page }) => {
    await page.goto('/admin/login');

    // Verify the login form elements are present
    await expect(page.getByLabel(/alamat email/i)).toBeVisible();
    await expect(page.getByLabel(/kata sandi/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk/i })).toBeVisible();
  });
  
});
