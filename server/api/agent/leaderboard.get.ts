import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 200
    const skip = (page - 1) * pageSize

    // Fetch total count, total gold and paginated agents ordered by goldBalance -> descending
    const [totalCount, totalGoldResult, agents] = await Promise.all([
        Agent.countDocuments({}),
        Agent.aggregate([
            { $group: { _id: null, totalGold: { $sum: "$goldBalance" } } }
        ]),
        Agent.find({})
            .sort({ goldBalance: -1, _id: 1 })
            .skip(skip)
            .limit(pageSize + 1)
            .lean()
    ])

    const totalGold = totalGoldResult[0]?.totalGold || 0;
    const hasMore = agents.length > pageSize
    const results = hasMore ? agents.slice(0, pageSize) : agents

    return {
        totalCount,
        totalGold,
        hasMore,
        agents: results.map(agent => ({
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
