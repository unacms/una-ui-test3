const { test, expect } = require('@playwright/test');

const fs = require("fs");
const pathMain = require("path");
const { html5upload, fillFormInput } = require('../../lib/util.js');
const persons = new Array();

for (let i = 1; i < 10; i++) {
    let path = "../../fixtures/bx_persons/person" + i + "/person" + i + '.js';
    path = pathMain.join(__dirname, path);

    if (!fs.existsSync(path)) {
        break;
    }

    persons[i] = require(path);
    test.describe('Person ' + i, () => {

        test('Create profile ' + i, async ({ page }) => {
            await test.step('Create person', async () => {
                let isProfileCreated = await page.evaluate(() => !document.querySelector('#sys-account-profile-system'));
                if (!isProfileCreated) {
                    await page.goto('create-persons-profile');

                    for (const [, row] of persons[i].data.entries()) {
                        await fillFormInput(page, row);
                    };

                    await test.step('Profile avatar upload', async () => {
                        await page.getByRole('link', { name: 'Upload and Crop' }).click();
                        await page.getByText('Select a file').click();
                        await page.locator('input[name="f"]').setInputFiles(persons[i].avatar);
                        await page.getByRole('button', { name: 'Upload' }).click();
                    });

                    await page.getByRole('button', { name: 'Submit' }).click();

                    await expect(page.getByRole('heading', { name: persons[i].data.fullname })).toBeVisible();
                }
            });
            await test.step('Logout', async () => {
                await page.locator('#bx-menu-toolbar-item-account a').click();
                await page.locator('li.bx-menu-item-logout a').click();
            });
        });
    });
};