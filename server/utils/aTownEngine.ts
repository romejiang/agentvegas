import { ATownRound } from '../models/ATownRound'
import { Agent } from '../models/Agent'
import { AgentLog } from '../models/AgentLog'

const QUEUE_SIZE = 20
const ENTRY_FEE = 100
const TOTAL_PRIZE = 2000
const CALCULATING_DURATION_MS = 10000

interface ATownEntry {
    agentId: string
    agentName: string
    number: number // 1-10
    betTime: Date
}

interface ATownRoundState {
    roundNumber: number
    status: 'waiting' | 'calculating' | 'resolved'
    startTime: Date
    entries: ATownEntry[]
    calculatingTimer: NodeJS.Timeout | null
}

class ATownEngine {
    private state: ATownRoundState = {
        roundNumber: 1,
        status: 'waiting',
        startTime: new Date(),
        entries: [],
        calculatingTimer: null,
    }

    /**
     * Initialize from DB on server start — resume or create new waiting round
     */
    public async initialize() {
        try {
            const latest = await ATownRound.findOne().sort({ roundNumber: -1 }) as any
            
            if (latest && latest.status !== 'resolved') {
                // Resume existing round
                this.state.roundNumber = latest.roundNumber
                this.state.status = latest.status as any
                this.state.startTime = latest.startTime
                this.state.entries = latest.entries.map((e: any) => ({
                    agentId: e.agentId.toString(),
                    agentName: e.agentName,
                    number: e.number,
                    betTime: e.betTime
                }))
                
                console.log(`✅ ATownEngine resumed round #${this.state.roundNumber} with ${this.state.entries.length} entries.`)
                
                if (this.state.status === 'calculating') {
                    // If it was calculating, just resolve it now to be safe
                    await this.resolveRound()
                } else if (this.state.entries.length >= QUEUE_SIZE) {
                    await this.startCalculating()
                }
            } else {
                // Start fresh new round
                const nextRoundNum = latest ? (latest.roundNumber as number) + 1 : 1
                await this.createNewRound(nextRoundNum)
            }
        } catch (e) {
            console.error('ATownEngine init error:', e)
        }
    }

    /**
     * Create a new round record in DB and set as current state
     */
    private async createNewRound(roundNumber: number) {
        const startTime = new Date()
        const newRound = await ATownRound.create({
            roundNumber,
            status: 'waiting',
            startTime,
            entries: []
        })

        this.state = {
            roundNumber,
            status: 'waiting',
            startTime,
            entries: [],
            calculatingTimer: null,
        }
        console.log(`✅ ATown Round #${roundNumber} created in DB and waiting for entries...`)
    }

    /**
     * Get current round info (for status API).
     */
    public getStatus() {
        const entries = this.state.entries
        const sum = entries.reduce((acc, e) => acc + e.number, 0)
        const avg = entries.length > 0 ? Math.round((sum / entries.length) * 10) / 10 : 0

        return {
            roundNumber: this.state.roundNumber,
            status: this.state.status,
            count: entries.length,
            total: QUEUE_SIZE,
            sumOfNumbers: sum,
            avgNumber: avg,
            entries: entries.map(e => ({
                agentName: e.agentName,
                betTime: e.betTime,
            })),
        }
    }

    /**
     * Submit a bet. Persists immediately to DB.
     */
    public async submitEntry(agentId: string, agentName: string, number: number): Promise<void> {
        if (this.state.status !== 'waiting') {
            throw new Error('Round is not accepting bets right now (calculating in progress)')
        }
        if (number < 1 || number > 10 || !Number.isInteger(number)) {
            throw new Error('Number must be an integer between 1 and 10')
        }
        // One entry per agent per round
        const alreadyEntered = this.state.entries.some(e => e.agentId === agentId)
        if (alreadyEntered) {
            throw new Error('You have already entered this round')
        }

        const entry: ATownEntry = { agentId, agentName, number, betTime: new Date() }
        
        // PERSIST IMMEDIATELY TO DB
        await ATownRound.findOneAndUpdate(
            { roundNumber: this.state.roundNumber, status: 'waiting' },
            { $push: { entries: entry } }
        )

        this.state.entries.push(entry)
        console.log(`📝 Bet persisted for ${agentName} in Round #${this.state.roundNumber}`)

        if (this.state.entries.length >= QUEUE_SIZE) {
            await this.startCalculating()
        }
    }

    /**
     * Transition to calculating state.
     */
    private async startCalculating() {
        this.state.status = 'calculating'
        
        // Update status in DB
        await ATownRound.findOneAndUpdate(
            { roundNumber: this.state.roundNumber },
            { status: 'calculating' }
        )

        console.log(`🎲 ATown Round #${this.state.roundNumber}: Calculating...`)

        this.state.calculatingTimer = setTimeout(async () => {
            await this.resolveRound()
        }, CALCULATING_DURATION_MS)
    }

    /**
     * Double Minority Algorithm (Unchanged)
     */
    public computeWinner(entries: ATownEntry[]) {
        const freq: Record<number, number> = {}
        for (let i = 1; i <= 10; i++) freq[i] = 0
        for (const e of entries) {
            freq[e.number] = (freq[e.number] || 0) + 1
        }

        const chosenNumbers = Object.entries(freq)
            .filter(([, count]) => count > 0)
            .map(([num, count]) => ({ num: parseInt(num), count }))

        if (chosenNumbers.length === 0) {
            // Should not happen if QUEUE_SIZE > 0
            return { winningNumber: 0, numberFrequency: freq, winReason: "No entries", winnerEntries: [] }
        }

        const minFreq = Math.min(...chosenNumbers.map(x => x.count))
        const candidates = chosenNumbers.filter(x => x.count === minFreq).sort((a, b) => a.num - b.num)
        const winner = candidates[0]!

        const numberFrequency: Record<string, number> = {}
        for (const [k, v] of Object.entries(freq)) {
            numberFrequency[k] = v
        }

        let winReason: string
        if (candidates.length === 1) {
            winReason = `Number ${winner.num} was chosen by the fewest agents (${winner.count} vote${winner.count !== 1 ? 's' : ''}, minimum frequency).`
        } else {
            const tiedNums = candidates.map(c => c.num).join(', ')
            winReason = `Numbers ${tiedNums} all tied at minimum frequency (${minFreq} vote${minFreq !== 1 ? 's' : ''} each). Number ${winner.num} wins as the smallest tied value.`
        }

        const winnerEntries = entries.filter(e => e.number === winner.num)
        return { winningNumber: winner.num, numberFrequency, winReason, winnerEntries }
    }

    /**
     * Run settlement and persist final results to current DB record.
     */
    private async resolveRound() {
        const round = this.state
        const entries = [...round.entries]

        const { winningNumber, numberFrequency, winReason, winnerEntries } = this.computeWinner(entries)

        const winners = winnerEntries.map(e => e.agentId)
        const prizePerWinner = winnerEntries.length > 0 ? Math.floor(TOTAL_PRIZE / winnerEntries.length) : 0

        console.log(`🏆 ATown Round #${round.roundNumber}: Winner number=${winningNumber}, ${winners.length} winner(s), prize=${prizePerWinner} each`)

        // Process payouts and logs
        for (const entry of entries) {
            const isWinner = winners.includes(entry.agentId)
            try {
                if (isWinner) {
                    const netGain = prizePerWinner - ENTRY_FEE
                    const agent = await Agent.findByIdAndUpdate(
                        entry.agentId,
                        { $inc: { goldBalance: prizePerWinner } },
                        { new: true }
                    ) as any

                    if (agent) {
                        await AgentLog.create({
                            agentId: entry.agentId,
                            action: 'game_win',
                            description: `Agent ${entry.agentName} won ${prizePerWinner} gold (+${prizePerWinner} gold added to balance) in A-Town Round ${round.roundNumber}. Result: Number ${winningNumber}.`,
                            details: {
                                roundNumber: round.roundNumber,
                                roomName: 'A-Town',
                                winningAnimal: winningNumber.toString(),
                                betAnimal: entry.number.toString(),
                                winAmount: prizePerWinner,
                                newBalance: agent.goldBalance,
                                winReason: winReason
                            }
                        })
                    }
                } else {
                    const agent = await Agent.findById(entry.agentId) as any
                    if (agent) {
                        await AgentLog.create({
                            agentId: entry.agentId,
                            action: 'atown_loss',
                            description: `Agent ${entry.agentName} lost ATown Round #${round.roundNumber}. Chose number ${entry.number}, winning number was ${winningNumber}.`,
                            details: {
                                roundNumber: round.roundNumber,
                                chosenNumber: entry.number,
                                winningNumber,
                                winReason,
                                entryFee: ENTRY_FEE,
                                newBalance: agent.goldBalance,
                            }
                        })
                    }
                }
            } catch (err) {
                console.error(`Payout error for agent ${entry.agentId}:`, err)
            }
        }

        // Update existing DB record with results
        try {
            await ATownRound.findOneAndUpdate(
                { roundNumber: round.roundNumber },
                {
                    status: 'resolved',
                    endTime: new Date(),
                    winningNumber,
                    winReason,
                    winners,
                    prizePerWinner,
                    numberFrequency,
                }
            )
        } catch (err) {
            console.error('ATown DB save error:', err)
        }

        // Start next round immediately in DB
        await this.createNewRound(round.roundNumber + 1)
    }
}

export const aTownEngine = new ATownEngine()

