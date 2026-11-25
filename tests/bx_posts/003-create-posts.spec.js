const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const {
    login,
    html5upload,
    fillFormInput,
    discardHelpTour,
} = require("../../lib/util.js");

const postsByUser = {};

// Собираем все посты и группируем по email
for (let i = 1; i <= 99; i++) {
    const postPath = path.join(
        __dirname,
        `../../fixtures/bx_posts/post${i}.js`
    );
    if (!fs.existsSync(postPath)) break;

    const postData = require(postPath);
    const { email } = postData;

    if (!postsByUser[email]) {
        postsByUser[email] = [];
    }
    postsByUser[email].push(postData);
}

// Создаём по одному тесту на каждого пользователя
for (const [email, userPosts] of Object.entries(postsByUser)) {
    test.describe(`User posts: ${email}`, () => {
        test(`Create all posts for ${email}`, async ({ page }) => {
            test.setTimeout(600_000);
            await test.step("Login", async () => {
                await login(page, email);
            });

            await test.step("Discard help tour", async () => {
                await discardHelpTour(page);
            });

            for (const [index, post] of userPosts.entries()) {
                await test.step(`Create post ${index + 1}`, async () => {
                    const response = await page.goto(post.uri);
                    if (response && response.status() === 404) {
                        await page.goto("create-post");

                        // Fail fast: a system/operator profile gets "Create a
                        // profile first" instead of the form. Do not wait for
                        // the 10-minute test timeout on body [name="title"].
                        const titleField = page.locator('body [name="title"]');
                        try {
                            await titleField.waitFor({
                                state: "visible",
                                timeout: 15_000,
                            });
                        } catch {
                            const denial = page.locator(
                                ".bx-msg-box-state, .bx-msg-box-title"
                            );
                            const denialText = (
                                await denial
                                    .first()
                                    .innerText()
                                    .catch(() => "")
                            ).trim();
                            throw new Error(
                                `Create Post form did not appear for ${email}` +
                                    (denialText ? `: ${denialText}` : "") +
                                    ". The current profile may be the system/operator profile, which cannot post."
                            );
                        }

                        for (const field of post.data) {
                            await fillFormInput(page, field);
                        }

                        if (post.cover) {
                            await html5upload(
                                page,
                                "#bx-form-element-covers .filepond--drop-label",
                                "#bx-form-element-covers .bx-form-input-files-result > .bx-uploader-ghost",
                                post.cover
                            );
                        }

                        await page.locator("button[name='do_publish']").click();

                        await expect(
                            page.locator("#bx-page-view-post")
                        ).toBeVisible();
                    }
                });
            }
        });
    });
}
