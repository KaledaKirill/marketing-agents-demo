import { test, expect } from '@playwright/test';

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`agent handoff, question checks, and review decisions work with motion ${reducedMotion}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/#/studio');
    await expect(page.locator('.research-observatory, .studio-invitation, canvas')).toHaveCount(0);
    await page.getByRole('button', { name: /Electric vehicle experience/ }).click();
    await page.getByRole('button', { name: 'Generate Survey', exact: true }).click();
    await expect(page.locator('.draft-in-progress')).toBeVisible();
    await expect(page.getByLabel('Research objective')).toBeDisabled();
    const reviewProgress = page.getByRole('progressbar', {
      name: 'Questions checked',
      exact: true,
    });
    await expect(reviewProgress).toBeVisible();
    await expect(page.locator('.draft-question[data-reviewing="true"]')).toHaveCount(1);
    await expect(reviewProgress).not.toHaveAttribute('aria-valuenow', '0');
    await expect(page.getByText('Original quality score', { exact: true })).toBeVisible();
    await expect(page.locator('.draft-question[data-reviewing="true"]')).toHaveCount(0);
    await expect(
      page.getByRole('progressbar', { name: 'Completed research stages' }),
    ).toHaveAttribute('aria-valuenow', '3');
    await page.getByRole('button', { name: 'Apply Fix', exact: true }).first().click();
    await expect(page.locator('.draft-question[data-refined="true"]')).toHaveCount(1);
    await expect(page.getByRole('progressbar', { name: 'Resolved suggestions' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    );
    await expect(
      page.getByRole('button', { name: 'Apply Fix', exact: true }).first(),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Dismiss', exact: true }).first().click();
    await page.getByRole('button', { name: 'Apply Fix', exact: true }).first().click();
    await expect(page.getByText('No outstanding suggestions', { exact: true })).toBeVisible();
    await expect(page.locator('.review-complete')).toBeFocused();
    await expect(page.getByRole('progressbar', { name: 'Resolved suggestions' })).toHaveAttribute(
      'aria-valuenow',
      '3',
    );
    await expect(page.locator('.draft-question').last()).toHaveAttribute('data-refined', 'true');
    await page.getByRole('button', { name: 'Continue to Survey Builder' }).click();
    await expect(page.getByLabel('Survey title')).toBeEnabled();
  });
}

test('leaving generation cancels its pending work', async ({ page }) => {
  await page.goto('/#/studio');
  await page.getByRole('button', { name: /Electric vehicle experience/ }).click();
  await page.getByRole('button', { name: 'Generate Survey', exact: true }).click();
  await expect(
    page.getByRole('progressbar', { name: 'Questions checked', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page.locator('.survey-table tbody tr')).toHaveCount(3);
  await expect(page.getByText('Survey ready', { exact: true })).toHaveCount(0);
});
