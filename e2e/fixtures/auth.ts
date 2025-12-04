import { Page } from '@playwright/test';

/**
 * E2E Test Authentication Bypass
 * 
 * Authentication is bypassed at the middleware level when E2E_TEST_MODE=true.
 * This is set in playwright.config.ts and checked in src/middleware.ts.
 * 
 * This approach:
 * - Bypasses Clerk authentication on the server-side (middleware)
 * - Allows E2E tests to access protected routes without real authentication
 * - Provides mock user data when needed (in page components)
 * 
 * This is the recommended approach per Clerk's E2E testing documentation.
 */

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const TEST_USER: MockUser = {
  id: 'e2e_test_user',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

/**
 * Sets up authentication bypass for E2E tests.
 * 
 * Note: The actual bypass happens at the middleware level via E2E_TEST_MODE env var.
 * This function is kept for consistency and future client-side mocking if needed.
 */
export async function setupAuthBypass(page: Page, user: MockUser = TEST_USER) {
  // Store test user data in localStorage for client-side components that might need it
  await page.addInitScript((userData) => {
    localStorage.setItem('e2e-test-user', JSON.stringify(userData));
  }, user);
}

/**
 * Clears all authentication data
 */
export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

