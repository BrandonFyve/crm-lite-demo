# E2E Testing Quick Reference

Quick command reference for E2E testing in CRM Lite.

## 🚀 Quick Start

```bash
# 1. Install Playwright browsers
npx playwright install

# 2. Set up environment (add to .env.local)
HUBSPOT_TEST_API_KEY=your_test_key
TEST_DEAL_ID=your_test_deal_id

# 3. Run tests in UI mode
npm run test:e2e:ui
```

## 📝 Common Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI (recommended for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test e2e/deals/deal-detail.spec.ts

# Run tests matching pattern
npx playwright test --grep "Deal Name"

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🔍 Debugging

```bash
# Best: UI mode (visual debugging)
npm run test:e2e:ui

# View trace file
npx playwright show-trace test-results/.../trace.zip

# Run single test in debug mode
npx playwright test --debug e2e/deals/deal-detail.spec.ts

# Generate and view HTML report
npx playwright show-report
```

## 📁 File Locations

```
e2e/
├── deals/deal-detail.spec.ts    # Deal detail page tests (30+ tests)
├── fixtures/
│   ├── auth.ts                  # Authentication bypass
│   ├── index.ts                 # Test fixtures
│   └── test-data.ts             # Test data
└── utils/test-helpers.ts        # Helper functions
```

## 📚 Documentation

| File | Purpose |
|------|---------|
| `E2E_TESTING_SETUP.md` | Complete setup guide |
| `e2e/README.md` | E2E directory guide |
| `E2E_IMPLEMENTATION_SUMMARY.md` | Implementation details |
| This file | Quick reference |

## 🧪 Writing Tests Template

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

  test('should do something', async ({ authenticatedPage }) => {
    // Arrange
    const form = helpers.getFormElements();
    
    // Act
    await form.nedbankBankerInput.fill('Value');
    await form.saveChangesButton.click();
    
    // Assert
    await helpers.waitForToast('Success');
  });
});
```

## 🎯 Test Coverage

- ✅ Navigation and Loading (4 tests)
- ✅ Deal Name Header (6 tests)
- ✅ Deal Overview Form (8 tests)
- ✅ Notes Panel (6 tests)
- ✅ Associated Company (3 tests)
- ✅ Error Handling (2 tests)

**Total: 30+ E2E tests**

## ⚙️ Environment Variables

Required in `.env.local`:

```bash
HUBSPOT_TEST_API_KEY=your_test_portal_key
TEST_DEAL_ID=valid_deal_id
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Browser not installed | `npx playwright install` |
| Test timeout | Run in UI mode to see what's happening |
| Element not found | Check selector, add waits |
| Auth redirect | Use `authenticatedPage` fixture |

## 💡 Best Practices

✅ Use `authenticatedPage` fixture  
✅ Use semantic selectors (text, labels)  
✅ Wait for elements properly  
✅ Test user flows, not implementation  
✅ Keep tests independent  
✅ Use descriptive test names  

❌ Don't use `waitForTimeout()`  
❌ Don't test implementation details  
❌ Don't use production data  

## 🔗 Useful Links

- [Playwright Docs](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)

## 🆘 Getting Help

1. Check documentation files
2. Run in UI mode: `npm run test:e2e:ui`
3. View screenshots in `test-results/`
4. Check Playwright docs
5. Open issue with details

---

**For full setup instructions**: See `E2E_TESTING_SETUP.md`  
**For detailed documentation**: See `e2e/README.md`  
**For implementation details**: See `E2E_IMPLEMENTATION_SUMMARY.md`

