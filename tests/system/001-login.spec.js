// vi: set ts=2 sw=2 sts=2:

const { test, expect } = require("@playwright/test");
const {
    checkRedirectPage,
    checkCookiesHaveExpiryDate,
    preLogin,
    login,
    logout,
    discardHelpTour,
} = require("../../lib/util");

test.describe("Login", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("login");
    });

    test.afterEach(async ({ page }) => {
        await page.context().clearCookies();
    });

    test("Should allow valid admin credentials", async ({ page }) => {
        await test.step("Fill in and submit form", async () => {
            await preLogin(
                page,
                process.env.userAdminEmail,
                process.env.userAdminPwd
            );
        });

        await test.step("Check redirect page", async () => {
            await checkRedirectPage(page);
        });

        await test.step("Check cookies have no expiry date", async () => {
            await checkCookiesHaveExpiryDate(page, false);
        });
    });

    test("Should allow regular user credentials", async ({ page }) => {
        await test.step("Fill in and submit form", async () => {
            await preLogin(
                page,
                process.env.userRegularEmail,
                process.env.userRegularPwd
            );
        });

        await test.step("Check redirect page", async () => {
            await checkRedirectPage(page);
        });

        await test.step("Check cookies have no expiry date", async () => {
            await checkCookiesHaveExpiryDate(page, false);
        });
    });

    test('Should allow regular user credentials and checked "remember me" checkbox', async ({
        page,
    }) => {
        await test.step("Fill in and submit form", async () => {
            await preLogin(
                page,
                process.env.userRegularEmail,
                process.env.userRegularPwd,
                true
            );
        });

        await test.step("Check redirect page", async () => {
            await checkRedirectPage(page);
        });

        await test.step("Check cookies have expiry date", async () => {
            await checkCookiesHaveExpiryDate(page, true);
        });
    });

    test("Should not allow invalid user credentials", async ({ page }) => {
        await page
            .locator('input[name="ID"]')
            .fill(process.env.userInvalidEmail);
        await page
            .locator('input[name="Password"]')
            .fill(process.env.userInvalidPwd);

        await page.locator('button[name="login"]').click();

        const warnLocator = page.locator("#bx-form-element-ID .bx-form-warn");
        await expect(warnLocator).toBeVisible();
    });

    test("Should not allow empty user credentials", async ({ page }) => {
        await page.locator('button[name="login"]').click();
        await expect(page.getByText("Error Occurred")).toBeVisible();
    });

    test("Should allow valid admin credentials (complex check)", async ({
        page,
    }) => {
        await test.step("Fill in and submit form", async () => {
            await login(
                page,
                process.env.userAdminEmail,
                process.env.userAdminPwd
            );
        });

        await test.step("Discard help tour", async () => {
            await discardHelpTour(page);
        });

        await test.step("Check logout button", async () => {
            await logout(page);
        });
    });
});
