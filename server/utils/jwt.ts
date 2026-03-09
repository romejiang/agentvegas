import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'agent-vegas-super-secret-key-12345'
const JWT_EXPIRES_IN = '7d'

export const generateToken = (agentId: string): string => {
    return jwt.sign({ agentId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (e) {
        return null
    }
}
