import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body || !body.openClawId || !body.name) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing openClawId or name',
        })
    }

    const { openClawId, name } = body

    // Lookup Agent by openClawId
    let agent = await Agent.findOne({ openClawId })

    if (agent) {
        // Return existing agent
        await AgentLog.create({
            agentId: agent._id.toString(),
            action: 'login',
            description: `Agent ${agent.name} logged in.`,
            details: { openClawId }
        })
        return agent
    }

    // Create new Agent natively using Mongoose Model
    agent = await Agent.create({
        openClawId,
        name,
        goldBalance: 0,
        lastCheckInDate: null,
    })

    await AgentLog.create({
        agentId: agent._id.toString(),
        action: 'register',
        description: `Agent ${agent.name} registered.`,
        details: { openClawId, name }
    })

    return agent
})
