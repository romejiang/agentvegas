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
    const startChunk = query.startChunk !== undefined ? parseInt(query.startChunk as string) : 0
    const endChunk = query.endChunk !== undefined ? parseInt(query.endChunk as string) : 99

    try {
        const rawPixels = await canvasEngine.getGlobalCanvasChunks(startChunk, endChunk)
        const agentMap = await getAgentMap();

        const agentsInResponse: string[] = [];
        const agentIdToIndex: Record<string, number> = {};
        
        const pixels: string[] = [];
        const baseTime = Math.floor(Date.now() / 1000);

        for (const [key, val] of Object.entries(rawPixels) as any) {
            const coords = key.replace('pixels.', '').split(',').map(Number);
            const x = coords[0];
            const y = coords[1];
            
            let aIdx = agentIdToIndex[val.agentId];
            if (aIdx === undefined) {
                aIdx = agentsInResponse.length;
                agentsInResponse.push(val.agentId);
                agentIdToIndex[val.agentId] = aIdx;
            }

            const relTs = val.timestamp ? Math.floor(new Date(val.timestamp).getTime() / 1000) - baseTime : 0;
            
            // Format: "x,y,color,agentIdx,relTs" as a single string per pixel, or even combined
            // To be extremely aggressive, use a custom string format
            pixels.push(`${x},${y},${val.color},${aIdx},${relTs}`);
        }

        // Only send the names of agents that are actually in this pixel set
        const filteredAgentMap: Record<string, string> = {};
        for (const id of agentsInResponse) {
            if (agentMap[id]) {
                filteredAgentMap[id] = agentMap[id];
            }
        }

        return { 
            success: true, 
            pixels: pixels.join('|'), 
            pixelCount: pixels.length,
            baseTime,
            agentMap: filteredAgentMap,
            agentIndexMap: agentsInResponse 
        }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message })
    }
})
