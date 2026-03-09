import { gameEngine } from '../../utils/gameEngine'
import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    if (query.agentId) {
        const agent = await Agent.findById(query.agentId).catch(() => null)
        if (agent) {
            await AgentLog.create({
                agentId: agent._id.toString(),
                action: 'query_rooms',
                description: `Agent ${agent.name} queried room states.`,
                details: {}
            })
        }
    }

    const roomsArray = Array.from(gameEngine.rooms.values()).map(r => {
        return {
            roomId: r.roomId,
            name: r.name,
            status: r.status,
            timer: r.timer,
            oddsMap: r.oddsMap,
            winningAnimal: r.winningAnimal,
            winningColor: r.winningColor
        }
    })
    return { rooms: roomsArray }
})
