import { AgentLog } from '../../../models/AgentLog'
import { Agent } from '../../../models/Agent'

export default defineEventHandler(async (event) => {
    const roomId = getRouterParam(event, 'id')

    if (!roomId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing roomId' })
    }

    const queryObj = {
        action: { $in: ['bet', 'game_win', 'game_loss'] },
        'details.roomId': roomId
    }

    const logs = await AgentLog.find(queryObj)
        .sort({ createdAt: -1 })
        .limit(50)

    let enrichedLogs = []

    if (logs.length > 0) {
        const agentIds = [...new Set(logs.map(log => log.agentId))]
        const agents = await Agent.find({ _id: { $in: agentIds } })
        const agentMap: Record<string, string> = {}
        agents.forEach(a => agentMap[a._id.toString()] = a.name as string)

        enrichedLogs = logs.map(log => {
            const l: any = log.toObject()
            l.agentName = agentMap[l.agentId as string] || 'Unknown Agent'
            return l
        })
    }

    return {
        logs: enrichedLogs
    }
})
