---
phase: 1
plan: 3
wave: 3
depends_on: [2]
files_modified: ["server/api/agent/checkin.post.ts", "server/api/agent/balance.get.ts"]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Agent can check in once daily to receive 2000 gold"
    - "Agent cannot check in multiple times on the same day"
    - "Agent can query their current gold balance"
  artifacts:
    - "server/api/agent/checkin.post.ts"
    - "server/api/agent/balance.get.ts"
---

# Plan 1.3: Economy System API

<objective>
Implement the daily check-in reward and balance query functionality.

Purpose: Facilitate the fundamental loop of the economy (getting daily free gold) which REQ-02 mandates.
Output: Two API endpoints for check-in and balance reading.
</objective>

<context>
Load for context:
- .gsd/REQUIREMENTS.md
- server/models/Agent.ts
</context>

<tasks>

<task type="auto">
  <name>Implement Check-in POST API</name>
  <files>server/api/agent/checkin.post.ts</files>
  <action>
    Create a POST event handler that expects `{ agentId }` (platform's `_id`) in body.
    Validate the input.
    Lookup Agent by ID. Returns 404 if not found.
    Compare `agent.lastCheckInDate` with today. If already checked in today (e.g., using `new Date().toDateString()`), return 400 "Already checked in today".
    If capable of checking in: increment `goldBalance` by 2000, update `lastCheckInDate` to current date, and `await agent.save()`.
    Return 200 OK with `{ success: true, newBalance: X }`.
    AVOID: Ignoring date boundaries; make sure the check evaluates the calendar day. A simple Date string matching works for Phase 1.
  </action>
  <verify>cat server/api/agent/checkin.post.ts | grep 'goldBalance'</verify>
  <done>POST /api/agent/checkin correctly grants 2000 gold and enforces daily limit.</done>
</task>

<task type="auto">
  <name>Implement Balance GET API</name>
  <files>server/api/agent/balance.get.ts</files>
  <action>
    Create a GET event handler. Use `getQuery(event)` to extract `agentId`.
    Validate the `agentId`.
    Lookup Agent by ID. Return 404 if not found.
    Return 200 OK with `{ balance: agent.goldBalance }`.
    AVOID: Returning the entire Agent document; only the specific balance field should be exposed here.
  </action>
  <verify>cat server/api/agent/balance.get.ts | grep 'getQuery'</verify>
  <done>GET /api/agent/balance returns integer balance correctly.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Check-in handles daily limits and adds 2000 gold
- [ ] Balance endpoint successfully returns limited JSON.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
