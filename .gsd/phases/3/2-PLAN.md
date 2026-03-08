---
phase: 3
plan: 2
wave: 1
---

# Plan 3.2: API Endpoints & Gameplay Restrictions

## Objective
Implement Agent-facing API endpoints for the Canvas system, including economy integration (points deduction), cooldowns, and batch painting operations.

## Context
- server/utils/canvasEngine.ts
- server/models/Agent.ts

## Tasks

<task type="auto">
  <name>Update Agent Schema</name>
  <files>
    server/models/Agent.ts
  </files>
  <action>
    - Add `lastGlobalPaintDate` (Date, default null) to `Agent.ts` schema to track cooldowns.
  </action>
  <verify>grep lastGlobalPaintDate server/models/Agent.ts</verify>
  <done>Agent model includes the last paint date tracker.</done>
</task>

<task type="auto">
  <name>Personal Canvas APIs</name>
  <files>
    server/api/canvas/personal/[agentId].get.ts
    server/api/canvas/personal/paint.post.ts
  </files>
  <action>
    - `GET [agentId]`: Find `PersonalCanvas` for the agent. Return the pixels map or {} if none.
    - `POST paint`: 
      - Body expects `{ agentId, pixels: [{x, y, color}, ...] }`.
      - Check if Agent exists in DB.
      - Call `canvasEngine.paintPersonal`.
      - Return `{ success: true, message: "Painted successfully" }`.
  </action>
  <verify>ls server/api/canvas/personal</verify>
  <done>Personal canvas API endpoints working without constraints.</done>
</task>

<task type="auto">
  <name>Global Canvas APIs & Rules</name>
  <files>
    server/api/canvas/global/index.get.ts
    server/api/canvas/global/paint.post.ts
  </files>
  <action>
    - `GET index`: Accepts query params `startChunk` and `endChunk`. Calls `canvasEngine.getGlobalCanvasChunks` and returns pixels.
    - `POST paint`: 
      - Body expects `{ agentId, pixels: [{x, y, color}, ...] }`. Max 1000 items in pixels array. Return 400 if exceeded.
      - Lookup Agent. Calculate cost = `pixels.length`.
      - Check if Agent has `goldBalance >= cost`. If not, return 402 Payment Required.
      - Check Cooldown: If `Date.now() - agent.lastGlobalPaintDate.getTime() < 10 * 60 * 1000`, return 429 Too Many Requests (tell them how long is left).
      - Deduct `goldBalance` and Update `lastGlobalPaintDate = now`.
      - Call `canvasEngine.paintGlobal`.
      - Import `gameEngine` (or refactor to a standalone `wsBroadcast` utility) and broadcast `{ type: 'canvas_global_update', pixels, agentId, ... }` via WebSocket to instantly update viewers.
  </action>
  <verify>cat server/api/canvas/global/paint.post.ts</verify>
  <done>Global painting API implemented with 1-point/pixel cost, 10-minute cooldown, and WS broadcast.</done>
</task>

## Success Criteria
- [ ] Agents can update their personal canvas via API.
- [ ] Agents querying the global canvas API are correctly billed and rate-limited.
- [ ] Valid paints trigger a websocket push to all clients.
