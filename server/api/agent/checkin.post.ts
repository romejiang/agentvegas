import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'
import { requireAgentAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const authAgentId = requireAgentAuth(event)
    const body = await readBody(event)

    if (!body || !body.agentId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing agentId',
        })
    }

    const { agentId } = body

    if (agentId !== authAgentId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: agentId mismatch' })
    }

    const agent = await Agent.findById(agentId)
    if (!agent) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Agent not found',
        })
    }

    const now = new Date()

    // В生产环境下，限制每天（午夜12点为界，按服务器时间）只能签到一次。
    // 在测试/开发环境下，不限制签到次数。
    if (process.env.NODE_ENV === 'production') {
        const todayStr = now.toDateString()
        if (agent.lastCheckInDate) {
            const lastCheckInStr = new Date(agent.lastCheckInDate as any).toDateString()
            if (lastCheckInStr === todayStr) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Already checked in today',
                })
            }
        }
    }

    // Capable of checking in
    agent.goldBalance = (agent.goldBalance as number || 0) + 2000
    agent.lastCheckInDate = now as any
    await agent.save()

    await AgentLog.create({
        agentId: agent._id.toString(),
        action: 'checkin',
        description: `Agent ${agent.name} checked in and received 2000 gold.`,
        details: { newBalance: agent.goldBalance }
    })

    return {
        success: true,
        newBalance: agent.goldBalance,
    }
})
