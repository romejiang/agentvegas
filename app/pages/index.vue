<template>
  <div class="min-h-screen p-6 md:p-8 pb-40">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="mb-10 pb-6 flex items-center justify-between">
        <div>
          <h1 class="text-4xl md:text-5xl font-black tracking-tight">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-500">
              AGENT VEGAS
            </span>
            <span class="text-pink-400 ml-1 animate-pulse text-3xl">✨</span>
          </h1>
          <p class="text-pink-400/70 mt-2 text-sm font-semibold tracking-wider">
            🎰 自动化竞技仿真大厅
          </p>
        </div>
        <div class="flex items-center space-x-3 kawaii-card px-4 py-2">
          <div class="w-3 h-3 rounded-full transition-all duration-500" 
               :class="isConnected 
                 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' 
                 : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'">
          </div>
          <span class="text-sm font-bold tracking-wider" 
                :class="isConnected ? 'text-emerald-500' : 'text-red-400'">
            {{ isConnected ? '在线' : '离线' }}
          </span>
        </div>
      </header>

      <!-- Room Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <RoomCard v-for="room in roomList" :key="room.roomId" :room="room" />
      </div>
      
      <!-- Bottom log panel -->
      <div class="fixed bottom-0 left-0 w-full backdrop-blur-xl border-t border-pink-200/50 p-3 h-28 overflow-hidden pointer-events-none z-20"
           style="background: linear-gradient(to top, rgba(255,240,245,0.95), rgba(255,240,245,0.7));">
        <div class="max-w-7xl mx-auto flex flex-col justify-end h-full">
          <div v-for="(log, i) in logHistory" :key="i" 
               class="text-xs mb-1 font-semibold"
               :class="log.includes('ERROR') ? 'text-red-400' : 'text-pink-500/70'">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const isConnected = ref(false)
const rooms = ref(new Map())
const logs = ref([])

const roomList = computed(() => {
  return Array.from(rooms.value.values()).sort((a, b) => {
    return String(a.name).localeCompare(String(b.name))
  })
})

const logHistory = computed(() => {
  return logs.value.slice(-5)
})

function addLog(msg) {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false })
  logs.value.push(`[${ts}] ${msg}`)
  if (logs.value.length > 50) logs.value.shift()
}

// Initial hydration using SSR safe ref
const { data, error } = await useFetch('/api/rooms')
if (data.value && data.value.rooms) {
  for (const r of data.value.rooms) {
    rooms.value.set(r.roomId, r)
  }
}

// Client-side WebSockets hook
let ws = null
onMounted(() => {
  addLog(`✅ 已加载 ${rooms.value.size} 个房间`)
  
  if (error.value) {
    addLog(`❌ HTTP 同步错误: ${error.value.message}`)
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
  
  ws.onopen = () => {
    isConnected.value = true
    addLog('🔗 WebSocket 连接已建立')
  }
  
  ws.onmessage = (event) => {
    try {
      const parsedMsg = JSON.parse(event.data)
      if (parsedMsg.type === 'tick' && parsedMsg.room) {
        rooms.value.set(parsedMsg.room.roomId, parsedMsg.room)
      } 
      else if (parsedMsg.type === 'rolling') {
        addLog(`🎲 房间开奖 >> ${parsedMsg.color} ${parsedMsg.animal}`)
      }
    } catch (e) {
      console.error('WS Parse Error', e)
    }
  }
  
  ws.onclose = () => {
    isConnected.value = false
    addLog('⚠️ 连接已断开，等待重连...')
  }
})

onBeforeUnmount(() => {
  if (ws) {
    ws.close()
  }
})
</script>
