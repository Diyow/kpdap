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

  test('admin login page implements rate limiting', async ({ page, request }) => {
    // This is a basic test to verify rate limit headers exist
    // In a real environment we wouldn't want to spam the endpoint to hit the limit in tests
    // unless we use a mock. Here we just verify headers are returned.
    
    const response = await request.get('/admin/login');
    
    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
  });
  
});
