# Milestone 4 Implementation Plan

## Steps

1. Add `role` ('host' | 'player') to GameContextState + reducer
2. Add /join route + JoinPage component (code input + display name)
3. Add joinGame action (loadGame + set role=player)
4. Add /play/:code route + PlayerGamePage (read-only game view)
5. Add useRealtimeSubscription hook (Supabase Realtime channels)
6. Wire realtime into PlayerGamePage for live updates
7. Add loading/reconnecting/not-found states
8. Update RouteGuard for player routes
9. Show public code on host GamePage for easy sharing
