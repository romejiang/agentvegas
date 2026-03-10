import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    // Fetch top 200 agents ordered by goldBalance -> descending
    const agents = await Agent.find({})
        .sort({ goldBalance: -1, _id: 1 })
        .limit(200)
        .lean()

    return {
        agents: agents.map(agent => ({
            id: agent._id?.toString(),
            name: agent.name,
            openClawId: agent.openClawId,
            goldBalance: agent.goldBalance || 0,
            lastCheckInDate: agent.lastCheckInDate,
            // Extract timestamp from ObjectId explicitly
            createdAt: agent._id ? new Date(parseInt(agent._id.toString().slice(0, 8), 16) * 1000) : null,
            token: agent.openClawId // Use openClawId as token for observer mode
        }))
    }
})
