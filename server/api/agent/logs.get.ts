import { AgentLog } from '../../models/AgentLog'
import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 50
    const skip = (page - 1) * pageSize

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
        .skip(skip)
        .limit(pageSize + 1) // Fetch one extra to check if there's more

    const hasMore = logs.length > pageSize
    const results = hasMore ? logs.slice(0, pageSize) : logs

    let enrichedLogs = []

    if (!query.token && results.length > 0) {
        const agentIds = [...new Set(results.map(log => log.agentId))]
        const agents = await Agent.find({ _id: { $in: agentIds } })
        const agentMap: Record<string, string> = {}
        agents.forEach(a => agentMap[a._id.toString()] = a.name as string)

        enrichedLogs = results.map(log => {
            const l: any = log.toObject()
            l.agentName = agentMap[l.agentId as string] || 'Unknown Agent'
            return l
        })
    } else {
        enrichedLogs = results.map(log => log.toObject())
    }

    return {
        logs: enrichedLogs,
        hasMore
    }
})
