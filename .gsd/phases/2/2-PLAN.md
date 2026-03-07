---
phase: 2
plan: 2
wave: 2
depends_on: [1]
files_modified:
  - server/utils/gameEngine.ts
  - server/plugins/engine.ts
autonomous: true

must_haves:
  truths:
    - Independent rooms logic executes simultaneously
    - State loops correctly transition: betting -> rolling -> payout
  artifacts:
    - server/utils/gameEngine.ts exists and maintains singleton memory state
---

# Plan 2.2: Memory Engine (Nitro Plugin)

<objective>
Build the core "Forest Dance" (森林舞会) independent game loop singleton that runs entirely in server memory natively in Nuxt Nitro.

Purpose: Agent Vegas must automatically control room state independently. No human sets the "start" button.
Output: A singleton class managing active rooms and a Nitro plugin starting it upon server boot.
</objective>

<context>
Load for context:
- .gsd/DECISIONS.md
- server/models/GameRoom.ts
- server/models/GameRecord.ts
</context>

<tasks>

<task type="auto">
  <name>Create Multi-Room Singleton Logic</name>
  <files>server/utils/gameEngine.ts</files>
  <action>
    Create `class GameEngine`. 
    - `rooms: Map<string, RoomState>`
    - Support lifecycle: 'betting' (15s) -> 'rolling' (5s) -> 'finished' (3s) -> loop.
    - Inside `betting`, accept bets (in memory).
    - Inside `rolling`, randomly pick 1 of 4 animals (狮子, 熊猫, 猴子, 兔子) and 1 of 3 colors (红, 绿, 黄). Pick from dynamically generated odds on round start.
    - At `finished`, process payouts to agents (using Agent DB model) and save to GameRecord DB.
    Export a globally instantiated `const engine = new GameEngine()`.
  </action>
  <verify>Unit test or console log tracking room loop.</verify>
  <done>Engine safely transitions room statuses constantly in memory.</done>
</task>

<task type="auto">
  <name>Nitro Plugin Bootstrapper</name>
  <files>server/plugins/engine.ts</files>
  <action>
    Create a Nitro plugin (`export default defineNitroPlugin`) that runs once.
    On boot, it finds or creates 6 default GameRooms in MongoDB (named "Room 1" to "Room 6").
    It injects them into the `engine.initialize(rooms)` to kickstart their parallel `setInterval` loops.
    AVOID: Async loops that pause the whole server block. Use isolated `setInterval` for each room.
  </action>
  <verify>`npm run dev` kicks off 6 intervals seen in server console logs constantly ticking.</verify>
  <done>Multi-room orchestration works unattended on server boot.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Booting server prints active room statuses
- [ ] Database automatically populated with 6 rooms
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
