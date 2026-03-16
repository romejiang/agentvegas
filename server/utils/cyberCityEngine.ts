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
                        name: `赛博房间 ${i}`,
                        status: 'waiting',
                        stake: 100,
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
            }
            console.log(`CyberCityEngine initialized with ${rooms.length} rooms`)
        } catch (e) {
            console.error('CyberCityEngine init error:', e)
        }
    }

    async getRoomsStatus() {
        const rooms = await CyberCityRoom.find().sort({ roomId: 1 })
        const roomsArray = []

        for (const room of rooms) {
            this.rooms.set(room.roomId as number, room)

            const currentBattle = room.currentBattle as any
            const battleInfo = currentBattle ? {
                battleId: currentBattle.battleId,
                startTime: currentBattle.startTime,
                playerCount: currentBattle.players?.length || 0,
                players: room.status === 'finished'
                    ? (currentBattle.players || []).map((p: any) => ({
                        agentName: p.agentName,
                        allocation: p.allocation,
                    }))
                    : (currentBattle.players || []).map((p: any) => ({
                        agentName: p.agentName,
                        allocation: null,
                    })),
                winner: currentBattle.winnerName,
                winReason: currentBattle.winReason,
                positionResults: room.status === 'finished' ? currentBattle.positionResults : null,
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
        const battleInfo = currentBattle ? {
            battleId: currentBattle.battleId,
            startTime: currentBattle.startTime,
            endTime: currentBattle.endTime,
            players: currentBattle.players || [],
            winner: currentBattle.winner,
            winnerName: currentBattle.winnerName,
            winReason: currentBattle.winReason,
            positionResults: room.status === 'finished' ? currentBattle.positionResults : null,
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
    ): Promise<{ message: string; battleStarted?: boolean }> {
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

        if (room.status === 'battling') {
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

        const agent = await Agent.findById(agentId) as any
        if (!agent) throw new Error('Agent not found')
        if (agent.goldBalance < stake) {
            throw new Error(`Insufficient gold balance. Required: ${stake}`)
        }

        if (!currentBattle) {
            room.stake = stake
        }

        const player = {
            agentId,
            agentName,
            allocation,
            joinTime: new Date(),
        }

        if (!currentBattle || !currentBattle.players) {
            room.currentBattle = {
                battleId: crypto.randomUUID(),
                startTime: new Date(),
                endTime: null,
                players: [player],
                winner: null,
                winnerName: null,
                winReason: null,
                positionResults: null,
            }
            room.status = 'waiting'

            agent.goldBalance -= stake
            await agent.save()

            await room.save()
            this.rooms.set(roomId, room)

            await AgentLog.create({
                agentId,
                action: 'cybercity_join',
                description: `Agent ${agentName} joined Cyber City Room ${roomId} with stake ${stake}. Waiting for opponent...`,
                details: { roomId, battleId: (room.currentBattle as any).battleId, stake, allocation },
            })

            return { message: 'Joined battle. Waiting for opponent...', battleStarted: false }
        } else {
            const currentPlayers = currentBattle.players || []
            if (currentPlayers.length >= 2) {
                throw new Error('Room is full')
            }

            agent.goldBalance -= stake
            await agent.save()

            currentPlayers.push(player)
            currentBattle.players = currentPlayers
            room.status = 'battling'

            await room.save()
            this.rooms.set(roomId, room)

            await AgentLog.create({
                agentId,
                action: 'cybercity_join',
                description: `Agent ${agentName} joined Cyber City Room ${roomId} battle. Battle starting...`,
                details: { roomId, battleId: currentBattle.battleId, stake, allocation },
            })

            setTimeout(() => this.resolveBattle(roomId), 3000)

            return { message: 'Battle started!', battleStarted: true }
        }
    }

    private async resolveBattle(roomId: number) {
        try {
            const room = await CyberCityRoom.findOne({ roomId })
            if (!room || !room.currentBattle) return

            const currentBattle = room.currentBattle as any
            if (currentBattle.players.length < 2) return

            const player1 = currentBattle.players[0]
            const player2 = currentBattle.players[1]

            const result = this.computeBattleResult(player1, player2)

            currentBattle.winner = result.winner
            currentBattle.winnerName = result.winnerName
            currentBattle.winReason = result.winReason
            currentBattle.positionResults = result.positionResults
            currentBattle.endTime = new Date()
            room.status = 'finished'

            const totalPool = (room.stake as number) * 2
            if (result.winner) {
                const winnerAgent = await Agent.findById(result.winner) as any
                if (winnerAgent) {
                    winnerAgent.goldBalance += totalPool
                    await winnerAgent.save()

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

            const loserId = result.winner === player1.agentId.toString()
                ? player2.agentId.toString()
                : player1.agentId.toString()
            const loserName = result.winner === player1.agentId.toString()
                ? player2.agentName
                : player1.agentName
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

            const historyEntry = {
                battleId: currentBattle.battleId,
                startTime: currentBattle.startTime,
                endTime: currentBattle.endTime,
                stake: room.stake,
                totalPrize: (room.stake as number) * 2,
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

            const history = room.history as any[]
            history.push(historyEntry)

            if (history.length > 20) {
                room.history = history.slice(-20)
            }

            await room.save()
            this.rooms.set(roomId, room)

            console.log(`Cyber City Room ${roomId} battle resolved. Winner: ${result.winnerName || 'Draw'}`)

            setTimeout(() => this.resetRoom(roomId), 30000)
        } catch (e) {
            console.error(`Error resolving Cyber City battle in room ${roomId}:`, e)
        }
    }

    private computeBattleResult(player1: Player, player2: Player): BattleResult {
        const p1Wins: string[] = []
        const p2Wins: string[] = []

        const positions = [
            { key: 'positionA', name: '高能数据中心' },
            { key: 'positionB', name: '霓虹交易街区' },
            { key: 'positionC', name: '轨道信息基站' },
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
