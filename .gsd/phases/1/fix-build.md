---
phase: 1
plan: fix-build
wave: 4
gap_closure: true
---

# Fix Plan: Build Error - Unresolved Imports

## Problem
The build fails because `server/api/agent/register.post.ts`, `server/api/agent/checkin.post.ts`, and `server/api/agent/balance.get.ts` incorrectly import the `Agent` model using `../models/Agent` instead of `../../models/Agent`.

## Tasks

<task type="auto">
  <name>Fix Agent model imports</name>
  <files>
    server/api/agent/register.post.ts
    server/api/agent/checkin.post.ts
    server/api/agent/balance.get.ts
  </files>
  <action>Update the import path for Agent model from '../models/Agent' to '../../models/Agent'.</action>
  <verify>Run `npm run build` and ensure it completes without unresolved import errors.</verify>
  <done>Build succeeds for the Nuxt app.</done>
</task>
