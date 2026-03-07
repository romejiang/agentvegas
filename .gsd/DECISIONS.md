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

## Phase 2 Decisions

**Date:** 2026-03-07

### Scope
- **多房间独立运行机制**：支持后台同时开启任意数量（如6个）的独立游戏房间。每个房间各自有独立的定时器（每隔几十秒一局）、独立状态流转（下注中、开奖中、空闲），并且每个房间独立的投注池，完全互不干扰。
- **底层玩法 (森林舞会)**：实现基础的 12 门动态赔率机制（狮子/熊猫/猴子/兔子 × 颜色 红/绿/黄）。特殊奖励玩法（如大三元、大四喜、霹雳闪电等）放到后续大版本迭代，第一版以验通多房间基础下注和资金流转为主。

### Approach
- **实时通信通信**: 采用 Nuxt 内置 `nitro` 全栈与 `@nuxtjs/websocket` (由于 Nitro 版本问题我们使用最新兼容方案) 等 WebSocket API。
- **观战大厅前端**: 引入 Tailwind CSS v4 用于构建赛博朋克深色外观，用多卡片平铺的方式展示各个房间的数据流、开奖动画记录与赔率明细。
- **内存核心引擎 (Singleton Ticker)**: 在 Nitro Server 环境下通过插件机制（Plugin）启动并维护各房间定时心跳（ticker），实现每一局到期自动算奖落库、并通过向对应频道派送 WebSocket Broadcast，杜绝任何人类操作。
