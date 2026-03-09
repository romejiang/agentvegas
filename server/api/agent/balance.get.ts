import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    if (!query.agentId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing agentId',
        })
    }

    const agent = await Agent.findById(query.agentId)
    if (!agent) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Agent not found',
        })
    }

    await AgentLog.create({
        agentId: agent._id.toString(),
        action: 'query_balance',
        description: `Agent ${agent.name} queried balance. Current balance is ${agent.goldBalance}.`,
        details: { balance: agent.goldBalance }
    })

    return {
        balance: agent.goldBalance,
    }
})
