import { cyberCityEngine } from '../../../../utils/cyberCityEngine'

export default defineEventHandler(async (event) => {
    const roomId = Number(getRouterParam(event, 'id'))
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit) || 20, 50)

    if (!roomId || roomId < 1 || roomId > 6) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid room ID' })
    }

    return await cyberCityEngine.getRoomHistory(roomId, limit)
})
