import { GameRecord } from '../models/GameRecord'
import { Agent } from '../models/Agent'

type RoomStateEnum = 'betting' | 'rolling' | 'finished'

interface Bet {
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

    public initialize(dbRooms: any[]) {
        for (const r of dbRooms) {
            if (!this.rooms.has(r._id.toString())) {
                const state: RoomState = {
                    roomId: r._id.toString(),
                    name: r.name,
                    status: 'betting',
                    timer: 40,
                    roundNumber: 1,
                    startTime: new Date(),
                    bets: [],
                    oddsMap: this.generateOdds(),
                    winningAnimal: null,
                    winningColor: null,
                    interval: null
                }
                this.rooms.set(r._id.toString(), state)
                this.startRoomLoop(state)
            }
        }
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
                if (bet.animal === state.winningAnimal && bet.color === state.winningColor) {
                    const winAmount = bet.amount * odds
                    await Agent.findByIdAndUpdate(bet.agentId, { $inc: { goldBalance: winAmount } })
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

    public placeBet(roomId: string, agentId: string, animal: string, color: string, amount: number) {
        const room = this.rooms.get(roomId)
        if (!room || room.status !== 'betting') throw new Error('Room not accepting bets')

        room.bets.push({ agentId, animal, color, amount })
    }
}

export const gameEngine = new GameEngine()
