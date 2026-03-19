import { CyberCityRoom } from '../models/CyberCityRoom'
import { Agent } from '../models/Agent'
import { AgentLog } from '../models/AgentLog'
import crypto from 'crypto'

const VALID_STAKES = [100, 300, 500, 800, 1000, 3000, 5000, 8000, 10000]

interface Allocation {
    positionA: number
    positionB: number
    positionC: number
}

interface Player {
    agentId: string
    agentName: string
    allocation: Allocation
    joinTime: Date
}

interface PositionResult {
    winner: string | null
    winnerName: string | null
    attackerAmount: number
    defenderAmount: number
}

interface BattleResult {
    battleId: string
    winner: string | null
    winnerName: string | null
    winReason: string
    positionResults: {
        positionA: PositionResult
        positionB: PositionResult
        positionC: PositionResult
    }
    player1: Player
    player2: Player
}

class CyberCityEngine {
    rooms: Map<number, any> = new Map()

    async initialize() {
        try {
            const existingRooms = await CyberCityRoom.find().sort({ roomId: 1 })

            if (existingRooms.length === 0) {
                const defaultRooms = []
                for (let i = 1; i <= 6; i++) {
                    defaultRooms.push({
                        roomId: i,
                        name: `Room ${i}`,
                        status: 'waiting',
                        stake: null,
                        currentBattle: null,
                        history: [],
                    })
                }
                await CyberCityRoom.insertMany(defaultRooms)
                console.log('Created 6 Cyber City rooms')
            }

            const rooms = await CyberCityRoom.find().sort({ roomId: 1 })
            for (const room of rooms) {
                this.rooms.set(room.roomId as number, room)
                
                // 恢复机制：如果启动时发现有房间处于 battling 状态，则触发结算
                if (room.status === 'battling') {
                    console.log(`[CyberCity] Room ${room.roomId} found in 'battling' state during initialization. Triggering resolution...`)
                    this.resolveBattle(room.roomId as number)
                }
            }
            console.log(`CyberCityEngine initialized with ${rooms.length} rooms`)
        } catch (e) {
            console.error('CyberCityEngine init error:', e)
        }
    }

    async getRoomsStatus() {
        const rooms = await CyberCityRoom.find()
            .sort({ roomId: 1 })
            .select('roomId name status stake currentBattle')
            .lean()
        const roomsArray = []

        for (const room of rooms) {
            this.rooms.set(room.roomId as number, room)

            const currentBattle = room.currentBattle as any
            const battleInfo = currentBattle?.battleId ? {
                battleId: currentBattle.battleId,
                startTime: currentBattle.startTime,
                playerCount: currentBattle.players?.length || 0,
                players: (currentBattle.players || []).slice(0, 1).map((p: any) => ({
                    agentName: p.agentName,
                })),
            } : null

            roomsArray.push({
                roomId: room.roomId,
                name: room.name,
                status: room.status,
                stake: room.stake,
                currentBattle: battleInfo,
            })
        }

        return { rooms: roomsArray }
    }

    async getRoomStatus(roomId: number) {
        const room = await CyberCityRoom.findOne({ roomId })
        if (!room) throw new Error('Room not found')

        this.rooms.set(roomId, room)

        const currentBattle = room.currentBattle as any
        // Mongoose 嵌套对象即使 DB 里为 null，读出来也是空对象 {}，必须用 battleId 判断真实状态
        const isFinished = room.status === 'finished'
        const battleInfo = currentBattle?.battleId ? {
            battleId: currentBattle.battleId,
            startTime: currentBattle.startTime,
            endTime: currentBattle.endTime,
            // 未结束时隐藏 allocation，防止第二个玩家看到对手策略
            players: (currentBattle.players || []).map((p: any) => ({
                agentId: p.agentId,
                agentName: p.agentName,
                joinTime: p.joinTime,
                allocation: isFinished ? p.allocation : null,
            })),
            winner: currentBattle.winner,
            winnerName: currentBattle.winnerName,
            winReason: currentBattle.winReason,
            positionResults: isFinished ? currentBattle.positionResults : null,
            totalPrize: (room.stake as number) * 2,
        } : null

        return {
            roomId: room.roomId,
            name: room.name,
            status: room.status,
            stake: room.stake,
            currentBattle: battleInfo,
            history: (room.history as any[]).slice(-10),
        }
    }

    async joinBattle(
        roomId: number,
        agentId: string,
        agentName: string,
        stake: number,
        allocation: Allocation
    ): Promise<{
        message: string
        battleStarted: boolean
        battleId: string
        roomId: number
        lockedStake?: number
        result?: {
            winnerName: string | null
            winReason: string | null
            positionResults: any
            prize: number
        } | null
    }> {
        if (!VALID_STAKES.includes(stake)) {
            throw new Error(`Invalid stake. Must be one of: ${VALID_STAKES.join(', ')}`)
        }

        const total = allocation.positionA + allocation.positionB + allocation.positionC
        if (total !== 100) {
            throw new Error(`Allocation must sum to 100. Current sum: ${total}`)
        }
        if (allocation.positionA < 0 || allocation.positionB < 0 || allocation.positionC < 0) {
            throw new Error('Allocation values must be non-negative')
        }

        const room = await CyberCityRoom.findOne({ roomId })
        if (!room) throw new Error('Room not found')

        // 增加过时保护：如果房间处于 battling 状态超过 1 分钟，则强制触发一次结算并抛错
        if (room.status === 'battling') {
            const currentBattle = room.currentBattle as any
            if (currentBattle?.startTime) {
                const startTime = new Date(currentBattle.startTime).getTime()
                const now = Date.now()
                if (now - startTime > 60000) {
                    console.log(`[CyberCity] Room ${roomId} stuck in 'battling' for >60s. Forcing resolution...`)
                    this.resolveBattle(roomId)
                }
            }
            throw new Error('Room is currently in battle. Please wait or choose another room.')
        }

        if (room.status === 'finished') {
            await this.resetRoom(roomId)
        }

        const currentBattle = room.currentBattle as any
        console.log('DEBUG: currentBattle =', currentBattle)
        console.log('DEBUG: typeof currentBattle =', typeof currentBattle)
        console.log('DEBUG: !currentBattle =', !currentBattle)
        const players = currentBattle?.players || []
        if (players.some((p: any) => p.agentId?.toString() === agentId)) {
            throw new Error('You have already joined this battle')
        }

        // 尝试使用 $inc 原子性扣除金币
        const agentUpdate = await Agent.findOneAndUpdate(
            { _id: agentId, goldBalance: { $gte: stake } },
            { $inc: { goldBalance: -stake } },
            { new: true }
        ) as any
        if (!agentUpdate) {
            throw new Error(`Insufficient gold balance or agent not found. Required: ${stake}`)
        }

        const player = {
            agentId,
            agentName,
            allocation,
            joinTime: new Date(),
        }

        if (!currentBattle?.battleId) {
            // 第一个玩家：原子化创建战场
            const updatedRoom = await CyberCityRoom.findOneAndUpdate(
                { roomId, 'currentBattle.battleId': null },
                {
                    stake,
                    status: 'waiting',
                    currentBattle: {
                        battleId: crypto.randomUUID(),
                        startTime: new Date(),
                        endTime: null,
                        players: [player],
                        winner: null,
                        winnerName: null,
                        winReason: null,
                        positionResults: null,
                    }
                },
                { new: true }
            )

            if (!updatedRoom) {
                // 如果创建失败（比如被抢先了），退还金币
                await Agent.findByIdAndUpdate(agentId, { $inc: { goldBalance: stake } })
                throw new Error('Failed to create battle. Please try again.')
            }

            this.rooms.set(roomId, updatedRoom)

            await AgentLog.create({
                agentId,
                action: 'cybercity_join',
                description: `Agent ${agentName} joined Cyber City Room ${roomId} with stake ${stake}. Waiting for opponent...`,
                details: { roomId, battleId: (updatedRoom.currentBattle as any).battleId, stake, allocation },
            })

            return {
                message: 'Joined battle. Waiting for opponent...',
                battleStarted: false,
                battleId: (updatedRoom.currentBattle as any).battleId,
                roomId,
                lockedStake: stake,
            }
        } else {
            // 第二个玩家：必须与第一个玩家投注金额完全一致
            const lockedStake = room.stake as number
            if (stake !== lockedStake) {
                // 投注冲突，退还金币
                await Agent.findByIdAndUpdate(agentId, { $inc: { goldBalance: stake } })
                throw new Error(`Stake mismatch. This room's stake is locked at ${lockedStake} gold. Your bet: ${stake}`)
            }

            // 原子化加入战场
            const updatedRoom = await CyberCityRoom.findOneAndUpdate(
                { 
                    roomId, 
                    status: 'waiting', 
                    'currentBattle.players': { $size: 1 },
                    'currentBattle.players.agentId': { $ne: agentId } 
                },
                { 
                    $push: { 'currentBattle.players': player },
                    $set: { status: 'battling' }
                },
                { new: true }
            )

            if (!updatedRoom) {
                // 加入失败（房间可能已满），退还金币
                await Agent.findByIdAndUpdate(agentId, { $inc: { goldBalance: stake } })
                throw new Error('Room is full or battle already started.')
            }

            this.rooms.set(roomId, updatedRoom)

            await AgentLog.create({
                agentId,
                action: 'cybercity_join',
                description: `Agent ${agentName} joined Cyber City Room ${roomId} battle. Battle starting...`,
                details: { roomId, battleId: (updatedRoom.currentBattle as any).battleId, stake, allocation },
            })

            // 同步触发结算并等待结果返回，确保 join 请求能拿到实时结果
            console.log(`[CyberCity] Triggering resolveBattle for room ${roomId} (BattleID: ${(updatedRoom.currentBattle as any).battleId})`)
            await this.resolveBattle(roomId)

            // 从数据库读取最新结果
            const finalRoom = await CyberCityRoom.findOne({ roomId }) as any
            const resolvedBattle = finalRoom?.currentBattle as any
            const historyBattle = finalRoom?.history?.find((h: any) => h.battleId === (updatedRoom.currentBattle as any).battleId)

            const resultSource = (resolvedBattle?.battleId === (updatedRoom.currentBattle as any).battleId && finalRoom?.status === 'finished')
                ? resolvedBattle
                : historyBattle

            if (!resultSource) {
                console.warn(`[CyberCity] Battle result not found in DB after resolution for room ${roomId}`)
            }

            return {
                message: 'Battle started!',
                battleStarted: true,
                battleId: (updatedRoom.currentBattle as any).battleId,
                roomId,
                result: resultSource ? {
                    winnerName: resultSource.winnerName || null,
                    winReason: resultSource.winReason || null,
                    positionResults: resultSource.positionResults || null,
                    prize: (stake as number) * 2,
                } : null,
            }
        }
    }

    private async resolveBattle(roomId: number) {
        console.log(`[CyberCity] Resolving battle for room ${roomId}...`)
        try {
            // 采用原子操作防止多实例重复结算
            // 先锁定状态，将 status 从 'battling' 更改为 'finished'
            const room = await CyberCityRoom.findOneAndUpdate(
                { roomId, status: 'battling' },
                { status: 'finished' },
                { new: true }
            )
            
            if (!room) {
                console.log(`[CyberCity] Room ${roomId} not in 'battling' state or already resolved. Skipping.`)
                return
            }

            if (!room.currentBattle || !(room.currentBattle as any).battleId) {
                console.warn(`[CyberCity] Room ${roomId} found in 'battling' but currentBattle is missing. Resetting to waiting.`)
                await CyberCityRoom.updateOne({ roomId }, { status: 'waiting', currentBattle: null })
                return
            }

            const currentBattle = room.currentBattle as any
            if (currentBattle.players.length < 2) {
                console.warn(`[CyberCity] Room ${roomId} has only ${currentBattle.players.length} players. Resetting to waiting.`)
                await CyberCityRoom.updateOne({ roomId }, { status: 'waiting' })
                return
            }

            const player1 = currentBattle.players[0]
            const player2 = currentBattle.players[1]
            console.log(`[CyberCity] Battle players: ${player1.agentName} vs ${player2.agentName}`)

            const result = this.computeBattleResult(player1, player2)
            console.log(`[CyberCity] Battle result computed: ${result.winnerName || 'Draw'}`)

            // 更新比赛结果到当前房间对象中
            const updateResult = await CyberCityRoom.updateOne(
                { roomId, 'currentBattle.battleId': currentBattle.battleId },
                {
                    'currentBattle.winner': result.winner,
                    'currentBattle.winnerName': result.winnerName,
                    'currentBattle.winReason': result.winReason,
                    'currentBattle.positionResults': result.positionResults,
                    'currentBattle.endTime': new Date(),
                }
            )
            console.log(`[CyberCity] DB Update currentBattle: ${updateResult.modifiedCount > 0 ? 'Success' : 'Failed/NoChange'}`)

            // 计算总奖池
            const totalPool = (room.stake as number) * 2
            
            // 处理赢家派奖
            if (result.winner) {
                console.log(`[CyberCity] Payout winner: ${result.winnerName} (+${totalPool} gold)`)
                // 使用 $inc 原子性增加金币
                const winnerAgent = await Agent.findByIdAndUpdate(
                    result.winner,
                    { $inc: { goldBalance: totalPool } },
                    { new: true }
                ) as any
                
                if (winnerAgent) {
                    await AgentLog.create({
                        agentId: result.winner,
                        action: 'cybercity_win',
                        description: `Agent ${result.winnerName} won Cyber City Room ${roomId} battle! Prize: ${totalPool} gold (+${totalPool} added to balance). ${result.winReason}`,
                        details: {
                            roomId,
                            battleId: currentBattle.battleId,
                            winAmount: totalPool,
                            newBalance: winnerAgent.goldBalance,
                            positionResults: result.positionResults,
                        },
                    })
                }
            }

            // 处理输家（或平局时的相关记录）
            const loserId = result.winner === player1.agentId.toString()
                ? player2.agentId.toString()
                : player1.agentId.toString()
            const loserName = result.winner === player1.agentId.toString()
                ? player2.agentName
                : player1.agentName
            
            console.log(`[CyberCity] Processing log for loser: ${loserName}`)
            const loserAgent = await Agent.findById(loserId) as any
            if (loserAgent) {
                await AgentLog.create({
                    agentId: loserId,
                    action: 'cybercity_loss',
                    description: `Agent ${loserName} lost Cyber City Room ${roomId} battle. Stake lost: ${room.stake}.`,
                    details: {
                        roomId,
                        battleId: currentBattle.battleId,
                        stakeLost: room.stake,
                        newBalance: loserAgent.goldBalance,
                    },
                })
            }

            // 构造历史记录并存入房间历史
            const historyEntry = {
                battleId: currentBattle.battleId,
                startTime: currentBattle.startTime,
                endTime: new Date(),
                stake: room.stake,
                totalPrize: totalPool,
                player1: {
                    agentId: player1.agentId,
                    agentName: player1.agentName,
                    allocation: player1.allocation,
                },
                player2: {
                    agentId: player2.agentId,
                    agentName: player2.agentName,
                    allocation: player2.allocation,
                },
                winner: result.winner,
                winnerName: result.winnerName,
                winReason: result.winReason,
                positionResults: result.positionResults,
            }

            const historyUpdate = await CyberCityRoom.updateOne(
                { roomId },
                { 
                    $push: { 
                        history: { 
                            $each: [historyEntry], 
                            $slice: -20 
                        } 
                    } 
                }
            )
            console.log(`[CyberCity] DB Update history: ${historyUpdate.modifiedCount > 0 ? 'Success' : 'Failed'}`)

            console.log(`[CyberCity] Room ${roomId} battle resolution complete.`)

            // 30秒后重置房间为可加入状态
            setTimeout(() => {
                console.log(`[CyberCity] Resetting Room ${roomId} (30s timeout elapsed)...`)
                this.resetRoom(roomId)
            }, 30000)
        } catch (e) {
            console.error(`[CyberCity] Critical error resolving battle in room ${roomId}:`, e)
        }
    }

    private computeBattleResult(player1: Player, player2: Player): BattleResult {
        const p1Wins: string[] = []
        const p2Wins: string[] = []

        const positions = [
            { key: 'positionA', name: 'Panda Guard' },
            { key: 'positionB', name: 'Monkey Agent' },
            { key: 'positionC', name: 'Cyber Rabbit' },
        ]

        const positionResults: any = {}

        for (const pos of positions) {
            const p1Amount = player1.allocation[pos.key as keyof Allocation]
            const p2Amount = player2.allocation[pos.key as keyof Allocation]

            if (p1Amount > p2Amount) {
                p1Wins.push(pos.name)
                positionResults[pos.key] = {
                    winner: player1.agentId.toString(),
                    winnerName: player1.agentName,
                    attackerAmount: p1Amount,
                    defenderAmount: p2Amount,
                }
            } else if (p2Amount > p1Amount) {
                p2Wins.push(pos.name)
                positionResults[pos.key] = {
                    winner: player2.agentId.toString(),
                    winnerName: player2.agentName,
                    attackerAmount: p2Amount,
                    defenderAmount: p1Amount,
                }
            } else {
                positionResults[pos.key] = {
                    winner: null,
                    winnerName: null,
                    attackerAmount: p1Amount,
                    defenderAmount: p2Amount,
                }
            }
        }

        let winner: string | null = null
        let winnerName: string | null = null
        let winReason: string

        if (p1Wins.length >= 2) {
            winner = player1.agentId.toString()
            winnerName = player1.agentName
            winReason = `${player1.agentName} wins by capturing ${p1Wins.length} positions (${p1Wins.join(', ')})`
        } else if (p2Wins.length >= 2) {
            winner = player2.agentId.toString()
            winnerName = player2.agentName
            winReason = `${player2.agentName} wins by capturing ${p2Wins.length} positions (${p2Wins.join(', ')})`
        } else if (p1Wins.length === p2Wins.length) {
            const p1Total = player1.allocation.positionA + player1.allocation.positionB + player1.allocation.positionC
            const p2Total = player2.allocation.positionA + player2.allocation.positionB + player2.allocation.positionC

            if (p1Total > p2Total) {
                winner = player1.agentId.toString()
                winnerName = player1.agentName
                winReason = `${player1.agentName} wins tie-breaker by total troop commitment (${p1Total} vs ${p2Total})`
            } else if (p2Total > p1Total) {
                winner = player2.agentId.toString()
                winnerName = player2.agentName
                winReason = `${player2.agentName} wins tie-breaker by total troop commitment (${p2Total} vs ${p1Total})`
            } else {
                winReason = 'Battle ends in a perfect tie! Both agents receive their stakes back.'
            }
        } else {
            winReason = 'Battle result unclear'
        }

        return {
            battleId: crypto.randomUUID(),
            winner,
            winnerName,
            winReason,
            positionResults,
            player1,
            player2,
        }
    }

    private async resetRoom(roomId: number) {
        try {
            const room = await CyberCityRoom.findOneAndUpdate(
                { roomId },
                {
                    status: 'waiting',
                    currentBattle: null,
                    stake: null,  // 重置后无人状态，stake 清空
                },
                { new: true }
            )
            if (room) {
                this.rooms.set(roomId, room)
                console.log(`Cyber City Room ${roomId} reset to waiting state`)
            }
        } catch (e) {
            console.error(`Error resetting Cyber City room ${roomId}:`, e)
        }
    }

    async getRoomHistory(roomId: number, limit: number = 20) {
        const room = await CyberCityRoom.findOne({ roomId })
        if (!room) throw new Error('Room not found')

        return {
            roomId: room.roomId,
            name: room.name,
            history: (room.history as any[]).slice(-limit),
        }
    }
}

export const cyberCityEngine = new CyberCityEngine()
