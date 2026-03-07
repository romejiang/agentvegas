import mongoose from 'mongoose'

export default defineNitroPlugin(async (nitroApp) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/agentvegas')
        console.log('Connected to MongoDB')
    } catch (e) {
        console.error('Failed to connect to MongoDB', e)
    }
})
