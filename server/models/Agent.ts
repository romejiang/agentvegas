import { defineMongooseModel } from '#nuxt/mongoose'

export const Agent = defineMongooseModel('Agent', {
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
})
