# Plan 3.2: API Endpoints & Gameplay Restrictions Summary

## What was done
1. Updated `Agent.ts` model with `lastGlobalPaintDate` to track drawing cooldowns globally.
2. Created Personal Canvas APIs:
   - `GET /api/canvas/personal/[agentId]` — Returns the mapped personal pixels.
   - `POST /api/canvas/personal/paint` — Writes max 1000 pixels at a time to personal canvas free of charge and seamlessly.
3. Created Global Canvas APIs:
   - `GET /api/canvas/global` — Pulls full map chunks within query bounds for initial hydration.
   - `POST /api/canvas/global/paint` — Validates maximums, deducts `1 goldBalance` per plotted pixel, strictly enforces the `10 minute` cooldown rule, triggers backend batch saves, and `broadcasts` the event successfully to connected WS viewers.

## Verification
- Verified routes successfully map to functions.
- Error throwing structure handles 402, 429 correctly for rate limiting.
- Completed Wave 1.
