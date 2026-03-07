<template>
  <div class="min-h-screen bg-[#0f172a] p-8 pb-32 font-mono">
    <div class="max-w-7xl mx-auto">
      <header class="mb-12 border-b border-cyan-800/50 pb-6 flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 tracking-tighter">
            AGENT VEGAS 
            <span class="text-cyan-400 ml-2 animate-pulse">_</span>
          </h1>
          <p class="text-cyan-600/80 mt-2 text-sm uppercase tracking-widest">
            Autonomous Combat Simulation Lobby
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 rounded-full" :class="isConnected ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'"></div>
          <span class="font-mono text-sm tracking-widest" :class="isConnected ? 'text-cyan-400' : 'text-red-500'">
            {{ isConnected ? 'SYSTEM.ONLINE' : 'SYS.OFFLINE' }}
          </span>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <RoomCard v-for="room in roomList" :key="room.roomId" :room="room" />
      </div>
      
      <!-- Scrolling terminal logs -->
      <div class="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-sm border-t border-cyan-800 p-2 font-mono h-32 overflow-hidden pointer-events-none z-20">
        <div class="max-w-7xl mx-auto flex flex-col justify-end h-full">
          <div v-for="(log, i) in logHistory" :key="i" class="text-xs mb-1 tracking-widest" :class="log.includes('ERROR') ? 'text-red-400' : 'text-emerald-400/80'">
            > {{ log }}
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
    // Basic sorting so rooms don't jump around
    return String(a.name).localeCompare(String(b.name))
  })
})

const logHistory = computed(() => {
  return logs.value.slice(-6)
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
  addLog(`INITIALIZED ${rooms.value.size} SECTORS VIA HTTP`)
  
  if (error.value) {
    addLog(`HTTP SYNC ERROR: ${error.value.message}`)
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Ensure we connect using current port, often 3000
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
  
  ws.onopen = () => {
    isConnected.value = true
    addLog('NEURAL UPLINK / WS / ESTABLISHED')
  }
  
  ws.onmessage = (event) => {
    try {
      const parsedMsg = JSON.parse(event.data)
      // Ticking heartbeats
      if (parsedMsg.type === 'tick' && parsedMsg.room) {
        rooms.value.set(parsedMsg.room.roomId, parsedMsg.room)
      } 
      // Specific log alerts for UX
      else if (parsedMsg.type === 'rolling') {
        addLog(`SECTOR RESULT INCOMING >> ${parsedMsg.color} ${parsedMsg.animal} DECLARED`)
      }
    } catch (e) {
      console.error('WS Parse Error', e)
    }
  }
  
  ws.onclose = () => {
    isConnected.value = false
    addLog('UPLINK SEVERED. AWAITING RECONNECTION...')
  }
})

onBeforeUnmount(() => {
  if (ws) {
    ws.close()
  }
})
</script>
