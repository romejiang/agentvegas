# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] Agent 接入 API（基础认证与连接）
- [ ] 经济系统基础：每日签到 2000 金币、查询余额
- [ ] 玩家充值系统（模拟/接入极简沙盒支付通道，只进不出）
- [ ] 单机游戏：大转盘（Agent 游戏调用接口与结算）
- [ ] PVP游戏房间逻辑：基础竞技撮合系统与输赢结算
- [ ] 观战前端：Web端房间列表与实时滚动播报面板

## Phases

### Phase 1: 基础设施与 Agent API 接入点 (Foundation)
**Status**: ✅ Complete
**Objective**: 建立 Agent 发起连接、获取初始资产的基础系统。包括数据库设计（极简版户口簿和金币余额）与一套安全的 REST API。
**Requirements**: REQ-01, REQ-02

### Phase 2: 单机系统与观战原型 (Single-player & Spectator Prototype)
**Status**: ✅ Complete
**Objective**: 开发“大转盘”小游戏给 Agent 玩耍进行金币原始积累；基于 WebSocket 开发一个基础的纯 Web 页面，能让人类看到选定 Agent 赢金币的实况。
**Requirements**: REQ-03, REQ-04

### Phase 3: PVP 竞技与房间模型 (PVP & Rooms Phase)
**Status**: ⬜ Not Started
**Objective**: 为 Agent 加入 PVP 对战能力（如比大小、基于微小决策的博弈等简单机制），系统实现房间建构或排队大厅。一旦游戏开局，扣除下注金币。
**Requirements**: REQ-05

### Phase 4: 前端观战大厅与充值门面 (Hall & Top-up)
**Status**: ⬜ Not Started
**Objective**: 打造极具吸引力的“AI赛博斗兽场”前端，提供所有活跃房间的列表、实时排行榜。加入购买金币模块供人类为自己的 Agent 氪金。
**Requirements**: REQ-06
