import { test as base, expect, Page } from '@playwright/test';
import { setupAuthBypass, TEST_USER, type MockUser } from './auth';

/**
 * Extended test fixture that includes authenticated context
 */
type TestFixtures = {
  authenticatedPage: Page;
  user: MockUser;
};

export const test = base.extend<TestFixtures>({
  user: TEST_USER,
  
  authenticatedPage: async ({ page, user }, use) => {
    // Setup authentication bypass before each test
    await setupAuthBypass(page, user);
    
    // Provide the page to the test
    await use(page);
  },
});

export { expect };

/**
 * Wait for API response and return the response data
 */
export async function waitForAPIResponse(
  page: any,
  urlPattern: string | RegExp,
  action: () => Promise<void>
) {
  const responsePromise = page.waitForResponse(
    (response: any) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    }
  );

  await action();

  const response = await responsePromise;
  return response.json();
}

/**
 * Wait for element to be visible and return it
 */
export async function waitForElement(page: any, selector: string, options = {}) {
  return page.waitForSelector(selector, { 
    state: 'visible',
    timeout: 10000,
    ...options 
  });
}

/**
 * Wait for loading to complete by checking for skeleton disappearance
 */
export async function waitForLoadingComplete(page: any) {
  // Wait for any skeletons to disappear
  const skeletons = page.locator('[class*="skeleton"]').first();
  const count = await skeletons.count();
  
  if (count > 0) {
    await skeletons.waitFor({ state: 'hidden', timeout: 15000 });
  }
  
  // Additional wait for network idle
  await page.waitForLoadState('networkidle');
}

/**
 * Fill a form field by label
 */
export async function fillFieldByLabel(page: any, label: string, value: string) {
  const field = page.locator(`label:has-text("${label}")`).locator('..').locator('input, textarea, select').first();
  await field.fill(value);
}

/**
 * Select from dropdown by label
 */
export async function selectByLabel(page: any, label: string, value: string) {
  const trigger = page.locator(`label:has-text("${label}")`).locator('..').locator('[role="combobox"]').first();
  await trigger.click();
  await page.waitForTimeout(500); // Wait for dropdown to open
  
  const option = page.locator(`[role="option"]:has-text("${value}")`).first();
  await option.click();
}

/**
 * Click button by text
 */
export async function clickButton(page: any, text: string) {
  const button = page.locator(`button:has-text("${text}")`).first();
  await button.click();
}

/**
 * Wait for toast notification to appear
 */
export async function waitForToast(page: any, expectedText?: string) {
  const toast = page.locator('[data-sonner-toast]').first();
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  
  if (expectedText) {
    await expect(toast).toContainText(expectedText);
  }
  
  return toast;
}

