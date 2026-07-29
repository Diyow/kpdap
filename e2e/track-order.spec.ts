import { test, expect } from '@playwright/test';

test.describe('E2E Track Order Flow', () => {
  test('User can track an existing order and get redirected to success page', async ({ page }) => {
    // 1. Navigate to the track order page
    await page.goto('/track-order');
    // Wait for Next.js to finish hydrating (prevents native form submit on WebKit)
    await page.waitForTimeout(1000);

    // 2. Verify the page renders correctly
    await expect(page.locator('h1', { hasText: 'Cek Pesanan' })).toBeVisible();

    // 3. Mock the /api/order/get endpoint to simulate a found order
    await page.route('**/api/order/get', async route => {
      const json = { order: { id: 'test-order-123' } };
      await route.fulfill({ json });
    });

    // 4. Fill in the form
    await page.getByPlaceholder(/Contoh: b90/i).fill('test-order-123');
    await page.getByPlaceholder(/Nomor WA atau Email/i).fill('08123456789');

    // 5. Submit the form
    await page.locator('button', { hasText: 'Lacak Pesanan' }).click();
    
    // 6. Verify it redirects to the success page with the order_id query param
    await expect(page).toHaveURL(/.*\/checkout\/success\?order_id=test-order-123/);
  });

  test('User sees an error when order is not found', async ({ page }) => {
    // 1. Navigate to the track order page
    await page.goto('/track-order');
    // Wait for Next.js to finish hydrating
    await page.waitForTimeout(1000);

    // 2. Mock the /api/order/get endpoint to simulate a not found order
    await page.route('**/api/order/get', async route => {
      const json = { error: 'Pesanan tidak ditemukan' };
      await route.fulfill({ status: 404, json });
    });

    // 3. Fill in the form with invalid data
    await page.getByPlaceholder(/Contoh: b90/i).fill('invalid-order');
    await page.getByPlaceholder(/Nomor WA atau Email/i).fill('wrong-contact');

    // 4. Submit the form
    await page.locator('button', { hasText: 'Lacak Pesanan' }).click();
    
    // 5. Verify the error message is displayed
    await expect(page.locator('text=Pesanan tidak ditemukan')).toBeVisible();
    
    // 6. Verify we are still on the track order page (no redirect)
    await expect(page).toHaveURL(/.*\/track-order/);
  });
});
