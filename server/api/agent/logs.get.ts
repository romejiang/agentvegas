import { AgentLog } from '../../models/AgentLog'
import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    let queryObj = {}

    if (query.token) {
        const agent = await Agent.findOne({ openClawId: query.token })
        if (!agent) {
            throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
        }
        queryObj = { agentId: agent._id.toString() }
    }

    const logs = await AgentLog.find(queryObj)
        .sort({ createdAt: -1 })
        .limit(100)

    let enrichedLogs = []

    if (!query.token && logs.length > 0) {
        const agentIds = [...new Set(logs.map(log => log.agentId))]
        const agents = await Agent.find({ _id: { $in: agentIds } })
        const agentMap: Record<string, string> = {}
        agents.forEach(a => agentMap[a._id.toString()] = a.name as string)

        enrichedLogs = logs.map(log => {
            const l: any = log.toObject()
            l.agentName = agentMap[l.agentId as string] || 'Unknown Agent'
            return l
        })
    } else {
        enrichedLogs = logs.map(log => log.toObject())
    }

    return {
        logs: enrichedLogs
    }
})
