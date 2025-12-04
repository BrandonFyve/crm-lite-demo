# E2E Authentication Setup

## Overview

This document explains how authentication is handled in E2E tests for CRM Lite.

## Problem

E2E tests need to access protected routes, but Clerk authentication runs on the server-side (in Next.js middleware), making traditional browser-based mocking ineffective.

## Solution

**Server-Side Authentication Bypass** - The recommended approach per Clerk's documentation.

### How It Works

1. **Environment Flag**: `E2E_TEST_MODE=true` is set in `playwright.config.ts`
2. **Middleware Bypass**: `src/middleware.ts` checks this flag and skips Clerk authentication
3. **Mock User Data**: Page components provide fallback user data when in test mode
4. **Public Health Check**: `/api/health` endpoint for Playwright to verify server readiness

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Playwright starts Next.js dev server with E2E_TEST_MODE=true│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware checks E2E_TEST_MODE                             │
│   ├─ If true: Skip Clerk authentication                     │
│   └─ If false: Enforce Clerk authentication (production)    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Page components check E2E_TEST_MODE                         │
│   ├─ Provide mock user ID if needed                         │
│   └─ Allow tests to access protected content                │
└─────────────────────────────────────────────────────────────┘
```

## Key Files

### `playwright.config.ts`
```typescript
webServer: {
  env: {
    E2E_TEST_MODE: 'true', // Enables auth bypass
  },
}
```

### `src/middleware.ts`
```typescript
const isE2ETestMode = process.env.E2E_TEST_MODE === 'true';

export default clerkMiddleware(async (auth, req) => {
  if (isE2ETestMode) {
    return; // Skip authentication
  }
  // ... normal auth flow
});
```

### `src/app/page.tsx` (and other protected pages)
```typescript
const isE2ETestMode = process.env.E2E_TEST_MODE === 'true';
const userId = authResult?.userId ?? (isE2ETestMode ? 'e2e_test_user' : null);
```

### `e2e/fixtures/auth.ts`
```typescript
export const TEST_USER: MockUser = {
  id: 'e2e_test_user',
  email: 'test@example.com',
  // ...
};
```

## Benefits

✅ **Reliable**: Works for both client and server-side auth checks  
✅ **Simple**: Single environment variable controls bypass  
✅ **Maintainable**: No complex API mocking required  
✅ **Secure**: Only active when explicitly enabled for tests  
✅ **Official**: Recommended by Clerk's documentation  

## Security Considerations

⚠️ **Never deploy with E2E_TEST_MODE enabled in production**

The environment variable is only set when Playwright starts the dev server. In production:
- `E2E_TEST_MODE` is not set
- Full Clerk authentication is enforced
- All routes are properly protected

## Usage in Tests

```typescript
import { test, expect } from '../fixtures';

test.describe('Protected Page', () => {
  test('should access protected route', async ({ authenticatedPage }) => {
    // authenticatedPage automatically has auth bypass enabled
    await authenticatedPage.goto('/protected-route');
    
    // Test your functionality
    await expect(authenticatedPage.locator('h1')).toBeVisible();
  });
});
```

The `authenticatedPage` fixture (from `e2e/fixtures/index.ts`) automatically sets up any necessary client-side mocking, but the heavy lifting is done at the middleware level.

## Troubleshooting

### Still seeing login page?
- ✅ Verify `E2E_TEST_MODE=true` is set in `playwright.config.ts`
- ✅ Check middleware has the bypass logic
- ✅ Restart the dev server (kill port 3000 and rerun tests)

### Tests failing with auth errors?
- ✅ Ensure page components check `E2E_TEST_MODE` for mock user data
- ✅ Verify you're using `authenticatedPage` fixture in tests

### Production accidentally has auth bypass?
- ❌ This should be impossible - the env var is only set by Playwright
- ✅ Review your deployment config to ensure no E2E_TEST_MODE variable exists

## Related Files

- `playwright.config.ts` - Sets E2E_TEST_MODE environment variable
- `src/middleware.ts` - Checks flag and bypasses Clerk authentication
- `src/app/page.tsx` - Provides mock user ID in test mode
- `src/app/tickets/page.tsx` - Provides mock user ID and email in test mode
- `e2e/fixtures/auth.ts` - Test user data constants
- `e2e/fixtures/index.ts` - authenticatedPage fixture

## References

- [Clerk E2E Testing Documentation](https://clerk.com/docs/testing/e2e)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

**Last Updated**: October 17, 2025  
**Maintained By**: Development Team

