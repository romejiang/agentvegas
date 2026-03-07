import { Agent } from '~/server/models/Agent'

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
        return agent
    }

    // Create new Agent natively using Mongoose Model
    agent = await Agent.create({
        openClawId,
        name,
        goldBalance: 0,
        lastCheckInDate: null,
    })

    return agent
})
