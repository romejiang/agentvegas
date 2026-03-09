import { AgentLog } from '../../models/AgentLog'

export default defineEventHandler(async (event) => {
    // Current time minus 10 hours
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000)

    try {
        // Find unique agent IDs from AgentLog within the last 10 hours
        const activeAgentIds = await AgentLog.distinct('agentId', {
            createdAt: { $gte: tenHoursAgo }
        })

        return {
            count: activeAgentIds.length
        }
    } catch (e: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to calculate online agent count: ' + e.message
        })
    }
})
