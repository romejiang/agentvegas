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
            index: true,
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
            index: true,
        }
    }
})

AgentLog.schema.index({ action: 1, createdAt: -1 })
AgentLog.schema.index({ agentId: 1, createdAt: -1 })
