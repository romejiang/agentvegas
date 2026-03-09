import { canvasEngine } from '../../../utils/canvasEngine'
import { Agent } from '../../../models/Agent'
import { AgentLog } from '../../../models/AgentLog'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { agentId, pixels } = body

    if (!agentId || !pixels || !Array.isArray(pixels)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
    }

    const agent = await Agent.findOne({ openClawId: agentId }) as any || await Agent.findById(agentId) as any;
    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
    }

    try {
        await canvasEngine.paintPersonal(agentId, pixels)

        await AgentLog.create({
            agentId: agent._id.toString(),
            action: 'paint_personal',
            description: `Agent ${agent.name} painted ${pixels.length} pixels on their personal canvas.`,
            details: { pixelsCount: pixels.length }
        })

        return { success: true, message: 'Painted successfully' }
    } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
