// vi: set ts=2 sw=2 sts=2:

const { test, expect } = require('@playwright/test');

test.describe('Login', () => {


  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('login');
  });


  test('Should allow valid admin credentials',  async ({ page }) => {
    await test.step('Fill in and submit form', async () => {
      await page.locator('input[name="ID"]').fill(process.env.userAdminEmail);
      await page.locator('input[name="Password"]').fill(process.env.userAdminPwd);
      await page.getByRole('button', { name: 'Log in' }).click();
    });

    // check redirect page
    await expect(page.locator('.bx-msg-box')).toHaveText('Please Wait');

    // check if cookies have no expiry date (for session only)
    const cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'memberID').expires).toBeLessThan(0);
  });


  test('Should allow regular user credentials',  async ({ page }) => {
    await test.step('Fill in and submit form', async () => {
      await page.locator('input[name="ID"]').fill(process.env.userRegularEmail);
      await page.locator('input[name="Password"]').fill(process.env.userRegularPwd);
      await page.getByRole('button', { name: 'Log in' }).click();
    });

    // check redirect page
    await expect(page.locator('.bx-msg-box')).toHaveText('Please Wait');

    // check if cookies have no expiry date (for session only)
    const cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'memberID').expires).toBeLessThan(0);
  });


  test('Should allow regular user credentials and checked "remember me" checkbox',  async ({ page }) => {
    await test.step('Fill in and submit form', async () => {
      await page.locator('input[name="ID"]').fill(process.env.userRegularEmail);
      await page.locator('input[name="Password"]').fill(process.env.userRegularPwd);
      await page.locator('#bx-form-element-rememberMe .bx-switcher-cont').click();
      await expect(page.locator('#bx-form-element-rememberMe input[name=rememberMe]')).toBeChecked();
      await page.getByRole('button', { name: 'Log in' }).click();
    });

    // check redirect page
    await expect(page.locator('.bx-msg-box')).toHaveText('Please Wait');

    // check if cookies have expiry date
    const cookies = await page.context().cookies();
    expect(cookies.find(c => c.name === 'memberID').expires).toBeGreaterThan(0);
  });


  test('Should not allow invalid user credentials', async ({ page }) => {
    await page.locator('input[name="ID"]').fill(process.env.userInvalidEmail);
    await page.locator('input[name="Password"]').fill(process.env.userInvalidPwd);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText('Entered email or password is incorrect. Please try again.')).toBeVisible();
  });


  test('Should not allow empty user credentials', async ({ page }) => {
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText('Error Occurred')).toBeVisible();
  });


  test('Should allow valid admin credentials (complex check)',  async ({ page }) => {
    await test.step('Fill in and submit form', async () => {
      await page.locator('input[name="ID"]').fill(process.env.userAdminEmail);
      await page.locator('input[name="Password"]').fill(process.env.userAdminPwd);
      await page.getByRole('button', { name: 'Log in' }).click();
    });

    // make sure that there is no "Please Wait" loading screen and user is logged in
    await page.waitForFunction(() => !!document.querySelector('body.bx-user-authorized'));
   
    await test.step('Discard help tour', async () => {
      await page.waitForLoadState(); // we need to make sure that page is loaded, since tour is shown only when page is loaded
      const isTourShown = await page.evaluate(() => !!document.querySelector('[data-shepherd-step-id="tour-homepage"]'));
      if (isTourShown)
        await page.getByRole('button', { name: 'Exit' }).click();
    });

    await test.step('Check logout button', async () => {
      await page.locator('#bx-menu-toolbar-item-account a').click();
      await expect(page.locator('li.bx-menu-item-logout a')).toBeVisible();
    });
  });


});
