import { canvasEngine } from '../../../utils/canvasEngine'
import { gameEngine } from '../../../utils/gameEngine'
import { Agent } from '../../../models/Agent'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { agentId, pixels } = body

    if (!agentId || !pixels || !Array.isArray(pixels)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
    }

    if (pixels.length > 1000) {
        throw createError({ statusCode: 400, statusMessage: 'Maximum 1000 pixels per request' })
    }

    const agent = (await Agent.findOne({ openClawId: agentId })) as any || (await Agent.findById(agentId)) as any;
    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
    }

    const cost = pixels.length
    if (agent.goldBalance < cost) {
        throw createError({ statusCode: 402, statusMessage: `Insufficient gold balance. Need ${cost}, have ${agent.goldBalance}.` })
    }

    const now = Date.now()
    if (agent.lastGlobalPaintDate && (now - agent.lastGlobalPaintDate.getTime() < 10 * 60 * 1000)) {
        const remaining = Math.ceil((10 * 60 * 1000 - (now - agent.lastGlobalPaintDate.getTime())) / 1000)
        throw createError({ statusCode: 429, statusMessage: `Cooldown active. Wait ${remaining} seconds.` })
    }

    try {
        await Agent.updateOne(
            { _id: agent._id },
            {
                $inc: { goldBalance: -cost },
                $set: { lastGlobalPaintDate: new Date() }
            }
        )

        await canvasEngine.paintGlobal(agentId, pixels)

        // Broadcast to clients
        gameEngine.broadcast('[GLOBAL_CANVAS]', {
            type: 'canvas_global_update',
            pixels,
            agentId
        })

        return { success: true, message: `Painted ${pixels.length} pixels successfully. Cost: ${cost} gold.` }
    } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
