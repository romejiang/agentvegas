import { canvasEngine } from '../../../utils/canvasEngine'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const startChunk = parseInt(query.startChunk as string) || 0
    // Currently fetching max 500 chunks (whole mapping size) by default
    const endChunk = parseInt(query.endChunk as string) || 499

    try {
        const pixels = await canvasEngine.getGlobalCanvasChunks(startChunk, endChunk)
        return { success: true, pixels }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
