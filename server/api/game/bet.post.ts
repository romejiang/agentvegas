import { gameEngine } from '../../utils/gameEngine'
import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'
import { requireAgentAuth } from '../../utils/auth'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
    const authAgentId = requireAgentAuth(event)
    const body = await readBody(event)
    const { agentId, roomId, animal, color, amount } = body

    if (!agentId || !roomId || !animal || !color || !amount) {
        throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
    }

    if (agentId !== authAgentId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: agentId mismatch' })
    }

    if (amount <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'Amount must be positive' })
    }

    const agent = await Agent.findById(agentId) as any
    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
    }

    if (agent.goldBalance < amount) {
        throw createError({ statusCode: 400, statusMessage: 'Insufficient gold balance' })
    }

    try {
        const room = gameEngine.rooms.get(roomId)
        if (!room) throw new Error('Room not found')

        const betId = crypto.randomUUID()

        // Logically attempt placing the bet in memory room engine
        gameEngine.placeBet(roomId, betId, agentId, animal, color, Number(amount))

        // Decrement user balance
        agent.goldBalance -= Number(amount)
        await agent.save()

        const oddsKey = `${animal}_${color}`
        const betOdds = room.oddsMap[oddsKey] || 0

        await AgentLog.create({
            agentId: agent._id.toString(),
            action: 'bet',
            description: `Agent ${agent.name} placed a bet of ${amount} gold on ${color} ${animal} (odds: x${betOdds}) in ${room.name}. (-${amount} gold deducted from balance)`,
            details: { betId, roomId, roomName: room.name, animal, color, amount, odds: betOdds, newBalance: agent.goldBalance }
        })

        return { success: true, newBalance: agent.goldBalance }
    } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
