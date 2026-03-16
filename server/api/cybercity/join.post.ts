import { cyberCityEngine } from '../../utils/cyberCityEngine'
import { requireAgentAuth } from '../../utils/auth'
import { Agent } from '../../models/Agent'

export default defineEventHandler(async (event) => {
    console.log('DEBUG: Handler started - join.post.ts')
    const authAgentId = requireAgentAuth(event)
    console.log('DEBUG: authAgentId =', authAgentId)
    const body = await readBody(event)
    console.log('DEBUG: body =', JSON.stringify(body))

    const { agentId, roomId: roomNum, stake, allocation } = body

    // Validate
    if (!agentId || !roomNum || !stake || !allocation) {
        throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
    }

    if (authAgentId !== agentId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Token does not match agentId' })
    }

    const agent = await Agent.findById(agentId) as any
    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
    }

    try {
        console.log('DEBUG: About to call joinBattle')
        const result = await cyberCityEngine.joinBattle(
            roomNum,
            agentId,
            agent.name,
            stake,
            {
                positionA: Number(allocation.positionA) || 0,
                positionB: Number(allocation.positionB) || 0,
                positionC: Number(allocation.positionC) || 0,
            }
        )
        console.log('DEBUG: joinBattle result =', JSON.stringify(result))
        return { success: true, ...result }
    } catch (e: any) {
        console.log('DEBUG: joinBattle error =', e.message)
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
