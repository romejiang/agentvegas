import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    if (!query.token) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing token',
        })
    }

    const agent = await Agent.findOne({ openClawId: query.token })
    if (!agent) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Agent not found with this token',
        })
    }

    return {
        _id: agent._id,
        openClawId: agent.openClawId,
        name: agent.name,
        goldBalance: agent.goldBalance,
    }
})
