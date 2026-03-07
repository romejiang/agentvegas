import { Agent } from '../../models/Agent'

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

    return {
        balance: agent.goldBalance,
    }
})
