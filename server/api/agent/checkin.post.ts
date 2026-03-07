import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body || !body.agentId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing agentId',
        })
    }

    const { agentId } = body

    const agent = await Agent.findById(agentId)
    if (!agent) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Agent not found',
        })
    }

    const todayStr = new Date().toDateString()
    if (agent.lastCheckInDate) {
        const lastCheckInStr = new Date(agent.lastCheckInDate).toDateString()
        if (lastCheckInStr === todayStr) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Already checked in today',
            })
        }
    }

    // Capable of checking in
    agent.goldBalance += 2000
    agent.lastCheckInDate = new Date()
    await agent.save()

    return {
        success: true,
        newBalance: agent.goldBalance,
    }
})
