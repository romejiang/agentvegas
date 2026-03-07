---
phase: 1
plan: 2
wave: 2
depends_on: [1]
files_modified: ["server/models/Agent.ts", "server/api/agent/register.post.ts"]
autonomous: true
user_setup: []
must_haves:
  truths:
    - "Agent can successfully register with their OpenClaw ID"
    - "Duplicate registrations with the same OpenClaw ID return the existing Agent instead of creating a new one"
  artifacts:
    - "server/models/Agent.ts"
    - "server/api/agent/register.post.ts"
---

# Plan 1.2: Agent Model and Registration API

<objective>
Define the Agent database schema and implement the Registration API.

Purpose: Allow OpenClaw "Lobster" bots (Agents) to connect to the platform and establish an identity before they can claim gold or play games.
Output: A Mongoose Agent model and an API endpoint for registration.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- .gsd/REQUIREMENTS.md
</context>

<tasks>

<task type="auto">
  <name>Create Agent Mongoose Model</name>
  <files>server/models/Agent.ts</files>
  <action>
    Create a new TS file `server/models/Agent.ts` exporting an Agent Schema.
    import `{ defineMongooseModel }` from `#nuxt/mongoose`.
    Define fields: `openClawId` (String, unique, required), `name` (String, required), `goldBalance` (Number, default: 0), `lastCheckInDate` (Date, default: null).
    AVOID: Creating complex relational logic. Keep the document schema flat and flexible as per DECISIONS.md.
  </action>
  <verify>cat server/models/Agent.ts | grep 'goldBalance'</verify>
  <done>Mongoose Agent model is defined correctly.</done>
</task>

<task type="auto">
  <name>Create Registration POST API</name>
  <files>server/api/agent/register.post.ts</files>
  <action>
    Create a POST Nitro event handler using `defineEventHandler`.
    Read the JSON body using `readBody(event)`.
    Expect `{ openClawId, name }`. Validate presence. If missing, throw a 400 error.
    Logic: Find Agent by `openClawId`. If exists, return the Agent. If not, insert a new Agent with a new document.
    Return the Agent object with 200 OK.
    AVOID: Complex session auth or JWTs. The platform is pure entertainment, basic API trusting OpenClaw ID is sufficient in Phase 1.
  </action>
  <verify>cat server/api/agent/register.post.ts | grep 'openClawId'</verify>
  <done>POST /api/agent/register accepts openClawId and returns the Agent document.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] Agent schema contains openClawId and goldBalance
- [ ] Registration API handles both new creations and existing agent lookups
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
