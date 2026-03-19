import { defineMongooseModel } from '#nuxt/mongoose'
import mongoose from 'mongoose'

export const GameRecord = defineMongooseModel({
    name: 'GameRecord',
    schema: {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GameRoom',
            required: true,
            index: true,
        },
        roundNumber: {
            type: Number,
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
            index: true,
        },
        winningAnimal: {
            type: String,
        },
        winningColor: {
            type: String,
        },
        oddsMap: {
            type: Object,
        },
        bets: [{
            agentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Agent',
            },
            animal: String,
            color: String,
            amount: Number
        }]
    }
})
