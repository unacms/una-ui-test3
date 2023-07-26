const { test, expect } = require('@playwright/test');

const fs = require("fs");
const pathMain = require("path");
const { html5upload, fillFormInput } = require('../../lib/util.js');
const posts = new Array();

for (let i = 1; i <= 17; i++) {
    let path = "../../fixtures/bx_posts/post" + i + '.js';
    path = pathMain.join(__dirname, path);

    if (!fs.existsSync(path)) {
        break;
    }

    posts[i] = require(path);
    test.describe('Posts ' + i, () => {

        test.beforeEach(async ({ page }) => {

            await test.step('Login', async () => {
                await page.context().clearCookies();
                await page.goto('login');
                await page.locator('input[name="ID"]').fill(posts[i].email);
                await page.locator('input[name="Password"]').fill(process.env.userTomPwd);
                await page.getByRole('button', { name: 'Log in' }).click();

                // make sure that there is no "Please Wait" loading screen and user is logged in
                await page.waitForFunction(() => !!document.querySelector('body.bx-user-authorized'));
            });

            await test.step('Discard help tour', async () => {
                await page.waitForLoadState(); // we need to make sure that page is loaded, since tour is shown only when page is loaded
                const isTourShown = await page.evaluate(() => !!document.querySelector('[data-shepherd-step-id="tour-homepage"]'));
                if (isTourShown)
                    await page.getByRole('button', { name: 'Exit' }).click();
            });

        });

        test('Create post ' + i, async ({ page }) => {

            const response = await page.goto(posts[i].uri);
            if (response && 404 == response.status()) { // check if post already isn't exist yet

                await page.goto('create-post');

                // fill in fields
                for await (const [, row] of posts[i].data.entries())
                    await fillFormInput(page, row);

                // upload cover image
                if (typeof (posts[i].cover) !== 'undefined')
                    await html5upload(page, '#bx-form-element-covers .filepond--drop-label', '#bx-form-element-covers .bx-form-input-files-result > .bx-uploader-ghost', posts[i].cover);

                await page.getByRole('button', { name: 'Publish' }).click(); // submit form

                await expect(page.locator('#bx-page-view-post')).toBeVisible(); // ensure that submitted post redirected to the post view page
            }

        });

    });
};

