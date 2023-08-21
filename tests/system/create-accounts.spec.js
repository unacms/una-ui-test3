// vi: set ts=2 sw=2 sts=2:

const { test } = require('@playwright/test');
const { fillFormInput } = require('../../lib/util.js');
const Accounts = require("../../fixtures/system/accounts");

// loop through Create Account tests
for (let i = 0; i < Accounts.data.length; i++) {

    test.describe('Accounts_' + i, () => {

        test('Should allow create accounts', async ({ page }) => {

            // before each
            await page.context().clearCookies();
            await page.goto('create-account');

            // fill in name, email
            for (const [, row] of Accounts.data[i].entries()) {
                await fillFormInput(page, row);
            };

            // fill in password
            await page.locator('input[name="password"]').fill(process.env.userTomPwd);

            // Click Submit
            await page.locator("button[name='do_publish']").click();

            // check if account exists
            const isAccountExists = await page.evaluate(() => !document.querySelector('#bx-form-element-email .bx-form-warn'));
            if (isAccountExists) {
                return;
            }

            // click logout button
            await page.locator('#bx-menu-toolbar-item-account a').click();
            await page.locator('li.bx-menu-item-logout a').click();

        });

    });

};

