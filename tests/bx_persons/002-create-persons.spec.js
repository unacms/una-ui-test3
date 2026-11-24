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
                // The "Create your profile" window replaces the informer message
                // (#sys-account-profile-system), so a window means no profile yet.
                let isProfileCreated =
                    !isCreationPageOpened &&
                    (await page.evaluate(
                        () =>
                            !document.querySelector(
                                "#sys-account-profile-system"
                            )
                    ));
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
