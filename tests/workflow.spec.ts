import { test, expect, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on('pageerror', (error) => errors.get(page)!.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.get(page)!.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test('complete research journey persists locally and keeps mock analytics fixed', async ({
  page,
  context,
  browser,
}) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.locator('.survey-table tbody tr')).toHaveCount(3);
  await page.getByRole('link', { name: 'Create Survey', exact: true }).click();
  await page.getByRole('button', { name: /Electric vehicle experience/ }).click();
  await page.getByRole('button', { name: 'Generate Survey', exact: true }).click();
  await expect(page.getByText('Generating…')).toBeVisible();
  await expect(page.getByText('Original quality score')).toBeVisible();
  await page.getByRole('button', { name: 'Apply Fix', exact: true }).first().click();
  await expect(
    page.getByText('How satisfied are you with the driving range of your electric vehicle?', {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole('article')
    .filter({ has: page.getByText('flow', { exact: true }) })
    .getByRole('button', { name: 'Apply Fix', exact: true })
    .click();
  await page.getByRole('button', { name: 'Continue to Survey Builder' }).click();
  await page.getByLabel('Survey title').fill('EV Journey Research');
  await page.getByLabel('Question wording').fill('Overall, how satisfied are you with your EV?');
  await page.getByRole('button', { name: 'Save Draft', exact: true }).first().click();
  await expect(page.getByText('Unsaved changes', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Survey preview', exact: true });
  await preview.getByRole('button', { name: 'Start survey' }).click();
  await preview.getByRole('radio', { name: '5', exact: true }).check();
  await preview.getByRole('button', { name: 'Next question' }).click();
  await preview.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(preview.getByRole('radio', { name: '5', exact: true })).toBeChecked();
  await preview.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('button', { name: 'Publish survey', exact: true }).click();
  const link = await page.getByRole('textbox', { name: 'Survey link', exact: true }).inputValue();
  expect(link).toContain('#/survey/ev-journey-research');
  const surveyId = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('intergam-research-os')!).surveys.find(
        (s: { title: string }) => s.title === 'EV Journey Research',
      ).id as string,
  );
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('link', { name: 'View analytics' }).click();
  const metric = await page.locator('.metric-card').first().textContent();
  await expect(page.getByText('Avg. completion time', { exact: true })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('ev-journey-research-responses.csv');

  const runner = await context.newPage();
  const runnerErrors: string[] = [];
  runner.on('pageerror', (e) => runnerErrors.push(e.message));
  await runner.goto(link);
  await expect(runner.locator('.sidebar')).toHaveCount(0);
  await runner.getByRole('button', { name: 'Start survey' }).click();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await expect(runner.getByRole('alert')).toContainText('Please answer');
  await runner.getByRole('radio', { name: '5', exact: true }).check();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await runner.getByRole('radio', { name: '5–7 days a week' }).check();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await runner.getByRole('checkbox', { name: 'Driving range' }).check();
  await runner.getByRole('checkbox', { name: 'Charging experience' }).check();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await runner.getByRole('radio', { name: 'At home', exact: true }).check();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await runner.getByRole('radio', { name: '4', exact: true }).check();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await runner.getByRole('radio', { name: '0', exact: true }).check();
  await runner.getByRole('button', { name: 'Next question' }).click();
  await runner.getByRole('textbox').fill('More reliable chargers near home.');
  await runner.getByRole('button', { name: 'Submit response', exact: true }).click();
  await runner
    .getByRole('dialog', { name: 'Submit your response?' })
    .getByRole('button', { name: 'Submit response' })
    .click();
  await expect(runner.getByRole('heading', { name: 'Thank you.' })).toBeVisible();
  expect(runnerErrors).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem('intergam-research-os')!).responses.filter(
            (r: { surveyId: string }) => r.surveyId === id,
          ).length,
        surveyId,
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(page.locator('.metric-card').first()).toHaveText(metric!);
  await page.getByRole('link', { name: 'Surveys', exact: true }).first().click();
  const row = page.locator('tbody tr').filter({ hasText: 'EV Journey Research' });
  await expect(row.locator('td').nth(2)).toHaveText('1');
  const fresh = await browser.newContext();
  const freshPage = await fresh.newPage();
  await freshPage.goto(link);
  await expect(
    freshPage.getByRole('heading', { name: 'This survey is not available here' }),
  ).toBeVisible();
  await freshPage.goto(new URL('/#/survey/demo-ev-satisfaction', link).href);
  await expect(
    freshPage.getByRole('heading', { name: 'EV Customer Satisfaction', exact: true }),
  ).toBeVisible();
  await fresh.close();
  await runner.close();
  await expect(page.getByRole('button', { name: 'Reset workspace', exact: true })).toHaveCount(0);
});

test('published editing creates a draft copy and draft editing supports all question operations', async ({
  page,
}) => {
  await page.goto('/#/builder/ev-satisfaction');
  await expect(page.getByLabel('Survey title')).toBeDisabled();
  await page.getByRole('button', { name: 'Edit a copy', exact: true }).click();
  await expect(page.getByLabel('Survey title')).toHaveValue('EV Customer Satisfaction (copy)');
  await page.getByLabel('Question wording').fill('Which experience matters most?');
  await page.getByRole('button', { name: 'Answer type', exact: true }).click();
  await page.getByRole('menuitemradio', { name: 'Single choice', exact: true }).click();
  await page.getByLabel('Option 1', { exact: true }).fill('Range');
  await page.getByLabel('Option 2', { exact: true }).fill('Charging');
  await page.getByRole('button', { name: 'Add option', exact: true }).click();
  await page.getByLabel('Option 3', { exact: true }).fill('Price');
  await page.getByLabel('Required question').uncheck();
  await page.getByRole('button', { name: 'Move question 1 down' }).click();
  await page.getByRole('button', { name: 'Add question', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Text response', exact: true }).click();
  await page.getByLabel('Question wording').fill('One more detail?');
  await page.getByLabel('Allow a longer answer').uncheck();
  await page.getByRole('button', { name: 'Delete selected question' }).click();
  await page.getByRole('button', { name: 'Delete question', exact: true }).click();
  await page.getByRole('button', { name: 'Save Draft', exact: true }).first().click();
  await page.reload();
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('intergam-research-os')!));
  const original = data.surveys.find((s: { id: string }) => s.id === 'ev-satisfaction');
  const draft = data.surveys.find((s: { title: string }) => s.title.endsWith('(copy)'));
  expect(original.questions[0].type).toBe('rating');
  expect(draft.questions[1]).toMatchObject({
    title: 'Which experience matters most?',
    type: 'single_choice',
    required: false,
    options: ['Range', 'Charging', 'Price'],
  });
  expect(draft.questions).toHaveLength(7);
});

test('storage recovery preserves damaged data until an explicit reset', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('broken-once')) {
      localStorage.setItem('intergam-research-os', '{broken');
      sessionStorage.setItem('broken-once', '1');
    }
  });
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Let’s restore your workspace.' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('intergam-research-os'))).toBe('{broken');
  await page.getByRole('button', { name: 'Restore workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test('navigation, mobile runner, responsive layouts, and missing routes work', async ({ page }) => {
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/#/');
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/overview-${width}.png`, fullPage: true });
    await expect(page.locator('.topbar')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Settings', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Surveys', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Surveys' })).toBeVisible();
    await page.goto('/#/survey/demo-ev-satisfaction');
    await page.getByRole('button', { name: 'Start survey' }).click();
    await expect(page.getByRole('radio', { name: '1', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/runner-${width}.png`, fullPage: true });
  }
  await page.goto('/#/missing-page');
  await expect(page.getByRole('heading', { name: 'We couldn’t find that page' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to overview' }).click();
  await page.getByRole('link', { name: 'Analytics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible();
  await expect(page.getByText('Sample results', { exact: true })).toHaveCount(0);
});

test('Studio keeps the research brief stable while the agents work', async ({ page }) => {
  await page.goto('/#/studio');
  const brief = page.locator('.objective-panel');
  const before = await brief.boundingBox();
  await page.getByRole('button', { name: /Electric vehicle experience/ }).click();
  await page.getByRole('button', { name: 'Generate Survey', exact: true }).click();
  await expect(page.getByText('In progress', { exact: true })).toBeVisible();
  expect(await brief.boundingBox()).toEqual(before);
  await expect(page.getByText('Original quality score')).toBeVisible();
  expect(await brief.boundingBox()).toEqual(before);
});

test('analytics groups text results last and the survey picker supports keyboard selection', async ({
  page,
}) => {
  await page.goto('/#/analytics/smartphone-purchasing');
  const results = page.locator('.question-results > section');
  await expect(results).toHaveCount(7);
  await expect(results.last()).toContainText('Text response');
  for (let index = 0; index < 6; index++)
    await expect(results.nth(index)).not.toContainText('Text response');
  const picker = page.getByRole('button', { name: 'Select survey', exact: true });
  await picker.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('menuitemradio', { name: 'Smartphone Purchasing Behavior', exact: true }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/analytics\/ev-satisfaction$/);
  await expect(picker).toContainText('EV Customer Satisfaction');
  await picker.click();
  await page.keyboard.press('Escape');
  await expect(picker).toBeFocused();
});

test('demo navigation leaves an unsaved draft without browser dialogs and keeps a fixed sidebar', async ({
  page,
}) => {
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.goto('/#/builder/brand-awareness');
  await expect(page.getByText('Saved in this browser', { exact: true })).toHaveCount(0);
  await page.getByLabel('Question wording').fill('An unsaved demo question');
  await page.getByRole('link', { name: 'Analytics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar-home .logo-mark')).toBeVisible();
  await expect(page.locator('.sidebar-home .brand-word')).toBeVisible();
  await expect(page.getByRole('button', { name: /Collapse sidebar|Expand sidebar/ })).toHaveCount(
    0,
  );
  await page.goto('/#/builder/brand-awareness');
  await page.getByLabel('Question wording').fill('Another unsaved demo question');
  await page.reload();
  await expect(page.getByLabel('Question wording')).not.toHaveValue(
    'Another unsaved demo question',
  );
  expect(dialogs).toEqual([]);
});
