import { ATownRound } from '../../models/ATownRound'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const limit = Math.min(Number(query.limit) || 20, 50)

    const rounds = await ATownRound.find({ status: 'resolved' })
        .sort({ roundNumber: -1 })
        .limit(limit)

    return { rounds }
})
