
# Fix for Blinking Dashboard

## Problem Analysis

After thorough investigation, I've identified **multiple root causes** creating the blinking dashboard effect:

### Primary Issues

1. **Competing Data Fetching Loops**
   - `useMemberData` polls every 15 seconds via `usePollingRefresh`
   - `useLoans` also polls every 15 seconds independently
   - `SovereignFeed` polls every 10 seconds
   - `InterestDisplay` has a 1-second countdown timer that causes constant re-renders
   - Each poll cycle triggers state updates that cascade through the component tree

2. **AnimatePresence/Framer Motion Conflicts**
   - `AnimatedRoutes` wraps all routes with `AnimatePresence mode="wait"`
   - `PageTransition` applies scale/opacity animations on every route
   - When combined with loading states, this creates a visual "blink" as components fade in/out rapidly

3. **Loading State Flicker**
   - `ProtectedRoute` shows `SovereignMonolith` during loading
   - `MemberPulse` shows skeleton cards during loading
   - `AlphaMarketplace` shows "Loading loans..." during data fetching
   - Multiple components toggle loading states rapidly on each poll cycle

4. **Unnecessary Re-renders from Context**
   - `useAuth` and `useMemberData` contexts update frequently
   - Children re-render even when their specific data hasn't changed
   - `profile` changes trigger full Dashboard re-render

### Secondary Issues

5. **Profile Fetch Race Condition**
   - `useAuth` uses `setTimeout(() => fetchProfile(), 0)` which can cause flicker
   - Profile data loading after initial render causes visual jump

6. **StaggeredContainer Animation Conflicts**
   - Dashboard uses staggered animations that re-trigger on data updates

## Solution Plan

### Step 1: Stabilize Loading States
- Add `loading` state debouncing to prevent rapid flicker
- Only show loading states on initial load, not during polling refresh
- Use "silent" refresh pattern consistently across all hooks

### Step 2: Fix Polling Architecture
- Remove redundant polling in child components (SovereignFeed already has its own)
- Ensure `useMemberData` and `useLoans` use "silent" mode during subsequent fetches
- Add `didInitialFetch` tracking to prevent loading state flicker

### Step 3: Prevent Animation Re-triggers
- Move `StaggeredContainer` animation to only trigger once on mount
- Add `key` stability to animated components
- Use `layout` prop carefully to prevent layout thrashing

### Step 4: Optimize Context Re-renders
- Memoize context values in `AuthProvider` and `MemberDataProvider`
- Split profile data from auth state to prevent unnecessary re-renders
- Use `useMemo` for derived data

### Step 5: Fix InterestDisplay Timer
- Move countdown timer to use CSS animation instead of JS interval
- Or reduce re-render scope by isolating timer to a small component

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useMemberDataInternal.tsx` | Add loading debounce, always use silent refresh after initial load |
| `src/hooks/useLoans.tsx` | Fix loading state to only show on initial fetch |
| `src/hooks/useAuth.tsx` | Memoize context value, remove setTimeout race |
| `src/components/dashboard/MemberPulse.tsx` | Cache previous data to prevent skeleton flash |
| `src/components/dashboard/AlphaMarketplace.tsx` | Use skeleton instead of text during refresh |
| `src/components/interest/InterestDisplay.tsx` | Isolate countdown timer to prevent parent re-renders |
| `src/components/transitions/StaggeredContainer.tsx` | Only animate on initial mount |
| `src/pages/Dashboard.tsx` | Add stable keys and prevent re-animation |

## Technical Implementation

### Loading State Fix Pattern
```typescript
// Before: Flickers on every poll
if (loading || !memberData) {
  return <Skeleton />;
}

// After: Only show skeleton on true initial load
const [hasInitialData, setHasInitialData] = useState(false);

useEffect(() => {
  if (memberData) setHasInitialData(true);
}, [memberData]);

if (!hasInitialData) {
  return <Skeleton />;
}
// Show stale data during refresh instead of skeleton
```

### Context Memoization Pattern
```typescript
const value = useMemo(() => ({
  user, session, loading, roles, profile,
  signUp, signIn, signOut, hasRole, refreshProfile
}), [user, session, loading, roles, profile]);

return <AuthContext.Provider value={value}>...
```

### Staggered Animation Fix
```typescript
// Only animate once on mount, not on data changes
const [hasAnimated, setHasAnimated] = useState(false);

return (
  <motion.div
    variants={containerVariants}
    initial={hasAnimated ? false : "hidden"}
    animate="visible"
    onAnimationComplete={() => setHasAnimated(true)}
  >
```

## Expected Outcome

After these changes:
- Dashboard will load once smoothly without blinking
- Data refreshes will happen silently in the background
- Stale data shown during refresh (better UX than skeleton flash)
- Animations only play on initial page load
- No visual disruption during 10-15 second polling cycles
