
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