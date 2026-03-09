import { defineMongooseModel } from '#nuxt/mongoose'

export const AgentLog = defineMongooseModel({
    name: 'AgentLog',
    schema: {
        agentId: {
            type: String,
            required: true,
            index: true
        },
        action: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        details: {
            type: Object,
            default: {},
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }
})
