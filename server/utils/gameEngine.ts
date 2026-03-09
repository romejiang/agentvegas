import { GameRecord } from '../models/GameRecord'
import { Agent } from '../models/Agent'
import { AgentLog } from '../models/AgentLog'

type RoomStateEnum = 'betting' | 'rolling' | 'finished'

interface Bet {
    betId: string
    agentId: string
    animal: string
    color: string
    amount: number
}

export interface RoomState {
    roomId: string
    name: string
    status: RoomStateEnum
    timer: number
    roundNumber: number
    startTime: Date | null
    bets: Bet[]
    oddsMap: Record<string, number>
    winningAnimal: string | null
    winningColor: string | null
    interval: NodeJS.Timeout | null
}

const ANIMALS = ['狮子', '熊猫', '猴子', '兔子']
const COLORS = ['红', '绿', '黄']

export class GameEngine {
    public rooms: Map<string, RoomState> = new Map()

    // Broadcast event - will be implemented for real-time later
    public broadcast(roomId: string, event: any) { }

    // 硬编码偏移量，确保每个房间时间大幅错开且保持不变
    private readonly ROOM_OFFSETS = [0, 15, 30, 45, 12, 27, 42, 57];

    private getRoomOffset(index: number): number {
        return this.ROOM_OFFSETS[index % this.ROOM_OFFSETS.length] || 0;
    }

    public initialize(dbRooms: any[]) {
        dbRooms.forEach((r, index) => {
            const roomId = r._id.toString()
            if (!this.rooms.has(roomId)) {
                const offset = this.getRoomOffset(index)
                let status: RoomStateEnum = 'betting'
                let timer = 40
                let winningAnimal: string | null = null
                let winningColor: string | null = null

                if (offset < 40) {
                    status = 'betting'
                    timer = 40 - offset
                } else if (offset < 50) {
                    status = 'rolling'
                    timer = 50 - offset
                    winningAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)] as string
                    winningColor = COLORS[Math.floor(Math.random() * COLORS.length)] as string
                } else {
                    status = 'finished'
                    timer = 60 - offset
                    winningAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)] as string
                    winningColor = COLORS[Math.floor(Math.random() * COLORS.length)] as string
                }

                const state: RoomState = {
                    roomId,
                    name: r.name,
                    status,
                    timer,
                    roundNumber: 1,
                    startTime: new Date(Date.now() - offset * 1000),
                    bets: [],
                    oddsMap: this.generateOdds(),
                    winningAnimal,
                    winningColor,
                    interval: null
                }
                this.rooms.set(roomId, state)
                this.startRoomLoop(state)
            }
        })
    }

    private generateOdds() {
        const odds: Record<string, number> = {}
        const ranges: Record<string, [number, number]> = {
            '狮子': [35, 46],
            '熊猫': [15, 25],
            '猴子': [8, 14],
            '兔子': [4, 8]
        }
        for (const a of ANIMALS) {
            for (const c of COLORS) {
                const [min, max] = ranges[a] as [number, number];
                odds[`${a}_${c}`] = Math.floor(Math.random() * (max - min + 1)) + min
            }
        }
        return odds
    }

    private startRoomLoop(state: RoomState) {
        state.interval = setInterval(async () => {
            state.timer--
            if (state.timer <= 0) {
                await this.transitionState(state)
            }
            // Real-time broadcast hook
            this.broadcast(state.roomId, {
                type: 'tick',
                room: {
                    roomId: state.roomId,
                    name: state.name,
                    status: state.status,
                    timer: state.timer,
                    oddsMap: state.oddsMap,
                    winningAnimal: state.winningAnimal,
                    winningColor: state.winningColor
                }
            })
        }, 1000)
    }

    private async transitionState(state: RoomState) {
        if (state.status === 'betting') {
            state.status = 'rolling'
            state.timer = 10

            // Generate result randomly
            state.winningAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)] as string
            state.winningColor = COLORS[Math.floor(Math.random() * COLORS.length)] as string

            this.broadcast(state.roomId, { type: 'rolling', animal: state.winningAnimal, color: state.winningColor })
        } else if (state.status === 'rolling') {
            state.status = 'finished'
            state.timer = 10

            // Process Payouts
            await this.processPayouts(state)
        } else if (state.status === 'finished') {
            state.status = 'betting'
            state.timer = 40
            state.roundNumber++
            state.startTime = new Date()
            state.winningAnimal = null
            state.winningColor = null
            state.bets = []
            state.oddsMap = this.generateOdds()
        }
    }

    private async processPayouts(state: RoomState) {
        try {
            const winKey = `${state.winningAnimal}_${state.winningColor}`
            const odds = state.oddsMap[winKey] || 0

            // Loop bets and payout
            for (const bet of state.bets) {
                const isWin = bet.animal === state.winningAnimal && bet.color === state.winningColor
                let winAmount = 0
                let agent: any = null

                if (isWin) {
                    winAmount = bet.amount * odds
                    agent = await Agent.findByIdAndUpdate(bet.agentId, { $inc: { goldBalance: winAmount } }, { new: true })
                } else {
                    agent = await Agent.findById(bet.agentId)
                }

                if (agent) {
                    await AgentLog.create({
                        agentId: agent._id.toString(),
                        action: isWin ? 'game_win' : 'game_loss',
                        description: `Agent ${agent.name} ${isWin ? 'won ' + winAmount + ' gold (+' + winAmount + ' gold added to balance)' : 'lost ' + bet.amount + ' gold'} in ${state.name}. Bet: ${bet.color} ${bet.animal}. Result: ${state.winningColor} ${state.winningAnimal}.`,
                        details: {
                            betId: bet.betId,
                            roomId: state.roomId,
                            roomName: state.name,
                            betAnimal: bet.animal,
                            betColor: bet.color,
                            betAmount: bet.amount,
                            winningAnimal: state.winningAnimal,
                            winningColor: state.winningColor,
                            winAmount,
                            newBalance: agent.goldBalance
                        }
                    })
                }
            }

            // Save record to DB
            await GameRecord.create({
                roomId: state.roomId,
                roundNumber: state.roundNumber,
                startTime: state.startTime,
                endTime: new Date(),
                winningAnimal: state.winningAnimal,
                winningColor: state.winningColor,
                oddsMap: state.oddsMap,
                bets: state.bets
            })
        } catch (err) {
            console.error('Payout processing error:', err)
        }
    }

    public placeBet(roomId: string, betId: string, agentId: string, animal: string, color: string, amount: number) {
        const room = this.rooms.get(roomId)
        if (!room || room.status !== 'betting') throw new Error('Room not accepting bets')

        room.bets.push({ betId, agentId, animal, color, amount })
    }
}

export const gameEngine = new GameEngine()
