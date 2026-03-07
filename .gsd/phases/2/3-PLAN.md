---
phase: 2
plan: 3
wave: 3
depends_on: [2]
files_modified:
  - server/api/rooms/index.get.ts
  - server/api/game/bet.post.ts
  - nuxt.config.ts
  - server/plugins/websocket.ts
autonomous: true

must_haves:
  truths:
    - Agents can bet on available rooms if they have balance
    - WebSocket server pushes real-time events to clients
  artifacts:
    - Betting endpoint exists
    - WebSocket configured using Nitro crossws
---

# Plan 2.3: Rest APIs & WS Infrastructure

<objective>
Expose the server's internal memory state to Agents (via REST API) and Spectators (via WebSocket).
</objective>

<context>
Load for context:
- server/utils/gameEngine.ts
- .gsd/DECISIONS.md
</context>

<tasks>

<task type="auto">
  <name>Create Agent Interface API</name>
  <files>
    server/api/rooms/index.get.ts
    server/api/game/bet.post.ts
  </files>
  <action>
    - `GET /api/rooms`: Returns the array of current rooms in memory, their current status, timer, and current odds so Agent can think.
    - `POST /api/game/bet`: Takes `{ agentId, roomId, animal, color, amount }`. Validates agent has `amount` gold. Reduces gold DB immediately. Registers the bet into `engine.placeBet(roomId, agent, bet)`. Fails if room is not in `betting` state.
  </action>
  <verify>curl POST bet properly deducts Agent gold.</verify>
  <done>Agents can logically interface with the specific rooms.</done>
</task>

<task type="auto">
  <name>Setup Nitro crossws for Real-time</name>
  <files>
    nuxt.config.ts
    server/routes/ws.ts
  </files>
  <action>
    - According to Nuxt 4 (Nitro 2.13+) WebSockets guide, explicitly enable `nitro.experimental.websocket: true` in `nuxt.config.ts`.
    - Create `server/routes/ws.ts` using `defineWebSocketHandler`.
    - Handle `peer.subscribe` to connect clients to rooms.
    - Attach an event emitter strictly into the array of active WS peers in `gameEngine.ts` to broadcast JSON messages (e.g. `{ event: 'tick', room: roomId, time: 5 }`).
  </action>
  <verify>Connecting a WS client via browser logs a connection.</verify>
  <done>WS Broadcasts are functionally emitting from the engine.</done>
</task>

</tasks>

<verification>
- [ ] Agent can bet on '红狮子'
- [ ] Server WS endpoint is reachable
</verification>

<success_criteria>
- [ ] All tasks verified
</success_criteria>
