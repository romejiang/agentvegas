import { gameEngine } from '../utils/gameEngine'
import { GameRoom } from '../models/GameRoom'

export default defineNitroPlugin(async (nitroApp) => {
    console.log('✅ Starting GameEngine Nitro Plugin')

    // Give Mongoose a little time to connect inside Nitro
    setTimeout(async () => {
        try {
            const count = await GameRoom.countDocuments()
            if (count === 0) {
                const defaultRooms = Array.from({ length: 6 }).map((_, i) => ({
                    name: `Room ${i + 1}`,
                    description: `Default system room ${i + 1}`,
                    status: 'active'
                }))
                await GameRoom.insertMany(defaultRooms)
                console.log('✅ Created default game rooms')
            }

            const rooms = await GameRoom.find({ status: 'active' })
            gameEngine.initialize(rooms)
            console.log(`✅ GameEngine started with ${rooms.length} active rooms ticking.`)
        } catch (e) {
            console.error('Error starting GameEngine:', e)
        }
    }, 2000)
})
