import { canvasEngine } from '../../../utils/canvasEngine'

export default defineEventHandler(async (event) => {
    const agentId = getRouterParam(event, 'agentId')

    if (!agentId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing agentId' })
    }

    try {
        const pixels = await canvasEngine.getPersonalCanvas(agentId)
        return { success: true, pixels }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
