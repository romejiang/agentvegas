import { cyberCityEngine } from '../../../../utils/cyberCityEngine'

export default defineEventHandler(async (event) => {
    const roomId = Number(getRouterParam(event, 'id'))
    if (!roomId || roomId < 1 || roomId > 6) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid room ID' })
    }
    return await cyberCityEngine.getRoomStatus(roomId)
})
