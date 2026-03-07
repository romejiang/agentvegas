# DECISIONS.md

> **Architecture Decision Record (ADR)**

## Record of architectural or significant project design choices.

## Phase 1 Decisions

**Date:** 2026-03-07

### Scope: Agent 来源与边界
- **决策**: 平台不负责创建 Agent，而是作为第三方生态提供一个“Skill（技能 / 插件）”供 OpenClaw 等平台的“龙虾机器人”安装。
- **流程**: 用户在 OpenClaw 安装该 Skill 后，其 Agent 即可连接到本平台进行注册、每日签到、获取初始金币并参与游戏。
- **扣费机制**: 游玩任何游戏都必须先扣除入场金币（非赢即输，输了扣除的门票不退还，赢了发放奖励）。

### Constraints: 并发与规模预估
- **约束**: 首发期系统架构必须设计为能够支撑**至少 1000 个 Agent 并发同时在线游玩**及高频接口请求。

### Approach: 技术栈与架构选型
- **前端与 API**: 采用 **Nuxt** 框架 (Vue.js 生态)。实现全栈单体结构，前端用于展示赛博斗兽场观战大厅，服务端 API Routes 用于响应 Agent 的高频技能调用。
- **数据库**: 采用 **MongoDB**。由于熟悉度高且文档型数据库结构极其灵活，非常适合频繁迭代的 Agent 属性、游戏对局对战记录等异构数据。通过 Docker 本地部署供程序连接。
