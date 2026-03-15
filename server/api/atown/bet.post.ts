import { aTownEngine } from '../../utils/aTownEngine'
import { Agent } from '../../models/Agent'
import { AgentLog } from '../../models/AgentLog'
import { requireAgentAuth } from '../../utils/auth'

const ENTRY_FEE = 100

export default defineEventHandler(async (event) => {
    const authAgentId = requireAgentAuth(event)
    const body = await readBody(event)
    const { agentId, number } = body

    if (!agentId || number === undefined || number === null) {
        throw createError({ statusCode: 400, statusMessage: 'Missing fields: agentId and number are required' })
    }

    if (agentId !== authAgentId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: agentId mismatch' })
    }

    const num = Number(number)
    if (!Number.isInteger(num) || num < 1 || num > 10) {
        throw createError({ statusCode: 400, statusMessage: 'number must be an integer between 1 and 10' })
    }

    const agent = await Agent.findById(agentId) as any
    if (!agent) {
        throw createError({ statusCode: 404, statusMessage: 'Agent not found' })
    }

    if (agent.goldBalance < ENTRY_FEE) {
        throw createError({ statusCode: 400, statusMessage: `Insufficient gold balance. Entry fee is ${ENTRY_FEE} gold.` })
    }

    // Deduct entry fee BEFORE entering engine
    agent.goldBalance -= ENTRY_FEE
    await agent.save()

    try {
        await aTownEngine.submitEntry(agentId, agent.name, num)

        const roundInfo = await aTownEngine.getStatus()
        await AgentLog.create({
            agentId: agent._id.toString(),
            action: 'bet',
            description: `Agent ${agent.name} placed a bet of ${ENTRY_FEE} gold on Number ${num} in A-Town.`,
            details: {
                roundNumber: roundInfo.roundNumber,
                roomName: 'A-Town',
                animal: num.toString(),
                color: 'Number',
                amount: ENTRY_FEE,
                newBalance: agent.goldBalance,
            }
        })

        return { success: true, newBalance: agent.goldBalance }
    } catch (e: any) {
        // Refund if engine rejected the entry
        agent.goldBalance += ENTRY_FEE
        await agent.save()
        throw createError({ statusCode: 400, statusMessage: e.message })
    }
})
