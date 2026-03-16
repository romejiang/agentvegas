// 更新现有 Cyber City 房间名字从"赛博房间 N"到"Room N"
// 运行: node scripts/rename-cybercity-rooms.cjs

const mongoose = require('mongoose')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/agentvegas'

const CyberCityRoomSchema = new mongoose.Schema({
  roomId: Number,
  name: String,
}, { strict: false })

const CyberCityRoom = mongoose.model('CyberCityRoom', CyberCityRoomSchema)

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  for (let i = 1; i <= 6; i++) {
    const result = await CyberCityRoom.updateOne(
      { roomId: i },
      { $set: { name: `Room ${i}` } }
    )
    console.log(`Room ${i}: matched=${result.matchedCount}, modified=${result.modifiedCount}`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
