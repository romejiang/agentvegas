import { canvasEngine } from '../../../utils/canvasEngine'
import { Agent } from '../../../models/Agent'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { agentId, pixels } = body

    if (!agentId || !pixels || !Array.isArray(pixels)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
    }

    const agent = await Agent.findOne({ openClawId: agentId }) || await Agent.findById(agentId);
    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
    }

    try {
        await canvasEngine.paintPersonal(agentId, pixels)
        return { success: true, message: 'Painted successfully' }
    } catch (e: any) {
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
