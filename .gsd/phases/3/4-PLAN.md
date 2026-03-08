---
phase: 3
plan: 4
wave: 3
---

# Plan 3.4: UI Pages & Live Connectivity

## Objective
Integrate the Canvas rooms into the main lobby and build the dedicated Canvas viewing rooms connected to the WebSocket feed.

## Context
- app/pages/index.vue
- app/components/PixelCanvasRenderer.vue
- server/routes/ws.ts

## Tasks

<task type="auto">
  <name>Lobby Room Layout</name>
  <files>
    app/pages/index.vue
  </files>
  <action>
    - Inject two static room panels at the start of the `roomList` grid rendering loop (or before it in the template).
    - 1st Card: "Agent 个人画板 (自画像)" -> leads to `/room/canvas-personal`. Make card have a creative icon or border.
    - 2nd Card: "全球共享大画板 (Global Canvas)" -> leads to `/room/canvas-global`. Give it a glittering global aesthetic.
  </action>
  <verify>cat app/pages/index.vue</verify>
  <done>The visual hierarchy emphasizes the new Canvas mode alongside the roulette.</done>
</task>

<task type="auto">
  <name>Canvas Room View Components</name>
  <files>
    app/pages/room/canvas-personal.vue
    app/pages/room/canvas-global.vue
  </files>
  <action>
    - **canvas-personal.vue**: 
      - Layout with a search bar: "输入 Agent ID 查看画作".
      - Fetch `/api/canvas/personal/:id` on search.
      - Display the returned data inside `<PixelCanvasRenderer mode="personal" totalWidth="1000" />`.
    - **canvas-global.vue**:
      - Full-page layout (or within 1000px height view port).
      - Setup `WebSocket` on mount, identical pattern to `[id].vue`. Listen to `type === 'canvas_global_update'`. 
      - When update arrives, pass the new pixels directly to a `drawPixels` ref in `PixelCanvasRenderer` so it paints dynamically.
      - On hydration/mount, execute `await useFetch('/api/canvas/global')` to fetch the baseline chunks. (For v1, fetch everything or chunks 0-499. Or implement an intersection observer to fetch chunks lazy. Given our timescale, fetching all chunks on load or a hardcoded range like first 10,000 pixels is fine. Let's do lazy fetch: fetch chunks based on horizontal scroll position).
      - UI copy: Show the legend for costs (1金币/像素) and cooldowns.
  </action>
  <verify>ls app/pages/room/</verify>
  <done>Fully playable/watchable pages implemented for personal and global modes.</done>
</task>

<task type="auto">
  <name>Fix Broadcast Method Sync</name>
  <files>
    server/routes/ws.ts
  </files>
  <action>
    - Currently, `gameEngine.broadcast` is monkey-patched here. Ensure that when our `/api/canvas/global/paint.post.ts` calls `gameEngine.broadcast`, the WebSocket handler handles dispatch correctly across all peers.
    - No changes needed if we just reuse `gameEngine.broadcast`, but worth verifying the export works. Ensure `gameEngine.broadcast('[GLOBAL_CANVAS]', { type: 'canvas_global_update', pixels })` will pipe properly to all connected WS clients.
  </action>
  <verify>cat server/routes/ws.ts</verify>
  <done>Websocket plumbing confirmed ready for pixel diffs.</done>
</task>

## Success Criteria
- [ ] Lobby prominently directs to the two new Canvas hubs.
- [ ] Global drawing updates appear instantly to passive viewers.
