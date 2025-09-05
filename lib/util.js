const { expect } = require("@playwright/test");

export async function html5upload(
    page,
    fileChooserSelector,
    fileResultsSelector,
    filePath
) {
    page.on("filechooser", async (fileChooser) => {
        await fileChooser.setFiles(filePath);
    });
    await page.locator(fileChooserSelector).click(); // click on file chooser element
    await page.waitForFunction(
        (sel) => !!document.querySelector(sel),
        fileResultsSelector
    ); // wait until file is uploaded
}

export async function fillFormInput(page, row) {
    let e = null;
    if (typeof row.name !== "undefined")
        e = page.locator(`body [name="${row.name}"]`);
    else if (typeof row.id !== "undefined") e = page.locator(`#${row.id}`);
    else if (typeof row.sel !== "undefined") e = page.locator(row.sel);

    if (null !== e) {
        if (typeof row.eval !== "undefined" && true == row.eval)
            await e.evaluate((el, v) => {
                el.value = v;
            }, row.val);
        else if (typeof row.select !== "undefined")
            await e.selectOption(String(row.select));
        else await e.fill(String(row.val), row.force ? { force: true } : {});
    }
}

export async function createAccount(page, name, email) {
    // go to URL
    await page.goto("create-account");

    // fill in name
    await page.locator('input[name="name"]').fill(name);

    // fill in email
    await page.locator('input[name="email"]').fill(email);

    // fill in password
    await page.locator('input[name="password"]').fill(process.env.userTomPwd);

    // Click Submit
    await page.locator("button[name='do_publish']").click();

    // error if account exists
    await page.waitForLoadState();
    await expect(
        page.locator("#bx-form-element-email .bx-form-warn")
    ).toBeHidden();
}

export async function preLogin(page, email, pwd, rememberMeChecked = false) {
    // enter email
    await page.locator('input[name="ID"]').fill(email);
    // enter password
    await page.locator('input[name="Password"]').fill(pwd);

    // get "Remember Me Switcher" locator
    const rememberMeSwitcher = page.locator(
        "#bx-form-element-rememberMe .bx-switcher-cont"
    );

    // get "Remember Me Input" locator
    const rememberMeInput = page.locator(
        "#bx-form-element-rememberMe input[name=rememberMe]"
    );

    if (rememberMeChecked) {
        // "Remember me" should be checked
        await rememberMeSwitcher.click();
        await expect(rememberMeInput).toBeChecked();
    } else {
        // "Remember me" should be unchecked
        await expect(rememberMeInput).not.toBeChecked();
    }

    // Use attribute selector
    // to avoid depending on button text (multi-language UI)
    const buttonLogin = page.locator('button[type="submit"][name="login"]');
    await buttonLogin.click();
}

export async function login(page, email, pwd = process.env.userRegularPwd) {
    // pre clean-up
    await page.context().clearCookies();

    // go to URL
    await page.goto("login").catch(() => {
        throw new Error("Login page did not load in time.");
    });

    // fill in email
    await page.locator('input[name="ID"]').fill(email);

    // fill in password
    await page.locator('input[name="Password"]').fill(pwd);

    // click the Login button
    await page.locator("button[name='login']").click();

    // wait for either navigation or login error
    const navigationPromise = page
        .waitForNavigation({ waitUntil: "load" })
        .then(() => "navigated")
        .catch(() => "navigationFailed");

    const warningLocator = page.locator("#bx-form-element-ID .bx-form-warn");
    const warnPromise = warningLocator
        .waitFor({ state: "visible", timeout: 5000 })
        .then(() => "warningShown")
        .catch(() => "warningNotShown");

    const result = await Promise.any([navigationPromise, warnPromise]);

    if (result === "warningShown") {
        const msg = await warnLocator.innerText().catch(() => "Unknown error");
        throw new Error(`Login failed for user "${email}": ${msg}`);
    }

    if (result === "navigationFailed") {
        throw new Error("Neither navigation nor warning happened.");
    }

    // make sure that there is no "Please Wait" loading screen and user is logged in
    try {
        await page.waitForSelector("body.bx-user-authorized", {
            timeout: 10000,
        });
    } catch {
        throw new Error(`Login failed: user "${email}" not authorized`);
    }
}

export async function logout(page) {
    await page.waitForLoadState();

    const avatarIcon = page.locator("#bx-menu-toolbar-item-account a");
    await avatarIcon.waitFor({ state: "visible" });
    await avatarIcon.click();

    const logoutBtn = page.locator("li.bx-menu-item-logout a");
    await logoutBtn.waitFor({ state: "visible" });

    await logoutBtn.click();
}

export async function uploadProfileAvatar(page, person) {
    await page.locator('div[id="bx-form-element-picture"] a').click();
    await page.locator('div[id="bx-form-element-f"] span.bx-fif-label').click();
    await page.locator('input[name="f"]').setInputFiles(person.avatar);
    await page.locator("button.bx-crop-upload").click();
}

export async function discardHelpTour(page) {
    // make sure that page is loaded, since tour is shown only when page is loaded
    await page.waitForLoadState();

    // assign the Tour Locator
    const tourLocator = page.locator('[data-shepherd-step-id="tour-homepage"]');

    const isTourVisible = await tourLocator
        .first()
        .isVisible({ timeout: 3000 });

    // if Tour Locator is found
    if (isTourVisible) {
        // select button by class inside tourLocator
        // because inner text may be in a different language
        const exitButton = tourLocator.locator(
            "button.shepherd-button-secondary.shepherd-button"
        );

        // click Exit Help Tour
        await exitButton.click();
    }
}

export async function createPerson(person) {
    // go to URL
    await page.goto("create-persons-profile");

    // fill in person form
    for (const [, row] of person.data.entries()) {
        await fillFormInput(page, row);
    }

    // upload avatar
    await page.getByRole("link", { name: "Upload and Crop" }).click();
    await page.getByText("Select a file").click();
    await page.locator('input[name="f"]').setInputFiles(person.avatar);
    await page.getByRole("button", { name: "Upload" }).click();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
        page.getByRole("heading", { name: persons[i].data.fullname })
    ).toBeVisible();
}

export function prepareUri(str) {
    let strFinal = str.trim().replaceAll(/[\s,.]/g, "-");
    strFinal = strFinal.replace(/([-^]+)/g, "-");
    return strFinal.replace(/([-]+)$/g, "");
}

export async function checkRedirectPage(page) {
    await page.waitForLoadState();
    const redirectMsgBox = page.locator(".bx-msg-box.inline-block");
    const redirectMsgBoxIsVisible = await redirectMsgBox
        .isVisible()
        .catch(() => false);
    if (!redirectMsgBoxIsVisible) {
        console.warn("Redirect message did not appear in time");
    }
}

export async function checkCookiesHaveExpiryDate(page, mustHave = false) {
    const cookies = await page.context().cookies();
    const memberSessionCookie = cookies.find((c) => c.name === "memberSession");
    if (!memberSessionCookie) {
        console.warn("Cookie 'memberSession' not found");
    } else {
        try {
            if (mustHave) {
                expect(memberSessionCookie.expires).toBeGreaterThan(0);
            } else {
                expect(memberSessionCookie.expires).toBeLessThan(0);
            }
        } catch {
            console.warn("There's a problem with Cookies expiry date!");
        }
    }
}
