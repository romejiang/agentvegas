import { GameRecord } from '../../../models/GameRecord'

export default defineEventHandler(async (event) => {
    const roomId = getRouterParam(event, 'id')

    if (!roomId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing roomId' })
    }

    const records = await GameRecord.find({ roomId })
        .sort({ endTime: -1 })
        .limit(20)
        .select('roomId roundNumber startTime endTime winningAnimal winningColor oddsMap')

    return {
        records
    }
})
