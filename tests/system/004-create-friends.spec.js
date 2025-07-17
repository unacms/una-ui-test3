const { test, expect } = require("@playwright/test");

const { login, discardHelpTour, prepareUri } = require("../../lib/util.js");

const fs = require("fs");
const pathMain = require("path");

const friends = require("../../fixtures/system/friends");
const friendsReady = new Map();

const pagePrefix = "u/";

// setup the correct friends lists for every user without repeat
for (const [i, row] of friends.data.entries()) {
    let arrTemp = [];
    for (const [, item] of row.list.entries()) {
        if (!friendsReady.has(item)) {
            arrTemp.push(item);
        }
    }
    friendsReady.set(row.name, arrTemp);

    defineFriends(i, row);
}

// Create a function for all Test Describes to prevent problems
function defineFriends(i, row) {
    test.describe(`Setup friends connection: ${i}`, () => {
        test.beforeEach(async ({ page }) => {
            await test.step(`Login: ${i}`, async () => {
                await login(page, row.email);
                console.log(`[${row.name}] login complete.`);
            });
            await test.step(`Discard help tour ${i}`, async () => {
                await discardHelpTour(page);
            });
        });
        test.afterEach(async ({ page }) => {
            await page.context().clearCookies();
        });

        test(`Send all friend requests for ${row.name}`, async ({ page }) => {
            // increase timeout for a test because it may take more than 30_000ms
            test.setTimeout(600_000);

            // accept friends request, the first person is passed this step
            const nameUri = prepareUri(row.name);

            if (i > 0) {
                await page.goto("persons-profile-friends/" + nameUri);
                let elements = page
                    .locator("#bx-grid-table-sys_grid_connections")
                    .getByRole("button")
                    .filter({ hasText: "Accept" });

                let count = await elements.count();
                for (let y = 0; y < count; y++) {
                    await elements.first().click();
                }

                await test.step("Check logout button", async () => {
                    await page
                        .locator("#bx-menu-toolbar-item-account a")
                        .click();
                    await expect(
                        page.locator("li.bx-menu-item-logout a")
                    ).toBeVisible();
                });
            }

            // send friends request
            for (const [j, item] of friendsReady.get(row.name).entries()) {
                let visitUrl = pagePrefix + prepareUri(item);

                try {
                    await page.waitForLoadState("load");
                    if (page.isClosed()) {
                        throw new Error("Page was closed before navigation.");
                    }
                    const response = await page.goto(visitUrl, {
                        waitUntil: "domcontentloaded",
                    });
                    // check if profile exists
                    if (response && 404 != response.status()) {
                        await test.step(`Send friend request link`, async () => {
                            const addFriendBtn = page.locator(
                                'li.bx-menu-item-profile-friends a[onclick*="oConnSysProfilesFriends"][onclick*="connect"][onclick*="add"]'
                            );
                            if (await addFriendBtn.isVisible()) {
                                await addFriendBtn.click();
                            }
                        });
                    }
                } catch (e) {
                    console.error("Navigation error:", e);
                    throw e;
                }
            }
        });
    });
}
