// vi: set ts=2 sw=2 sts=2:

const { test, expect } = require('@playwright/test');

const Person = require("../fixtures/persons/tom");
const Post = require("../fixtures/posts/sample");

test.describe('Posts', () => {


  test.beforeEach(async ({ page }) => {

    await test.step('Login', async () => {
      await page.context().clearCookies();
      await page.goto('login');
      await page.locator('input[name="ID"]').fill(process.env.userTomEmail);
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

    await test.step('Create profile', async () => {
      const isProfileCreated = await page.evaluate(() => !document.querySelector('#sys-account-profile-system'));
      if (!isProfileCreated) {
        await page.goto('create-persons-profile');

        for (const [, row] of Person.data.entries()) {
          await fillFormInput (page, row);
        };

        await test.step('Profile avatar upload', async () => {
          await page.getByRole('link', { name: 'Upload and Crop' }).click();
          await page.getByText('Select a file').click();
          await page.locator('input[name="f"]').setInputFiles(Person.avatar);
          await page.getByRole('button', { name: 'Upload' }).click();
        });

        await page.getByRole('button', { name: 'Submit' }).click();

        await expect(page.getByRole('heading', { name: Person.data.fullname })).toBeVisible();
      }
    });

    await page.goto('create-post');
  });


  test('Should allow to create post',  async ({ page }) => {

    // fill in fields
    for await (const [, row] of Post.data.entries()) 
      await fillFormInput(page, row);

    // upload cover image
    if (typeof(Post.cover) !== 'undefined')
      await html5upload(page, '#bx-form-element-covers .filepond--drop-label', '#bx-form-element-covers .bx-form-input-files-result > .bx-uploader-ghost', Post.cover);

    // upload attachment
    if (typeof(Post.photo_attachment) !== 'undefined')
      await html5upload(page, '#bx-form-element-attachments .photo_html5 a', '#bx-form-element-pictures .bx-form-input-files-result > .bx-uploader-ghost', Post.photo_attachment);

    await page.getByRole('button', { name: 'Publish' }).click(); // submit form

    await expect(page.locator('#bx-page-view-post')).toBeVisible(); // ensure that submitted post redirected to the post view page
  });


});


async function html5upload (page, fileChooserSelector, fileResultsSelector, filePath) {
  page.on('filechooser', async fileChooser => {
    await fileChooser.setFiles(filePath);
  });    
  await page.locator(fileChooserSelector).click(); // click on file chooser element
  await page.waitForFunction((sel) => !!document.querySelector(sel), fileResultsSelector); // wait until file is uploaded
}

async function fillFormInput (page, row) {
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

