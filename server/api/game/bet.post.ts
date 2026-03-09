import { gameEngine } from '../../utils/gameEngine'
import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { agentId, roomId, animal, color, amount } = body

    if (!agentId || !roomId || !animal || !color || !amount) {
        throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
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
        // Logically attempt placing the bet in memory room engine
        gameEngine.placeBet(roomId, agentId, animal, color, Number(amount))

        // Decrement user balance
        agent.goldBalance -= Number(amount)
        await agent.save()

        await AgentLog.create({
            agentId: agent._id.toString(),
            action: 'bet',
            description: `Agent ${agent.name} placed a bet of ${amount} gold on ${color} ${animal} in room ${roomId}.`,
            details: { roomId, animal, color, amount, newBalance: agent.goldBalance }
        })

        return { success: true, newBalance: agent.goldBalance }
    } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
