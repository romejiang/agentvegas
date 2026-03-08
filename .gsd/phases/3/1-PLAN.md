---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Data Models & Core Logic

## Objective
Establish the MongoDB schema and database operations for the Pixel Canvas system (Personal and Global).

## Context
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- server/models/Agent.ts

## Tasks

<task type="auto">
  <name>Create Canvas Models</name>
  <files>
    server/models/PersonalCanvas.ts
    server/models/GlobalCanvas.ts
  </files>
  <action>
    - Create `PersonalCanvas` Mongoose model. Schema: `agentId` (String, required, unique), `pixels` (Map of String to Number, representing "x,y" keys to colorIndex. Default: `{}`). This handles the 1000x1000 personal canvas sparsely.
    - Create `GlobalCanvas` Mongoose model. Schema: `chunkX` (Number, required, unique, ensures one doc per chunk length), `pixels` (Map of String to Object: `{ color: Number, agentId: String, timestamp: Date }`).
    - Note on GlobalCanvas: Since width is 50,000, we logically divide it into chunks of 100 pixels wide (0-499). `chunkX` represents `Math.floor(x / 100)`. Thus, one map document stores a 100x1000 area (max 100k pixels), which is exactly the right size for a rich document without hitting size limits.
  </action>
  <verify>cat server/models/GlobalCanvas.ts</verify>
  <done>Models are created with correct schemas for sparse/chunked storage using maps.</done>
</task>

<task type="auto">
  <name>Canvas Service Operations</name>
  <files>
    server/utils/canvasEngine.ts
  </files>
  <action>
    - Create `canvasEngine` singleton.
    - `getPersonalCanvas(agentId)`: Return the personal pixels map for the agent.
    - `paintPersonal(agentId, pixels)`: `pixels` is `[{x,y,color}, ...]`. Validate max 1000 items, `x` 0-999, `y` 0-999, `color` 0-1023. Update using a MongoDB transactional/atomic updates. Construct an update object for `$set`: `{"pixels.x,y": color}` for each pixel in the batch to avoid overwriting the whole Map. Use `updateOne` with `upsert: true`.
    - `getGlobalCanvasChunks(startChunk, endChunk)`: Queries `GlobalCanvas` where `chunkX >= startChunk && chunkX <= endChunk` and returns combined pixels.
    - `paintGlobal(agentId, pixels)`: `pixels` is `[{x,y,color}, ...]`. Validate bounds (`x` 0-49999, `y` 0-999). Group the pixels by their `chunkX`. For each `chunkX` group, perform a `bulkWrite` with `updateOne` and `$set: {"pixels.x,y": { color, agentId, timestamp: new Date() } }`, `upsert: true`.
  </action>
  <verify>cat server/utils/canvasEngine.ts</verify>
  <done>Canvas logic is encapsulated covering bounds checks, batch pixel updates using Map type efficiently.</done>
</task>

## Success Criteria
- [ ] MongoDB models exist and use Maps for O(1) pixel sparsity representation.
- [ ] Backend data service provides bulk writing functionality across horizontal chunks.
