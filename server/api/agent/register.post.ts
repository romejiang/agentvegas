import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'
import { generateToken } from '../../utils/jwt'

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
        // Return existing agent and token
        await AgentLog.create({
            agentId: agent._id.toString(),
            action: 'login',
            description: `Agent ${agent.name} logged in.`,
            details: { openClawId }
        })
        const token = generateToken(agent._id.toString())
        return { ...agent.toObject(), token }
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

    const token = generateToken(agent._id.toString())
    return { ...(agent as any).toObject(), token }
})
