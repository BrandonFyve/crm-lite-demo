# E2E Testing Setup Guide

This guide will help you set up and run end-to-end tests for CRM Lite.

## Quick Start

### 1. Install Playwright Browsers

```bash
npx playwright install
```

This downloads the necessary browser binaries (Chromium, Firefox, WebKit).

### 2. Set Up Test Environment

Create a `.env.local` file with test-specific variables:

```bash
# Copy the template
cp ENV_VARIABLES.md .env.local

# Edit .env.local and add:
HUBSPOT_TEST_API_KEY=your_test_portal_api_key
TEST_DEAL_ID=valid_deal_id_in_test_portal
```

**IMPORTANT:** Use a dedicated test HubSpot portal, NOT your production portal!

### 3. Run Your First Test

```bash
# Run tests in UI mode (recommended for first time)
npm run test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- See all available tests
- Run tests individually
- Watch tests execute step-by-step
- Inspect the DOM and network
- Debug failures easily

## Test HubSpot Portal Setup

### Why You Need a Test Portal

E2E tests make real API calls to HubSpot. Using production data could:
- Modify or delete important deals/tickets
- Create test data pollution
- Trigger unwanted automations
- Affect reporting and analytics

### Setting Up Your Test Portal

1. **Create a new HubSpot portal** (free tier is fine)
   - Go to https://www.hubspot.com/
   - Sign up for a new account
   - Choose "Developer" account type if available

2. **Generate an API Key**
   - Navigate to Settings → Integrations → Private Apps
   - Create a new private app
   - Grant required scopes:
     - `crm.objects.deals.read`
     - `crm.objects.deals.write`
     - `crm.objects.companies.read`
     - `crm.objects.contacts.read`
     - `crm.schemas.deals.read`
   - Copy the API key

3. **Create Test Data**
   - Create at least one test deal
   - Add some test companies
   - Note down the deal ID (visible in URL: `/contacts/{portalId}/deal/{dealId}`)

4. **Update Environment Variables**
   ```bash
   HUBSPOT_TEST_API_KEY=pat-na1-xxxxx-xxxxx
   TEST_DEAL_ID=123456789
   ```

## Running Tests

### Development Mode

```bash
# Interactive UI (best for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug mode (pauses on errors)
npm run test:e2e:debug
```

### CI/Headless Mode

```bash
# Run all tests (headless)
npm run test:e2e

# Run specific test file
npx playwright test e2e/deals/deal-detail.spec.ts

# Run tests matching a pattern
npx playwright test --grep "Deal Name Header"
```

### After Tests Run

```bash
# View HTML report
npm run test:e2e:report
```

## Understanding Test Results

### Successful Test Run

```
Running 25 tests using 3 workers
  ✓ [chromium] › deals/deal-detail.spec.ts:15:5 › Deal Detail Page › should navigate...
  ✓ [chromium] › deals/deal-detail.spec.ts:25:5 › Deal Detail Page › should display...
  ...
  
25 passed (30.5s)
```

### Failed Test

When a test fails:

1. **Console output** shows the error
2. **Screenshot** saved to `test-results/`
3. **Video** saved to `test-results/` (if enabled)
4. **Trace** saved for debugging

View the trace:
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Debugging Tests

### Method 1: UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

- Click on any test to run it
- Watch it execute in real-time
- Inspect DOM at any point
- View console logs and network requests
- Step through test actions

### Method 2: Headed Mode

```bash
npm run test:e2e:headed
```

- Runs tests in visible browser
- See exactly what the test is doing
- Useful for timing and interaction issues

### Method 3: Debug Mode

```bash
npm run test:e2e:debug
```

- Pauses execution on each step
- Opens Playwright Inspector
- Allows stepping through code
- Inspect elements interactively

### Method 4: VSCode Extension

1. Install "Playwright Test for VSCode" extension
2. Tests appear in the Testing sidebar
3. Run/debug individual tests with one click
4. Set breakpoints in test code

## Common Issues & Solutions

### Issue: "Browser not installed"

**Solution:**
```bash
npx playwright install
```

### Issue: "Failed to fetch deal"

**Causes:**
- Invalid `TEST_DEAL_ID`
- Wrong `HUBSPOT_TEST_API_KEY`
- API key lacks permissions

**Solution:**
1. Verify deal exists in your test portal
2. Check API key has correct scopes
3. Ensure `.env.local` is loaded

### Issue: "Timeout waiting for element"

**Causes:**
- Network is slow
- Element takes time to load
- Element doesn't exist

**Solution:**
1. Run test in UI mode to see what's happening
2. Check if element selector is correct
3. Verify test data exists in HubSpot

### Issue: "Tests pass locally but fail in CI"

**Causes:**
- Missing environment variables in CI
- CI environment is slower
- Timing issues

**Solution:**
1. Add secrets to GitHub repository settings
2. Increase timeouts if needed
3. Review CI logs and artifacts

## Writing Your First Test

Create a new test file: `e2e/my-feature/my-test.spec.ts`

```typescript
import { test, expect } from '../fixtures';

test.describe('My Feature', () => {
  test('should do something', async ({ authenticatedPage }) => {
    // Navigate to page
    await authenticatedPage.goto('/');
    
    // Interact with elements
    await authenticatedPage.click('text=Click Me');
    
    // Assert outcome
    await expect(authenticatedPage.locator('text=Success')).toBeVisible();
  });
});
```

Run your test:
```bash
npx playwright test my-test.spec.ts --headed
```

## Best Practices

1. ✅ **Use descriptive test names** - "should update deal name when save button clicked"
2. ✅ **Wait for elements properly** - Use Playwright's auto-waiting
3. ✅ **Use authenticatedPage fixture** - Never handle auth manually
4. ✅ **Test user flows** - Focus on what users do
5. ✅ **Keep tests independent** - Each test should work alone
6. ❌ **Avoid hardcoded waits** - Don't use `waitForTimeout(5000)`
7. ❌ **Don't test implementation** - Test behavior, not code
8. ❌ **Never use production data** - Always use test portal

## Next Steps

1. ✅ Install Playwright browsers
2. ✅ Set up test HubSpot portal
3. ✅ Configure environment variables
4. ✅ Run tests in UI mode
5. ✅ Review test results
6. ✅ Read `e2e/README.md` for detailed docs
7. ✅ Check `AGENTS.md` for full testing guidelines

## Resources

- [Playwright Documentation](https://playwright.dev)
- [e2e/README.md](e2e/README.md) - Detailed E2E testing docs
- [AGENTS.md](AGENTS.md) - Project development guide
- [ENV_VARIABLES.md](ENV_VARIABLES.md) - Environment setup

## Getting Help

If you encounter issues:

1. Check this guide and `e2e/README.md`
2. Run tests in UI mode to debug visually
3. Review error messages and stack traces
4. Check screenshots and videos in `test-results/`
5. Search [Playwright docs](https://playwright.dev)
6. Open an issue with:
   - Test code
   - Error message
   - Screenshots/videos
   - Environment details

