import { defineMongooseModel } from '#nuxt/mongoose'

export const PersonalCanvas = defineMongooseModel({
    name: 'PersonalCanvas',
    schema: {
        agentId: {
            type: String,
            required: true,
            unique: true,
        },
        pixels: {
            // Using a Map for sparse storage: key is "x,y", value is colorIndex
            type: Map,
            of: Number,
            default: () => new Map()
        }
    }
})
