import { expect, test, type Page } from '@playwright/test';

async function questionIds(page: Page) {
  await page.getByRole('list', { name: 'Survey questions', exact: true }).waitFor();
  return page
    .locator('.question-sortable-list [data-question-id]')
    .evaluateAll((items) => items.map((item) => item.getAttribute('data-question-id')));
}

async function dragQuestion(page: Page, from: number, to: number) {
  const handle = page.getByRole('button', { name: `Reorder question ${from + 1}`, exact: true });
  const target = page.locator('.question-sortable-list > [role="listitem"]').nth(to);
  await handle.scrollIntoViewIfNeeded();
  const sourceBox = (await handle.boundingBox())!;
  const targetBox = (await target.boundingBox())!;
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2 + 8);
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 20,
  });
  await page.mouse.up();
}

test('pointer reordering preserves selection, persists IDs and order, and updates preview', async ({
  page,
}) => {
  await page.goto('/#/builder/brand-awareness');
  const before = await questionIds(page);
  const wording = await page.getByLabel('Question wording').inputValue();
  const nextFirst = await page.locator('.question-select .line-clamp-2').nth(1).innerText();
  await dragQuestion(page, 0, 2);
  await expect
    .poll(() => questionIds(page))
    .toEqual([before[1], before[2], before[0], ...before.slice(3)]);
  await expect(page.getByLabel('Question wording')).toHaveValue(wording);
  await expect(page.getByText('Unsaved changes', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Draft', exact: true }).first().click();
  await page.reload();
  expect(await questionIds(page)).toEqual([before[1], before[2], before[0], ...before.slice(3)]);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('intergam-research-os')!).surveys.find(
      (survey: { id: string }) => survey.id === 'brand-awareness',
    ),
  );
  expect(saved.questions.map((question: { order: number }) => question.order)).toEqual(
    before.map((_, index) => index),
  );
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Survey preview', exact: true });
  await preview.getByRole('button', { name: 'Start survey' }).click();
  await expect(preview.getByRole('heading').last()).toContainText(nextFirst);
});

test('keyboard reorder can be cancelled and published questions remain locked', async ({
  page,
}) => {
  await page.goto('/#/builder/brand-awareness');
  const before = await questionIds(page);
  await page.getByRole('button', { name: 'Reorder question 1', exact: true }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  expect(await questionIds(page)).toEqual(before);
  await expect(page.getByText('Unsaved changes', { exact: true })).toHaveCount(0);
  await page.goto('/#/builder/ev-satisfaction');
  await expect(page.getByLabel('Survey title')).toBeDisabled();
  await expect(page.getByRole('button', { name: /Reorder question/ })).toHaveCount(0);
});

test('reordering supersedes pending flow suggestions without discarding wording suggestions', async ({
  page,
}) => {
  await page.goto('/#/studio');
  await page.getByRole('button', { name: /Electric vehicle experience/ }).click();
  await page.getByRole('button', { name: 'Generate Survey', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to Survey Builder' }).click();
  await dragQuestion(page, 0, 2);
  await page.getByRole('button', { name: 'Save Draft', exact: true }).first().click();
  const statuses = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('intergam-research-os')!);
    const id = location.hash.split('/').at(-1);
    return state.reviews
      .find((review: { surveyId: string }) => review.surveyId === id)
      .issues.map((issue: { type: string; status: string }) => ({
        type: issue.type,
        status: issue.status,
      }));
  });
  expect(statuses.find((issue: { type: string }) => issue.type === 'flow').status).toBe(
    'superseded',
  );
  expect(
    statuses
      .filter((issue: { type: string }) => issue.type !== 'flow')
      .every((issue: { status: string }) => issue.status === 'open'),
  ).toBe(true);
});

test('touch dragging reorders the horizontal mobile question list', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/#/builder/brand-awareness');
  const before = await questionIds(page);
  const handle = page.getByRole('button', { name: 'Reorder question 1', exact: true });
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  const listBox = (await page.getByRole('list', { name: 'Survey questions' }).boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...start, id: 1 }],
  });
  for (let index = 1; index <= 16; index += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: start.x + ((listBox.x + listBox.width - 8 - start.x) * index) / 16,
          y: start.y,
          id: 1,
        },
      ],
    });
    await page.waitForTimeout(25);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => questionIds(page)).not.toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
