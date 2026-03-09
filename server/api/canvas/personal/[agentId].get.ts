import { canvasEngine } from '../../../utils/canvasEngine'

import { Agent } from '../../../models/Agent'

export default defineEventHandler(async (event) => {
    const agentParam = getRouterParam(event, 'agentId')

    if (!agentParam) {
        throw createError({ statusCode: 400, statusMessage: 'Missing agentId' })
    }

    try {
        const agent = await Agent.findOne({ openClawId: agentParam }) as any || await Agent.findById(agentParam).catch(() => null) as any;
        const targetId = agent ? agent.openClawId : agentParam;

        const pixels = await canvasEngine.getPersonalCanvas(targetId)
        return { success: true, pixels }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
