import { gameEngine } from '../../utils/gameEngine'
export default defineEventHandler(async (event) => {
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
