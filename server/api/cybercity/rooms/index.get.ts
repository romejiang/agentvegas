import { cyberCityEngine } from '../../../utils/cyberCityEngine'

export default defineEventHandler(async (_event) => {
    return await cyberCityEngine.getRoomsStatus()
})
