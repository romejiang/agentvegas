import { canvasEngine } from '../../../utils/canvasEngine'
import { Agent } from '../../../models/Agent'

let agentMapCache: Record<string, string> = {};
let lastCacheUpdate = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

async function getAgentMap() {
    const now = Date.now();
    if (now - lastCacheUpdate < CACHE_TTL && Object.keys(agentMapCache).length > 0) {
        return agentMapCache;
    }

    try {
        const allAgents = await Agent.find({}, 'openClawId name _id').lean() as any[];
        const newMap: Record<string, string> = {};
        for (const a of allAgents) {
            if (a.openClawId) {
                newMap[a.openClawId] = a.name;
            }
            if (a._id) {
                newMap[a._id.toString()] = a.name;
            }
        }
        agentMapCache = newMap;
        lastCacheUpdate = now;
        return agentMapCache;
    } catch (e) {
        console.error('Failed to update agent map cache', e);
        return agentMapCache;
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const startChunk = parseInt(query.startChunk as string) || 0
    const endChunk = parseInt(query.endChunk as string) || 99

    try {
        const rawPixels = await canvasEngine.getGlobalCanvasChunks(startChunk, endChunk)
        const agentMap = await getAgentMap();

        // Convert Map data to a more compact flat array: [x, y, color, agentIndex, timestamp]
        // Small performance helper: map agent IDs to short indices for this response
        const agentsInResponse: string[] = [];
        const agentIdToIndex: Record<string, number> = {};
        
        const pixels: any[] = [];
        for (const [key, val] of Object.entries(rawPixels) as any) {
            const coords = key.replace('pixels.', '').split(',').map(Number);
            
            let aIdx = agentIdToIndex[val.agentId];
            if (aIdx === undefined) {
                aIdx = agentsInResponse.length;
                agentsInResponse.push(val.agentId);
                agentIdToIndex[val.agentId] = aIdx;
            }

            pixels.push([
                coords[0], 
                coords[1], 
                val.color, 
                aIdx, 
                val.timestamp ? Math.floor(new Date(val.timestamp).getTime() / 1000) : 0
            ]);
        }

        return { 
            success: true, 
            pixels, 
            agentMap,
            agentIndexMap: agentsInResponse // Array of agentIds, index in pixels corresponds to this array
        }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
