// vi: set ts=2 sw=2 sts=2:

const { test, expect } = require('@playwright/test');

test.describe('Login', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('login');
  });

  test('should not allow empty user credentials', async ({ page }) => {
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText('Error Occurred')).toBeVisible();
  });

});
