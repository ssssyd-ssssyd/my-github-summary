import { test, expect } from '@playwright/test';

test.describe('Github-insights page tests', () => {
  const appUrl = 'http://localhost:4200';
  const tokenInputLocator = 'input[placeholder="Type here..."]';
  const testConnectionButtonLocator = 'button:has-text("Test connection")';
  const myCommitsBtnLocator = 'button:has-text("My commits")';
  const invalidTokenErrorLocator = 'div.error:has-text("Invalid token format")';
  const errorToastLocator = '.header:has-text("Error")';
  const successToastLocator = '.header:has-text("Success")';
  const dashboardUrl = `${appUrl}/dashboard`;
  const myCommitsUrl = `${appUrl}/myCommits`;

  test('Validate authentication flow', async ({ page }) => {
    await test.step('Enter invalid token and validate error- and format messages', async () => {
      await page.goto(appUrl);

      const invalidToken = 'TEST_TOKEN';
      const tokenInput = page.locator(tokenInputLocator);
      await tokenInput.fill(invalidToken);

      const testConnectionButton = page.locator(testConnectionButtonLocator);
      await testConnectionButton.click();

      const invalidTokenError = page.locator(invalidTokenErrorLocator);
      await expect(invalidTokenError).toBeVisible();

      const errorToast = page.locator(errorToastLocator);
      await expect(errorToast).toBeVisible();
    });

    await test.step('Enter valid token and validate success message', async () => {
      const validToken = '';
      const tokenInput = page.locator(tokenInputLocator);
      await tokenInput.fill(validToken);

      const testConnectionButton = page.locator(testConnectionButtonLocator);
      await testConnectionButton.click();

      const successToast = page.locator(successToastLocator);
      await expect(successToast).toBeVisible();
    });

    await test.step('Verify navigation to dashboard page', async () => {
      await expect(page).toHaveURL(dashboardUrl);
    });

    await test.step('Verify bar chart and pie chart are rendering', async () => {
      await page.waitForResponse(
        (response) =>
          response.url().includes('/repos') && response.status() === 200
      );
      const barChartCanvas = page.locator('canvas#commitBarChart');
      await expect(barChartCanvas).toBeVisible();

      const pieChartCanvas = page.locator('canvas#languagePieChart');
      await expect(pieChartCanvas).toBeVisible();
    });

    await test.step('Verify navigation to My-commits page', async () => {
      const myCommitsButton = page.locator(myCommitsBtnLocator);
      await myCommitsButton.click();
      await expect(page).toHaveURL(myCommitsUrl);
    });

    await test.step('Select first item in the dropdown menu', async () => {
      const dropdown = page.locator('tds-dropdown.repo-dropdown');
      await dropdown.click();

      const firstOption = page.locator('tds-dropdown-option').nth(0);
      await firstOption.click();
    });

    await test.step('Click on first commit and validate it navigates to the correct GitHub commit page', async () => {
      const commitMessage = page.locator('strong.commit-message').nth(0);
      const commitText = await commitMessage.textContent();

      await commitMessage.click();
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.locator('strong.commit-message').nth(0).click(),
      ]);

      await newPage.waitForLoadState();
      const pageContent = await newPage.content();
      expect(pageContent).toContain(commitText?.trim());
    });
  });
});
