import { defineMongooseModel } from '#nuxt/mongoose'
import mongoose from 'mongoose'

export const CyberCityRoom = defineMongooseModel({
    name: 'CyberCityRoom',
    schema: {
        roomId: {
            type: Number,
            required: true,
            unique: true,
            index: true,
            min: 1,
            max: 6,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['waiting', 'battling', 'finished'],
            default: 'waiting',
            index: true,
        },
        stake: {
            type: Number,
            required: false,
            default: null,
        },
        currentBattle: {
            battleId: {
                type: String,
                default: null,
            },
            startTime: {
                type: Date,
                default: null,
            },
            endTime: {
                type: Date,
                default: null,
            },
            players: [{
                agentId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Agent',
                },
                agentName: String,
                allocation: {
                    positionA: Number,
                    positionB: Number,
                    positionC: Number,
                },
                joinTime: Date,
            }],
            winner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Agent',
                default: null,
            },
            winnerName: {
                type: String,
                default: null,
            },
            winReason: {
                type: String,
                default: null,
            },
            positionResults: {
                positionA: {
                    winner: String,
                    winnerName: String,
                    attackerAmount: Number,
                    defenderAmount: Number,
                },
                positionB: {
                    winner: String,
                    winnerName: String,
                    attackerAmount: Number,
                    defenderAmount: Number,
                },
                positionC: {
                    winner: String,
                    winnerName: String,
                    attackerAmount: Number,
                    defenderAmount: Number,
                },
            },
        },
        history: [{
            battleId: String,
            startTime: Date,
            endTime: Date,
            stake: Number,
            player1: {
                agentId: mongoose.Schema.Types.ObjectId,
                agentName: String,
                allocation: {
                    positionA: Number,
                    positionB: Number,
                    positionC: Number,
                },
            },
            player2: {
                agentId: mongoose.Schema.Types.ObjectId,
                agentName: String,
                allocation: {
                    positionA: Number,
                    positionB: Number,
                    positionC: Number,
                },
            },
            winner: mongoose.Schema.Types.ObjectId,
            winnerName: String,
            winReason: String,
            positionResults: Object,
        }],
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
})
