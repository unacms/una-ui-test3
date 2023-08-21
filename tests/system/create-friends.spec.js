const { test, expect } = require('@playwright/test');

const fs = require("fs");
const pathMain = require("path");

const friends = require("../../fixtures/system/friends");
const friendsReady = new Map();

const pagePrefix = 'u/';

function prepareUri(str) {
    let strFinal = str.trim().replaceAll(/[\s,.]/g, '-');
    strFinal = strFinal.replace(/([-^]+)/g, '-');
    return strFinal.replace(/([-]+)$/g, '');
}

// setup the correct friends lists for every user without repeat
for (const [, row] of friends.data.entries()) {
    friendsReady.set(row.name, []);
    let arrTemp = [];
    for (const [, item] of row.list.entries()) {
        if (!friendsReady.has(item)) {
            arrTemp.push(item);
        }
        friendsReady.set(row.name, arrTemp);
    }
};

for (const [i, row] of friends.data.entries()) {
	let nameUri = prepareUri(row.name);
    
    test.describe('Setup friends connection' + i, () => {
        test.beforeEach(async ({ page }) => {
            await test.step('Login ' + i, async () => {
                await page.goto('login');
				await page.locator('input[name="ID"]').fill(row.email);
				await page.locator('input[name="Password"]').fill(process.env.userTomPwd);
				await page.getByRole('button', { name: 'Log in' }).click();

				// make sure that there is no "Please Wait" loading screen and user is logged in
				await page.waitForFunction(() => !!document.querySelector('body.bx-user-authorized'));
			});
			await test.step('Discard help tour' + i, async () => {
				await page.waitForLoadState(); // we need to make sure that page is loaded, since tour is shown only when page is loaded
				const isTourShown = await page.evaluate(() => !!document.querySelector('[data-shepherd-step-id="tour-homepage"]'));
				if (isTourShown)
					await page.getByRole('button', { name: 'Exit' }).click();
			});
		});
		test.afterEach(async ({ page }) => {
			await page.context().clearCookies();
		});
    
    // accept friends request, the first person is passed this step
    if (i > 0) {
        test('Visit the friends request page' + i,  async ({ page }) => {
            await page.goto('persons-profile-friends/' + nameUri);
            let elements = page.locator('#bx-grid-table-sys_grid_connections').getByRole('button').filter({ hasText: 'Accept' });
            let count = await elements.count();
            for (let y = 0; y < count; y++) {
              await elements.nth(y).click();
            }
            await test.step('Check logout button', async () => {
                await page.locator('#bx-menu-toolbar-item-account a').click();
                await expect(page.locator('li.bx-menu-item-logout a')).toBeVisible();
            });
        });
    }
    // send friends request
    for (const [j, item] of friendsReady.get(row.name).entries()) {
        let visitUrl = pagePrefix + prepareUri(item);
        test('View profile ' + j,  async ({ page }) => {
            const response = await page.goto(visitUrl);
            if (response && 404 != response.status()) { // check if profile exist                
                await test.step('Send friend request link', async () => {
                    await page.locator('li.bx-menu-item-profile-friend-add a').click();
                });
            }
        });
    }
	});
}