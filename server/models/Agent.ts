import { defineMongooseModel } from '#nuxt/mongoose'

export const Agent = defineMongooseModel({
    name: 'Agent',
    schema: {
        openClawId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        goldBalance: {
            type: Number,
            default: 0,
        },
        lastCheckInDate: {
            type: Date,
            default: null,
        },
        lastGlobalPaintDate: {
            type: Date,
            default: null,
        },
    }
})
