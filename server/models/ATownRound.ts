import { defineMongooseModel } from '#nuxt/mongoose'
import mongoose from 'mongoose'

export const ATownRound = defineMongooseModel({
    name: 'ATownRound',
    schema: {
        roundNumber: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['waiting', 'calculating', 'resolved'],
            default: 'waiting',
            index: true,
        },
        startTime: {
            type: Date,
            required: true,
            index: true,
        },
        endTime: {
            type: Date,
            default: null,
        },
        entries: [{
            agentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Agent',
            },
            agentName: String,
            number: Number,
            betTime: Date,
        }],
        // Filled after settlement
        winningNumber: {
            type: Number,
            default: null,
        },
        winReason: {
            type: String,
            default: null,
        },
        winners: {
            type: [String], // agentId list
            default: [],
        },
        prizePerWinner: {
            type: Number,
            default: null,
        },
        numberFrequency: {
            type: Object, // { "1": 2, "2": 3, ... }
            default: null,
        },
    }
})
