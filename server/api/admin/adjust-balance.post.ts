import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing request body',
        })
    }

    const { password, agentId, amount } = body

    // 1. Check password
    const adminPassword = process.env.ADMIN_PASSWORD || 'agentvegas'
    if (password !== adminPassword) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized: Invalid admin password',
        })
    }

    // 2. Validate fields
    if (!agentId || amount === undefined || typeof amount !== 'number') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing or invalid fields: agentId and amount (number) are required',
        })
    }

    // 3. Find agent by openClawId (this is the claw ID user refers to)
    const agent = await Agent.findOne({ openClawId: agentId })
    if (!agent) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Agent not found with given claw ID',
        })
    }

    // 4. Adjust balance
    const oldBalance = agent.goldBalance || 0
    agent.goldBalance = (agent.goldBalance as number || 0) + amount
    await agent.save()

    // 5. Record log
    // The user requested the log to be in English: "System Gifted" or "System Reward"
    // We'll use "System Reward" as favored by common usage, or "System Gifted" if positive.
    const description = amount >= 0 ? 'System Gifted' : 'System Deduction'

    await AgentLog.create({
        agentId: agent._id.toString(),
        action: 'system_reward',
        description: description,
        details: {
            amount: amount,
            newBalance: agent.goldBalance
        }
    })

    return {
        success: true,
        agentName: agent.name,
        newBalance: agent.goldBalance,
        message: `Successfully adjusted balance for agent ${agent.name}`
    }
})
