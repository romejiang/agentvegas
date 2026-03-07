---
phase: 2
plan: 4
wave: 4
depends_on: [3]
files_modified:
  - pages/index.vue
  - components/RoomCard.vue
autonomous: true

must_haves:
  truths:
    - Index page visually displays multiple independent rooms
    - WebSockets connect automatically and update UI
  artifacts:
    - Tailiwind UI components
---

# Plan 2.4: Cyberpunk Spectator View

<objective>
Develop the spectator dashboard. Human users open `/` and are presented with all active Forest Dance rooms ticking in real-time.

Purpose: Satisfy the "上帝视角观战体验" requirement from SPEC.
Output: Nuxt 3 pages utilizing Tailwind CSS and WebSocket hooks.
</objective>

<context>
Load for context:
- server/api/rooms/index.get.ts
- server/utils/gameEngine.ts (to understand event structure)
</context>

<tasks>

<task type="auto">
  <name>Build Index Layout and Room Card</name>
  <files>
    pages/index.vue
    components/RoomCard.vue
  </files>
  <action>
    - Ensure `app.vue` has `<NuxtPage />`
    - Create `pages/index.vue`. Use `#0f172a` background. Fetch active rooms from `/api/rooms` on mount using `useFetch` to build initial state. Grid layout `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
    - Create `components/RoomCard.vue` accepting `room` object prop. Show Room Name, internal 15s/5s/3s state machine timer ticking down (using locally synced state or server events), and dynamically generated odds for this round.
    AVOID: Static HTML. Make it heavily cyberpunk (glow `#22d3ee` outlines, monospace fonts).
  </action>
  <verify>Navigating to `http://localhost:3000/` displays 6 mocked room cards.</verify>
  <done>UI correctly pulls internal API data.</done>
</task>

<task type="auto">
  <name>Hook Nuxt UI to Native WebSocket</name>
  <files>
    pages/index.vue
  </files>
  <action>
    - Add native `const ws = new WebSocket('ws://' + location.host + '/ws')` code to `onMounted`.
    - Add `ws.onmessage` handler to update the internal reactive Vue state (`rooms`) whenever the `ticker` event, `rolling` event, `payout` event is broadcasted.
    - Animate UI: When `rolling` or `finished`, show the animal/color on the card immediately based on WS result. Add a scrolling event log at the bottom.
  </action>
  <verify>WS connection established and cards flash when timers tick.</verify>
  <done>Fully interactive live multi-room dashboard operational.</done>
</task>

</tasks>

<verification>
- [ ] Tailwind styling makes the page feel like a casino control center
- [ ] WS pushes update Vue reactive variables
</verification>

<success_criteria>
- [ ] All tasks verified
</success_criteria>
