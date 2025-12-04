# Environment Variables

This document describes all environment variables required for the CRM Lite application.

## Required Environment Variables

### Clerk Authentication

```bash
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### HubSpot Integration

```bash
HUBSPOT_API_KEY=your_hubspot_api_key_here
```

## E2E Testing Configuration

**IMPORTANT:** For E2E tests, you should use a dedicated test HubSpot portal.  
**DO NOT** use your production HubSpot portal for testing.

### Test Environment Variables

```bash
# Test HubSpot API Key (from your test portal)
HUBSPOT_TEST_API_KEY=your_test_hubspot_api_key_here

# Test Deal ID (a valid deal ID in your test portal)
TEST_DEAL_ID=your_test_deal_id_here

# Playwright Configuration (Optional)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Setup Instructions

1. Copy the environment variable template above
2. Create a `.env.local` file in the project root
3. Fill in your actual values
4. Never commit `.env.local` to version control

## CI/CD Secrets

For GitHub Actions CI/CD, configure these secrets in your repository settings:

- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `HUBSPOT_API_KEY` (production)
- `HUBSPOT_TEST_API_KEY` (test portal)
- `TEST_DEAL_ID` (valid deal ID in test portal)

## Test Portal Setup

To set up your test HubSpot portal:

1. Create a separate HubSpot portal for testing
2. Generate an API key from the test portal
3. Create test deals, tickets, and other data
4. Note down the IDs of test records
5. Use these IDs in your E2E tests

This ensures your production data remains safe during automated testing.

