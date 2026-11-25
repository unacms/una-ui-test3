const { test, expect } = require("@playwright/test");

const fs = require("fs");
const pathMain = require("path");
const {
    login,
    fillFormInput,
    discardHelpTour,
    chooseProfileTypeInPrompt,
    logout,
    uploadProfileAvatar,
} = require("../../lib/util.js");
const persons = new Array();

for (let i = 1; i < 10; i++) {
    let path = "../../fixtures/bx_persons/person" + i + "/person" + i + ".js";
    path = pathMain.join(__dirname, path);

    if (!fs.existsSync(path)) {
        break;
    }

    persons[i] = require(path);
    test.describe("Person: " + i, () => {
        // true if the profile creation page was opened from the
        // "Create your profile" window shown after login
        let isCreationPageOpened = false;

        test.beforeEach(async ({ page }) => {
            await test.step("Login: " + i, async () => {
                await login(page, persons[i].email);
            });
            // The "Create your profile" window covers the page with a backdrop,
            // so it must be handled first: choose Person in it.
            await test.step("Choose Person in 'Create your profile': " + i, async () => {
                isCreationPageOpened = await chooseProfileTypeInPrompt(
                    page,
                    "create-persons-profile"
                );
            });
            // the help tour is shown on the homepage only
            if (!isCreationPageOpened) {
                await test.step("Discard help tour: " + i, async () => {
                    await discardHelpTour(page);
                });
            }
        });

        test("Create profile: " + i, async ({ page }) => {
            await test.step("Create person: ", async () => {
                // A system/operator profile does not count. Operators do not get
                // the "Create your profile" window, and the Get started checklist
                // hides #sys-account-profile-system. The switcher lists only
                // modules that act as a profile (bx_persons); each is a
                // .sys-profile-switch-row. Type=system is omitted, and the
                // "create a profile" menu on this page is not a row.
                let isProfileCreated = false;
                if (!isCreationPageOpened) {
                    await page.goto("account-profile-switcher");
                    isProfileCreated =
                        (await page.locator(".sys-profile-switch-row").count()) >
                        0;
                }
                if (!isProfileCreated) {
                    if (!isCreationPageOpened) {
                        await page.goto("create-persons-profile");
                    }

                    for (const [, row] of persons[i].data.entries()) {
                        await fillFormInput(page, row);
                    }

                    await test.step("Profile avatar upload", async () => {
                        await uploadProfileAvatar(page, persons[i]);
                    });

                    await page.getByRole("button", { name: "Submit" }).click();

                    const fullname = persons[i].data.find(
                        (row) => row.name === "fullname"
                    ).val;

                    await expect(
                        page.getByRole("heading", {
                            level: 1,
                            name: fullname,
                            exact: true,
                        })
                    ).toBeVisible();
                }
            });
            await test.step("Logout", async () => {
                await logout(page);
            });
        });
    });
}
