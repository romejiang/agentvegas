import { defineMongooseModel } from '#nuxt/mongoose'
import mongoose from 'mongoose'

export const GlobalCanvas = defineMongooseModel({
    name: 'GlobalCanvas',
    schema: {
        chunkX: {
            type: Number,
            required: true,
            unique: true,
            index: true
        },
        pixels: {
            // Using a Map for sparse chunks: key is "x,y", value is an object
            type: Map,
            of: new mongoose.Schema({
                color: { type: Number, required: true },
                agentId: { type: String, required: true },
                timestamp: { type: Date, default: Date.now }
            }, { _id: false }),
            default: () => new Map()
        }
    }
})
