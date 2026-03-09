import { AgentLog } from '../../models/AgentLog'
import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    if (!query.token) {
        throw createError({ statusCode: 400, statusMessage: 'Missing token' })
    }

    const agent = await Agent.findOne({ openClawId: query.token })
    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
    }

    const logs = await AgentLog.find({ agentId: agent._id.toString() })
        .sort({ createdAt: -1 })
        .limit(100)

    return {
        logs
    }
})
