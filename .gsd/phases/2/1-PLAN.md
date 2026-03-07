---
phase: 2
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - nuxt.config.ts
  - app.vue
  - assets/css/main.css
  - server/models/GameRoom.ts
  - server/models/GameRecord.ts
autonomous: true

must_haves:
  truths:
    - Tailwind CSS v4 is initialized globally with a dark/cyberpunk base
    - GameRoom and GameRecord mongoose models exist
  artifacts:
    - assets/css/main.css exists
    - server/models/GameRoom.ts exists
    - server/models/GameRecord.ts exists
---

# Plan 2.1: Foundation - Tailwind & Database Models

<objective>
Setup the foundational frontend UI framework (Tailwind CSS v4) and the database schema for the game logic (Rooms & Records).

Purpose: Tailwind will power our spectator dashboard. GameRooms store permanent room configurations (names, instances), and GameRecords trace the rounds to ensure system integrity.
Output: Initialized Tailwind and two Mongoose schemas ready for the Nitro engine.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- server/models/Agent.ts
</context>

<tasks>

<task type="auto">
  <name>Install and Output Tailwind CSS v4</name>
  <files>
    package.json
    nuxt.config.ts
    assets/css/main.css
    app.vue
  </files>
  <action>
    Install `@nuxtjs/tailwindcss` as a dev dependency and add it to `nuxt.config.ts` modules.
    Create `assets/css/main.css` and put `@tailwind base; @tailwind components; @tailwind utilities;`
    Modify `app.vue` to import it (or rely on nuxt config css array).
    Set page background to dark gray `#0f172a` (slate-900) and text to white for cyberpunk base.
  </action>
  <verify>npm run dev boots successfully without Tailwind errors.</verify>
  <done>Tailwind utility classes can be applied in Vue.</done>
</task>

<task type="auto">
  <name>Create GameRoom and GameRecord schemas</name>
  <files>
    server/models/GameRoom.ts
    server/models/GameRecord.ts
  </files>
  <action>
    Create `server/models/GameRoom.ts`: holds `name` (String), `status` (String, default active), `description` (String). This helps memory engine know how many to boot.
    Create `server/models/GameRecord.ts`: holds `roomId` (ObjectId), `roundNumber` (Number), `startTime` (Date), `endTime` (Date), `winningAnimal` (String), `winningColor` (String), `oddsMap` (Object), `bets` (Array of { agentId, animal, color, amount }).
    AVOID: Complex relational queries. Document logic should be simple. Use `#nuxt/mongoose` defineMongooseModel.
  </action>
  <verify>Code imports correctly in dev mode.</verify>
  <done>Mongoose models export correctly.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Tailwind starts up without compilation errors
- [ ] GameRoom and GameRecord are discoverable by Nitro/Nuxt
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
