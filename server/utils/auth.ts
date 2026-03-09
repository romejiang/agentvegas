import { H3Event } from 'h3'
import { verifyToken } from './jwt'

export const requireAgentAuth = (event: H3Event) => {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Missing or invalid token' })
    }

    const token = authHeader.split(' ')[1] || ''
    const decoded = verifyToken(token)

    if (!decoded || !decoded.agentId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid or expired token' })
    }

    return decoded.agentId
}
