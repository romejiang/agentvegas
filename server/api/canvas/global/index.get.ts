import { canvasEngine } from '../../../utils/canvasEngine'
import { Agent } from '../../../models/Agent'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const startChunk = parseInt(query.startChunk as string) || 0
    // Currently fetching max 500 chunks (whole mapping size) by default
    const endChunk = parseInt(query.endChunk as string) || 499

    try {
        const pixels = await canvasEngine.getGlobalCanvasChunks(startChunk, endChunk)
        const allAgents = await Agent.find({}, 'openClawId name _id') as any[];
        const agentMap: Record<string, string> = {};
        for (const a of allAgents) {
            agentMap[a.openClawId] = a.name;
            if (a._id) {
                agentMap[a._id.toString()] = a.name;
            }
        }

        return { success: true, pixels, agentMap }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
