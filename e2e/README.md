# End-to-End Tests

This directory contains end-to-end tests for CRM Lite using Playwright.

## Directory Structure

```
e2e/
├── fixtures/
│   ├── auth.ts          # Authentication bypass for tests
│   ├── index.ts         # Extended test fixtures and utilities
│   └── test-data.ts     # Test data, mock responses, and constants
├── utils/
│   └── test-helpers.ts  # Helper classes and functions for tests
├── deals/
│   └── deal-detail.spec.ts  # Tests for deal detail page
└── README.md            # This file
```

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (recommended for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Prerequisites

### 1. Environment Variables

Create a `.env.local` file with test-specific variables:

```bash
# Use a dedicated TEST HubSpot portal (NOT production!)
HUBSPOT_TEST_API_KEY=your_test_portal_api_key
TEST_DEAL_ID=valid_deal_id_in_test_portal
```

See `ENV_VARIABLES.md` in the project root for complete setup instructions.

### 2. Test Data Setup

1. Create a separate HubSpot test portal
2. Create test deals, tickets, and other data
3. Note down the IDs of test records
4. Update `TEST_DEAL_ID` in your `.env.local`

**IMPORTANT:** Never use production HubSpot portal for E2E tests!

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures';
import { DealPageHelpers } from '../utils/test-helpers';
import { TEST_DEAL_IDS } from '../fixtures/test-data';

test.describe('Feature Name', () => {
  let helpers: DealPageHelpers;

  test.beforeEach(async ({ authenticatedPage }) => {
    helpers = new DealPageHelpers(authenticatedPage);
    await helpers.navigateToDeal(TEST_DEAL_IDS.VALID_DEAL);
    await helpers.waitForDealLoad();
  });

  test('should do something when condition is met', async ({ authenticatedPage }) => {
    // Arrange
    const form = helpers.getFormElements();
    
    // Act
    await form.nedbankBankerInput.fill('New Value');
    await form.saveChangesButton.click();
    
    // Assert
    await helpers.waitForToast('Success message');
    await expect(form.nedbankBankerInput).toHaveValue('New Value');
  });
});
```

### Using Test Fixtures

All tests automatically get an `authenticatedPage` that bypasses Clerk authentication:

```typescript
test('test name', async ({ authenticatedPage }) => {
  // authenticatedPage has auth cookies and session set up
  await authenticatedPage.goto('/deals/123');
  // No need to handle sign-in!
});
```

### Using Test Helpers

The `DealPageHelpers` class provides convenient methods:

```typescript
const helpers = new DealPageHelpers(page);

// Navigation
await helpers.navigateToDeal(dealId);
await helpers.waitForDealLoad();

// Get page elements
const header = helpers.getDealHeader();
const form = helpers.getFormElements();
const notes = helpers.getNotesPanel();
const company = helpers.getCompanySection();

// Perform actions
await helpers.updateDealName('New Name');
await helpers.submitOverviewForm({ nedbankBanker: 'Value' });
await helpers.addNote('Test note');

// Verify results
await helpers.waitForToast('Expected message');
await helpers.verifyErrorCard('Error message');
```

## Best Practices

1. **Always use authenticatedPage fixture** - Never try to authenticate manually
2. **Use semantic selectors** - Prefer text content and labels over CSS classes
3. **Wait properly** - Use Playwright's built-in waiting, avoid `waitForTimeout`
4. **Test user flows** - Focus on what users do, not implementation details
5. **Keep tests isolated** - Each test should work independently
6. **Use descriptive names** - Follow "should [action] when [condition]" pattern
7. **Handle async properly** - Always await async operations
8. **Verify outcomes** - Check for success/error messages and state changes

## Debugging Failed Tests

### 1. Run with UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

This opens Playwright's UI where you can:
- Step through tests
- See live preview
- Inspect DOM
- View network requests

### 2. Run in Headed Mode

```bash
npm run test:e2e:headed
```

Runs tests in a visible browser window.

### 3. Use Debug Mode

```bash
npm run test:e2e:debug
```

Pauses test execution and opens debugging tools.

### 4. View Trace

After a test fails, view the trace:

```bash
npx playwright show-trace test-results/.../trace.zip
```

### 5. Check Artifacts

Failed tests generate:
- Screenshots: `test-results/`
- Videos: `test-results/`
- Traces: `test-results/`

## Common Issues

### "Element not found"

**Cause**: Element doesn't exist or hasn't loaded yet  
**Solution**: 
- Verify selector is correct
- Add proper wait condition
- Check if element is behind loading state

### "Timeout waiting for element"

**Cause**: Element takes too long to appear  
**Solution**:
- Increase timeout: `await element.waitFor({ timeout: 15000 })`
- Check if there's an error preventing element from appearing
- Verify test data exists in HubSpot

### "Authentication redirect"

**Cause**: Auth bypass not working  
**Solution**:
- Verify you're using `authenticatedPage` fixture
- Check `e2e/fixtures/auth.ts` is properly configured
- Clear browser cookies and try again

### "Test passes locally but fails in CI"

**Cause**: Environment differences  
**Solution**:
- Verify CI has correct environment variables
- Check timing issues (CI is often slower)
- Review CI logs and artifacts

## Adding New Test Suites

1. Create new spec file in appropriate directory:
   ```
   e2e/
   └── tickets/
       └── ticket-detail.spec.ts
   ```

2. Follow the test structure pattern shown above

3. Create page-specific helpers if needed:
   ```typescript
   // e2e/utils/ticket-helpers.ts
   export class TicketPageHelpers {
     constructor(private page: Page) {}
     // ... helper methods
   }
   ```

4. Add test data to `e2e/fixtures/test-data.ts`:
   ```typescript
   export const TEST_TICKET_IDS = {
     VALID_TICKET: process.env.TEST_TICKET_ID || '123',
   };
   ```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [AGENTS.md](../AGENTS.md) - Project development guide
- [ENV_VARIABLES.md](../ENV_VARIABLES.md) - Environment setup

