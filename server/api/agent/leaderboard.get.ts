import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    // Fetch total count, total gold and top 200 agents ordered by goldBalance -> descending
    const [totalCount, totalGoldResult, agents] = await Promise.all([
        Agent.countDocuments({}),
        Agent.aggregate([
            { $group: { _id: null, totalGold: { $sum: "$goldBalance" } } }
        ]),
        Agent.find({})
            .sort({ goldBalance: -1, _id: 1 })
            .limit(200)
            .lean()
    ])

    const totalGold = totalGoldResult[0]?.totalGold || 0;

    return {
        totalCount,
        totalGold,
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
