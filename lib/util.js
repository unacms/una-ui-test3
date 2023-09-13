const { expect } = require('@playwright/test');

export async function html5upload (page, fileChooserSelector, fileResultsSelector, filePath) {
    page.on('filechooser', async fileChooser => {
      await fileChooser.setFiles(filePath);
    });    
    await page.locator(fileChooserSelector).click(); // click on file chooser element
    await page.waitForFunction((sel) => !!document.querySelector(sel), fileResultsSelector); // wait until file is uploaded
}
  
export async function fillFormInput (page, row) {
    let e = null;
    if (typeof(row.name) !== 'undefined')
      e = page.locator(`[name="${row.name}"]`);
    else if (typeof(row.id) !== 'undefined')
      e = page.locator(`#${row.id}`);
    else if (typeof(row.sel) !== 'undefined')
      e = page.locator(row.sel);
  
    if (null !== e) {
      if (typeof(row.eval) !== 'undefined' && true == row.eval)
        await e.evaluate((el, v) => {
          el.value = v;
        }, row.val);
      else if (typeof(row.select) !== 'undefined')
        await e.selectOption(String(row.select));
      else
        await e.fill(String(row.val), row.force ? {force: true} : {});
    }
};

export async function createAccount(page, name, email) {
    // go to URL
    await page.goto('create-account');

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
    await expect(page.locator('#bx-form-element-email .bx-form-warn')).toBeHidden();
}

export async function login(page, email) {
    // pre clean-up
    await page.context().clearCookies();

    // go to URL
    await page.goto('login');

    // fill in email
    await page.locator('input[name="ID"]').fill(email);

    // fill in password
    await page.locator('input[name="Password"]').fill(process.env.userTomPwd);

    // click submit
    await page.locator("button[name='login']").click();

    // make sure login is correct
    await page.waitForLoadState();
    await expect(page.locator('#bx-form-element-ID .bx-form-warn')).toBeHidden();
    
    // make sure that there is no "Please Wait" loading screen and user is logged in
    await page.waitForFunction(() => !!document.querySelector('body.bx-user-authorized'));
}

export async function logout(page) {
    await page.waitForLoadState();
    await page.locator('#bx-menu-toolbar-item-account a').click();
    await page.locator('li.bx-menu-item-logout a').click();
}

export async function uploadProfileAvatar(page, person) {
    await page.locator('div[id="bx-form-element-picture"] a').click();
    await page.locator('div[id="bx-form-element-f"] span.bx-fif-label').click();
    await page.locator('input[name="f"]').setInputFiles(person.avatar);
    await page.locator('button.bx-crop-upload').click();
}

export async function discardHelpTour(page) {
    await page.waitForLoadState(); // we need to make sure that page is loaded, since tour is shown only when page is loaded
    const isTourShown = await page.evaluate(() => !!document.querySelector('[data-shepherd-step-id="tour-homepage"]'));
    if (isTourShown)
        await page.getByRole('button', { name: 'Exit' }).click();
}

export async function createPerson(person) {

      // go to URL
      await page.goto('create-persons-profile');

      // fill in person form
      for (const [, row] of person.data.entries()) {
          await fillFormInput(page, row);
      };

      // upload avatar
      await page.getByRole('link', { name: 'Upload and Crop' }).click();
      await page.getByText('Select a file').click();
      await page.locator('input[name="f"]').setInputFiles(person.avatar);
      await page.getByRole('button', { name: 'Upload' }).click();


      await page.getByRole('button', { name: 'Submit' }).click();

      await expect(page.getByRole('heading', { name: persons[i].data.fullname })).toBeVisible();

}