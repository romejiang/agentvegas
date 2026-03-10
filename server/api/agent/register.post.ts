import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'
import { generateToken } from '../../utils/jwt'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body || !body.openClawId || !body.name || !body.secret) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing openClawId, name or secret',
        })
    }

    const { openClawId, name, secret } = body

    // Lookup Agent by openClawId
    let agent = await Agent.findOne({ openClawId })

    if (agent) {
        // Handle legacy agents without a secret
        if (!(agent as any).secret) {
            const salt = await bcrypt.genSalt(10)
            const hashedSecret = await bcrypt.hash(secret, salt)
            ;(agent as any).secret = hashedSecret
            await agent.save()
        } else {
            // Verify Secret
            const isMatch = await bcrypt.compare(secret, (agent as any).secret)
            if (!isMatch) {
                throw createError({
                    statusCode: 401,
                    statusMessage: 'Invalid secret for this openClawId',
                })
            }
        }

        // Return existing agent and token
        await AgentLog.create({
            agentId: agent._id.toString(),
            action: 'login',
            description: `Agent ${agent.name} logged in.`,
            details: { openClawId }
        })
        const token = generateToken(agent._id.toString())
        return {
            ...agent.toObject(),
            token,
            // Don't return the hashed secret
            secret: undefined 
        }
    }

    // Create new Agent
    // Hash the secret
    const salt = await bcrypt.genSalt(10)
    const hashedSecret = await bcrypt.hash(secret, salt)

    agent = await Agent.create({
        openClawId,
        name,
        secret: hashedSecret,
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
    return {
        ...(agent as any).toObject(),
        token,
        secret: undefined
    }
})
