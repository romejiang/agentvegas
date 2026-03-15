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
     * Initialize from DB on server start — find the latest round number
     */
    public async initialize() {
        try {
            const latest = await ATownRound.findOne().sort({ roundNumber: -1 }).lean() as any
            this.state.roundNumber = latest ? (latest.roundNumber as number) + 1 : 1
            this.state.status = 'waiting'
            this.state.startTime = new Date()
            this.state.entries = []
            console.log(`✅ ATownEngine initialized. Starting at round #${this.state.roundNumber}`)
        } catch (e) {
            console.error('ATownEngine init error:', e)
        }
    }

    /**
     * Get current round info (for status API).
     * Numbers are hidden — only sum and average exposed.
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
            // Only expose agent name and bet time, NOT the number
            entries: entries.map(e => ({
                agentName: e.agentName,
                betTime: e.betTime,
            })),
        }
    }

    /**
     * Submit a bet. Returns error string or null on success.
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
        this.state.entries.push(entry)

        if (this.state.entries.length >= QUEUE_SIZE) {
            await this.startCalculating()
        }
    }

    /**
     * Transition to calculating state, then resolve after 10 seconds.
     */
    private async startCalculating() {
        this.state.status = 'calculating'
        console.log(`🎲 ATown Round #${this.state.roundNumber}: Calculating...`)

        // Resolve after CALCULATING_DURATION_MS
        this.state.calculatingTimer = setTimeout(async () => {
            await this.resolveRound()
        }, CALCULATING_DURATION_MS)
    }

    /**
     * Double Minority Algorithm:
     * 1. Count frequency of each number
     * 2. Find the minimum frequency
     * 3. Among all numbers with min frequency, pick the smallest value
     * Returns { winningNumber, frequency map, reason string }
     */
    public computeWinner(entries: ATownEntry[]): {
        winningNumber: number,
        numberFrequency: Record<string, number>,
        winReason: string,
        winnerEntries: ATownEntry[]
    } {
        // Build frequency map
        const freq: Record<number, number> = {}
        for (let i = 1; i <= 10; i++) freq[i] = 0
        for (const e of entries) {
            freq[e.number] = (freq[e.number] || 0) + 1
        }

        // Only consider numbers that were actually chosen
        const chosenNumbers = Object.entries(freq)
            .filter(([, count]) => count > 0)
            .map(([num, count]) => ({ num: parseInt(num), count }))

        // Find minimum frequency among chosen numbers
        const minFreq = Math.min(...chosenNumbers.map(x => x.count))

        // Find candidates (numbers with minimum frequency)
        const candidates = chosenNumbers.filter(x => x.count === minFreq).sort((a, b) => a.num - b.num)

        // Pick smallest number value among candidates
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
     * Run settlement and persist results to DB.
     */
    private async resolveRound() {
        const round = this.state
        const entries = [...round.entries]

        const { winningNumber, numberFrequency, winReason, winnerEntries } = this.computeWinner(entries)

        const winners = winnerEntries.map(e => e.agentId)
        const prizePerWinner = winnerEntries.length > 0 ? Math.floor(TOTAL_PRIZE / winnerEntries.length) : 0

        console.log(`🏆 ATown Round #${round.roundNumber}: Winner number=${winningNumber}, ${winners.length} winner(s), prize=${prizePerWinner} each`)

        // Process payouts
        for (const entry of entries) {
            const isWinner = winners.includes(entry.agentId)
            try {
                if (isWinner) {
                    // Refund entry fee + prize share
                    const netGain = prizePerWinner - ENTRY_FEE
                    const agent = await Agent.findByIdAndUpdate(
                        entry.agentId,
                        { $inc: { goldBalance: prizePerWinner } },
                        { new: true }
                    ) as any

                    if (agent) {
                        await AgentLog.create({
                            agentId: entry.agentId,
                            action: 'atown_win',
                            description: `Agent ${entry.agentName} WON ATown Round #${round.roundNumber}! Chose number ${entry.number}. ${winReason} Prize: +${prizePerWinner} gold (net gain: ${netGain >= 0 ? '+' : ''}${netGain} after ${ENTRY_FEE} entry fee).`,
                            details: {
                                roundNumber: round.roundNumber,
                                chosenNumber: entry.number,
                                winningNumber,
                                winReason,
                                prizePerWinner,
                                entryFee: ENTRY_FEE,
                                newBalance: agent.goldBalance,
                            }
                        })
                    }
                } else {
                    const agent = await Agent.findById(entry.agentId) as any
                    if (agent) {
                        await AgentLog.create({
                            agentId: entry.agentId,
                            action: 'atown_loss',
                            description: `Agent ${entry.agentName} lost ATown Round #${round.roundNumber}. Chose number ${entry.number}, winning number was ${winningNumber}. Lost ${ENTRY_FEE} gold entry fee.`,
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

        // Persist to DB
        try {
            await ATownRound.create({
                roundNumber: round.roundNumber,
                status: 'resolved',
                startTime: round.startTime,
                endTime: new Date(),
                entries: entries.map(e => ({
                    agentId: e.agentId,
                    agentName: e.agentName,
                    number: e.number,
                    betTime: e.betTime,
                })),
                winningNumber,
                winReason,
                winners,
                prizePerWinner,
                numberFrequency,
            })
        } catch (err) {
            console.error('ATown DB save error:', err)
        }

        // Start next round
        this.state = {
            roundNumber: round.roundNumber + 1,
            status: 'waiting',
            startTime: new Date(),
            entries: [],
            calculatingTimer: null,
        }
        console.log(`✅ ATown Round #${round.roundNumber + 1} started. Waiting for entries...`)
    }
}

export const aTownEngine = new ATownEngine()
