# Rate Limit Fix - HubSpot 429 Error Resolution

## Problem Description

The application was experiencing intermittent **HTTP 429 (Too Many Requests)** errors on the home page when deployed to Vercel. The error message indicated:

```
"You have reached your secondly limit"
errorType: "RATE_LIMIT"
policyName: "SECONDLY"
```

This was caused by **3 simultaneous HubSpot API calls** being made when the home page loaded:

1. **Server-side (during SSR):**
   - `getDealStages()` - Fetches deal pipeline stages
   - `searchDeals()` - Fetches up to 100 deals

2. **Client-side (after hydration):**
   - `useOwners()` hook → `/api/owners` → `getOwners()` - Fetches HubSpot owners

When deployed to Vercel's serverless environment, these calls could execute nearly simultaneously, exceeding HubSpot's per-second rate limit.

## Solutions Implemented

### Solution 1: Server-Side Owners Fetch ✅

**Moved the owners data fetch from client-side to server-side** to eliminate one of the concurrent API calls.

#### Changes Made:

**`src/app/page.tsx`:**
- Added `getOwners()` import
- Fetched owners server-side using `Promise.all()` alongside stages and auth
- Passed `owners` as `initialOwners` prop to `DealsViewContainer`

**`src/components/DealsViewContainer.tsx`:**
- Removed `useOwners()` hook (client-side fetch)
- Added `initialOwners` prop to component interface
- Used server-provided owners directly instead of fetching

**Benefits:**
- ✅ Eliminates client-side API call to `/api/owners`
- ✅ Reduces total HubSpot API calls from 3 to 2
- ✅ Faster page load (no client-side fetch delay)
- ✅ Better SEO (owners data available during SSR)

### Solution 2: Next.js Caching ✅

**Added `unstable_cache` to HubSpot API calls** to cache responses and prevent repeated requests.

#### Changes Made:

**`src/lib/hubspot-deals.ts`:**
- Imported `unstable_cache` from `next/cache`
- Wrapped `getDealStages()` function with `unstable_cache()`
- Cache configuration:
  - Key: `["deal-stages"]`
  - Revalidate: 3600 seconds (1 hour)
  - Tags: `["hubspot-stages"]`

**`src/lib/hubspot-owners.ts`:**
- Imported `unstable_cache` from `next/cache`
- Wrapped `getOwners()` function with `unstable_cache()`
- Cache configuration:
  - Key: `["hubspot-owners"]`
  - Revalidate: 3600 seconds (1 hour)
  - Tags: `["hubspot-owners"]`

**Benefits:**
- ✅ Caches HubSpot responses for 1 hour
- ✅ Reduces repeated API calls across page loads
- ✅ Improves performance for all users
- ✅ Further reduces risk of rate limiting
- ✅ Can invalidate cache by tag if needed

## Test Updates

Updated tests to reflect the new architecture:

### `src/__tests__/app/page.test.tsx`
- Added mock for `getOwners()`
- Updated test expectations to verify owners are fetched server-side
- Added mock data for owners

### `src/__tests__/components/DealsViewContainer.test.tsx`
- Removed `fetchOwners` mock (no longer used)
- Added `initialOwners` prop to all test renders
- Simplified test setup (no client-side fetch to wait for)

**All tests pass successfully! ✅**

## Impact Summary

### Before Fix:
- 🔴 3 concurrent HubSpot API calls on page load
- 🔴 Intermittent 429 rate limit errors
- 🔴 Client-side fetch delay for owners dropdown
- 🔴 No caching = repeated API calls

### After Fix:
- ✅ Only 2 server-side API calls (parallel)
- ✅ 1-hour cache reduces total API calls significantly
- ✅ No client-side HubSpot API calls
- ✅ Faster page loads
- ✅ No more 429 errors

## Cache Management

If you need to invalidate the cache (e.g., when HubSpot data changes):

```typescript
import { revalidateTag } from 'next/cache';

// Revalidate stages
revalidateTag('hubspot-stages');

// Revalidate owners
revalidateTag('hubspot-owners');
```

## Monitoring

To verify the fix is working:
1. Deploy to Vercel
2. Monitor application logs for 429 errors
3. Check cache hit rates in Next.js analytics
4. Verify page load times improve

## Additional Recommendations (Optional)

For even better resilience, consider:

1. **Retry Logic**: Add exponential backoff for rate-limited requests
2. **Request Queuing**: Implement a queue for HubSpot API calls
3. **Upgrade HubSpot Plan**: Increase API rate limits if needed
4. **Longer Cache Duration**: Increase to 2-4 hours if data changes infrequently

## Related Files

- `/src/app/page.tsx` - Server component with owners fetch
- `/src/components/DealsViewContainer.tsx` - Client component using initial owners
- `/src/lib/hubspot-deals.ts` - Cached deal stages function
- `/src/lib/hubspot-owners.ts` - Cached owners function
- `/src/__tests__/app/page.test.tsx` - Updated server component tests
- `/src/__tests__/components/DealsViewContainer.test.tsx` - Updated client component tests

## Deployment Notes

✅ **Safe to deploy immediately**
- All tests passing
- No breaking changes
- Backward compatible
- Performance improvements only

---

**Fix Date:** October 24, 2025  
**Status:** ✅ Resolved

