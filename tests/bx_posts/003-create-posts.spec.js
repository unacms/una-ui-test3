const { test, expect } = require('@playwright/test');

const fs = require("fs");
const pathMain = require("path");
const { login, html5upload, fillFormInput, discardHelpTour, logout } = require('../../lib/util.js');
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
            await test.step('Login' + i, async () => {
                await login(page, posts[i].email);
            });
            await test.step('Discard help tour' + i, async () => {
                await discardHelpTour(page);
            });
        });

        test('Create post ' + i, async ({ page }) => {
            await test.step('Create next post', async () => {
                const response = await page.goto(posts[i].uri);
                if (response && 404 == response.status()) { // check if post doesn't already exist
    
                    // go to URL
                    await page.goto('create-post');
    
                    // fill in fields
                    for await (const [, row] of posts[i].data.entries())
                        await fillFormInput(page, row);
    
                    // upload cover image
                    if (typeof (posts[i].cover) !== 'undefined')
                        await html5upload(page, '#bx-form-element-covers .filepond--drop-label', '#bx-form-element-covers .bx-form-input-files-result > .bx-uploader-ghost', posts[i].cover);
    
                    await page.locator("button[name='do_publish']").click(); // submit form
    
                    await expect(page.locator('#bx-page-view-post')).toBeVisible(); // ensure that submitted post redirected to the post view page
                }
            });
            await test.step('Logout', async () => {
                await logout(page);
            });                        
        });
    });
};