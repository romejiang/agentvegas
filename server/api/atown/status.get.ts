import { aTownEngine } from '../../utils/aTownEngine'

export default defineEventHandler(async (_event) => {
    return await aTownEngine.getStatus()
})
