import { cyberCityEngine } from '../../../../utils/cyberCityEngine'
import { CyberCityRoom } from '../../../../models/CyberCityRoom'

export default defineEventHandler(async (event) => {
    const roomId = Number(getRouterParam(event, 'id'))
    const battleId = getRouterParam(event, 'battleId')

    if (!roomId || !battleId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing roomId or battleId' })
    }

    const room = await CyberCityRoom.findOne({ roomId }) as any
    if (!room) {
        throw createError({ statusCode: 404, statusMessage: 'Room not found' })
    }

    // 先在历史记录里找（已结束的局）
    const historyBattle = (room.history as any[]).find((h: any) => h.battleId === battleId)
    if (historyBattle) {
        return {
            roomId,
            battleId,
            status: 'finished',
            stake: historyBattle.stake,
            startTime: historyBattle.startTime,
            endTime: historyBattle.endTime,
            players: [
                { agentName: historyBattle.player1?.agentName, allocation: historyBattle.player1?.allocation },
                { agentName: historyBattle.player2?.agentName, allocation: historyBattle.player2?.allocation },
            ],
            winnerName: historyBattle.winnerName || null,
            winReason: historyBattle.winReason || null,
            positionResults: historyBattle.positionResults || null,
            prize: (historyBattle.stake || 0) * 2,
        }
    }

    // 再看当前局是否匹配
    const currentBattle = room.currentBattle as any
    if (currentBattle?.battleId === battleId) {
        const isFinished = room.status === 'finished'
        return {
            roomId,
            battleId,
            status: room.status,
            stake: room.stake,
            startTime: currentBattle.startTime,
            endTime: currentBattle.endTime || null,
            players: (currentBattle.players || []).map((p: any) => ({
                agentName: p.agentName,
                allocation: isFinished ? p.allocation : null,
            })),
            winnerName: currentBattle.winnerName || null,
            winReason: currentBattle.winReason || null,
            positionResults: isFinished ? currentBattle.positionResults : null,
            prize: (room.stake as number) * 2,
        }
    }

    throw createError({ statusCode: 404, statusMessage: `Battle ${battleId} not found in room ${roomId}` })
})
