# AGENTS.md - CRM Lite Development Guide

## Project Overview

**CRM Lite** is a lightweight Customer Relationship Management application built with Next.js 15, designed to manage deals, tickets, and customer interactions with HubSpot integration.

## Tech Stack

### Core Framework
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe development

### Key Dependencies
- **Authentication**: Clerk (`@clerk/nextjs`)
- **External Integration**: HubSpot API Client (`@hubspot/api-client`)
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS 4 with `tailwind-merge` and `class-variance-authority`
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: dnd-kit library
- **Date Handling**: date-fns
- **Notifications**: Sonner
- **HTTP Client**: Axios

## Development Philosophy

### ⚠️ Test-Driven Development (STRICT REQUIREMENT)

This project **MUST** follow strict Test-Driven Development practices:

#### TDD Workflow (Red-Green-Refactor)
1. **Write the test FIRST** - Before implementing any feature or fix
2. **Run the test and see it fail** (Red phase)
3. **Write minimal code to make the test pass** (Green phase)
4. **Refactor while keeping tests green** (Refactor phase)

#### Testing Requirements
- **Every new feature** must have tests written before implementation
- **Every bug fix** must include a failing test that reproduces the bug
- **API routes** must have integration tests
- **React components** must have unit tests for logic and user interactions
- **Utility functions** must have comprehensive unit tests
- **Critical user flows** must have end-to-end tests

#### Test Coverage Standards
- Minimum 80% code coverage for new code
- 100% coverage for critical business logic (deal/ticket management, HubSpot sync)
- All edge cases must be tested
- Error handling must be tested

#### Before Committing
- All tests must pass
- No skipped tests allowed in main branch
- Add tests for any uncovered edge cases discovered during development

## Code Conventions

### Component Patterns
- **Server Components by default** - Use `"use client"` only when needed
- **Client-side interactivity**: Explicit `"use client"` directive
- **Separation of concerns**: Keep business logic separate from UI
- **Composition over inheritance**: Build complex UIs from simple components

### API Routes
- Use Next.js App Router API conventions (`route.ts`)
- Implement proper error handling with appropriate HTTP status codes
- Validate inputs using Zod schemas
- Return consistent response formats
- Handle authentication via Clerk middleware

### State Management
- **Server state**: React Server Components
- **Client state**: React hooks (useState, useReducer)
- **Forms**: React Hook Form with Zod validation
- **URL state**: Next.js router and searchParams

### Styling
- Use Tailwind CSS utility classes
- Leverage `cn()` utility for conditional classes
- Follow shadcn/ui patterns for component styling
- Use CSS variables for theming (defined in `globals.css`)

## Testing Standards

### Test File Organization
```
src/
├── __tests__/                 # Test files mirror src structure
│   ├── app/
│   │   └── api/
│   │       └── deals/
│   │           └── route.test.ts
│   ├── components/
│   │   └── DealBoard.test.tsx
│   └── lib/
│       └── hubspot.test.ts
```

### Testing Tools
- **Jest** - Unit testing framework (configured)
- **React Testing Library** - Component testing (configured)
- **Playwright** - E2E testing (configured)

### Test Naming Convention
```typescript
describe('ComponentName or FeatureName', () => {
  it('should do something specific when condition', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## HubSpot Integration

### API Integration Points
- Deal management (CRUD operations)
- Ticket management (CRUD operations)
- Owner/user synchronization
- Notes and activities

### Best Practices
- Cache HubSpot data appropriately
- Handle API rate limits gracefully
- Implement retry logic for failed requests
- Log integration errors for debugging
- Test HubSpot integrations with mocked responses

## Authentication

- **Clerk** handles all authentication
- Middleware protects routes automatically
- Use `auth()` helper in Server Components
- Use `useAuth()` hook in Client Components
- All API routes should validate authentication

## Error Handling

### Client-Side
- Use error boundaries for component errors
- Display user-friendly error messages with Sonner toasts
- Log errors to console in development

### Server-Side
- Return appropriate HTTP status codes
- Include error messages in response bodies
- Log errors with context for debugging
- Never expose sensitive information in error messages

## Performance Considerations

- Use Server Components for data fetching when possible
- Implement proper loading states with Suspense
- Optimize images with Next.js Image component
- Code split with dynamic imports for large components
- Minimize client-side JavaScript

## Code Quality

### Before Any Code Changes
1. **Write tests first** (TDD requirement)
2. Ensure ESLint passes (`npm run lint`)
3. Verify TypeScript compilation
4. Test locally with `npm run dev`
5. Run all tests and ensure they pass

### Pull Request Checklist
- [ ] Tests written before implementation
- [ ] All tests pass
- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] No ESLint errors or warnings
- [ ] Component logic tested
- [ ] API endpoints tested
- [ ] Error cases handled and tested
- [ ] Documentation updated if needed

## Development Workflow

1. **Start with tests**: Write failing test for new feature/bug fix
2. **Implement**: Write minimal code to pass the test
3. **Refactor**: Improve code while maintaining passing tests
4. **Verify**: Run linter and all tests
5. **Commit**: Use clear, descriptive commit messages

## Common Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test             # Run unit tests with Jest
npm test -- --watch  # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests with Playwright
npm run test:e2e:ui  # Run E2E tests with Playwright UI
npm run test:e2e:debug # Debug E2E tests
npm run test:e2e:headed # Run E2E tests in headed mode (visible browser)
npm run test:e2e:report # Show Playwright test report
```

## Key Features

### Deals Management
- Kanban board view with drag-and-drop
- Table view with sorting and filtering
- Deal stages and pipeline management
- Notes and activity tracking
- Service options configuration
- HubSpot synchronization

### Tickets Management
- Board view with sortable items
- Ticket stages workflow
- Notes and comments
- Status tracking

### UI Components
- Modern, accessible design with Radix UI primitives
- Responsive layouts
- Form validation with real-time feedback
- Toast notifications for user feedback
- Calendar and date pickers
- Command palette (cmdk)

## End-to-End Testing with Playwright

### Overview

E2E tests validate complete user workflows using real browsers. Tests are located in the `e2e/` directory and use Playwright.

### Test Structure

```
e2e/
├── fixtures/
│   ├── auth.ts          # Authentication bypass for tests
│   ├── index.ts         # Extended test fixtures
│   └── test-data.ts     # Test data and mock responses
├── utils/
│   └── test-helpers.ts  # Helper functions for tests
└── deals/
    └── deal-detail.spec.ts # Deal detail page tests
```

### Authentication Strategy

E2E tests **bypass Clerk authentication** using a server-side approach:
- `E2E_TEST_MODE=true` environment variable set in `playwright.config.ts`
- Middleware (`src/middleware.ts`) checks this flag and skips Clerk authentication
- Page components provide fallback mock user data when in test mode
- This is the recommended approach per Clerk's E2E testing documentation

**Why this approach?**
- ✅ Works for both client and server-side authentication checks
- ✅ More reliable than mocking complex Clerk API flows
- ✅ Simpler to maintain
- ✅ Bypasses at the source (middleware) rather than trying to fool the server

This allows tests to focus on application functionality without requiring actual authentication.

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Run with Playwright UI (recommended for development)
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Test Configuration

E2E tests require a dedicated test HubSpot portal. Set these environment variables:

```bash
HUBSPOT_TEST_API_KEY=your_test_portal_api_key
TEST_DEAL_ID=valid_deal_id_in_test_portal
```

**IMPORTANT:** Never use production HubSpot data for E2E tests!

### Writing E2E Tests

Follow this pattern when writing new E2E tests:

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

  test('should perform specific user action', async ({ authenticatedPage }) => {
    // Arrange: Set up test conditions
    const form = helpers.getFormElements();
    
    // Act: Perform the action
    await form.nedbankBankerInput.fill('New Value');
    await form.saveChangesButton.click();
    
    // Assert: Verify the outcome
    await helpers.waitForToast('Deal updated successfully');
    await expect(form.nedbankBankerInput).toHaveValue('New Value');
  });
});
```

### Test Helpers

Use `DealPageHelpers` class for common operations:

```typescript
const helpers = new DealPageHelpers(page);

// Navigation
await helpers.navigateToDeal(dealId);
await helpers.waitForDealLoad();

// Get page elements
const header = helpers.getDealHeader();
const form = helpers.getFormElements();
const notes = helpers.getNotesPanel();

// Perform actions
await helpers.updateDealName('New Name');
await helpers.submitOverviewForm({ nedbankBanker: 'Value' });
await helpers.addNote('Test note');

// Verify results
await helpers.waitForToast('Success message');
await helpers.verifyErrorCard('Error message');
```

### Best Practices for E2E Tests

1. **Use authenticatedPage fixture** - Automatically bypasses auth
2. **Wait for elements properly** - Use built-in Playwright waits
3. **Use semantic selectors** - Prefer labels and text over CSS classes
4. **Test user flows, not implementation** - Focus on user perspective
5. **Keep tests independent** - Each test should work in isolation
6. **Use descriptive test names** - Follow "should... when..." pattern
7. **Clean up test data** - Reset state between tests if needed
8. **Handle timing issues** - Use waitFor methods, not arbitrary timeouts

### Debugging E2E Tests

When tests fail:

1. **View trace viewer**: `npx playwright show-trace trace.zip`
2. **Run in UI mode**: `npm run test:e2e:ui`
3. **Run in headed mode**: `npm run test:e2e:headed`
4. **Use debug mode**: `npm run test:e2e:debug`
5. **Check screenshots**: Located in `test-results/` after failure
6. **Review videos**: Available in `test-results/` for failed tests

### Common Issues & Solutions

**Issue**: "Element not found"
- **Solution**: Add proper wait conditions, check selector specificity

**Issue**: "Timeout waiting for element"
- **Solution**: Increase timeout, verify element actually appears, check for loading states

**Issue**: "Test passes locally but fails in CI"
- **Solution**: Ensure CI has proper environment variables, check for timing issues

**Issue**: "Authentication redirects in tests"
- **Solution**: Verify auth bypass is properly configured in fixtures

### CI/CD Integration

E2E tests run automatically in GitHub Actions:
- Tests run after build step
- Only Chromium browser used in CI (faster)
- Test artifacts uploaded on failure
- Uses `HUBSPOT_TEST_API_KEY` secret

## Environment Variables

Ensure these are configured (check `ENV_VARIABLES.md`):
- Clerk authentication keys
- HubSpot API credentials (production)
- HubSpot Test API key (for E2E tests)
- Test Deal ID (for E2E tests)
- Next.js environment settings

## Additional Notes

- **TypeScript**: Always use proper typing; avoid `any` unless absolutely necessary
- **Accessibility**: Ensure components are keyboard navigable and screen reader friendly
- **Performance**: Monitor bundle size and optimize imports
- **Security**: Never commit sensitive credentials or API keys
- **Documentation**: Update this file when project structure or conventions change

## Getting Help

- Next.js Documentation: https://nextjs.org/docs
- Clerk Documentation: https://clerk.com/docs
- HubSpot API Reference: https://developers.hubspot.com/docs/api/overview
- shadcn/ui: https://ui.shadcn.com

## MCP Servers

You have access to the following MCP tools:
- Shadcn for any and all shadcndocumentation
- Playwright

---

**Remember: Tests first, code second. No exceptions.**

