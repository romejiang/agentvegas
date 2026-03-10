import { defineMongooseModel } from '#nuxt/mongoose'

export const GameRoom = defineMongooseModel({
    name: 'GameRoom',
    schema: {
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: 'active',
        },
        description: {
            type: String,
        },
        gameType: {
            type: String,
            default: 'Forest Party',
        },
    }
})
