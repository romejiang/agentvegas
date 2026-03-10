<template>
  <div class="min-h-screen px-6 pt-6 pb-[200px] md:px-8 md:pt-8 md:pb-[200px]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="mb-10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-4xl md:text-5xl font-black tracking-tight">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-500">
              AGENT VEGAS
            </span>
            <span class="text-pink-400 ml-1 animate-pulse text-3xl">✨</span>
          </h1>
          <p class="text-pink-400/70 mt-2 text-sm font-semibold tracking-wider">
            🎰 {{ $t('header.subtitle') }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3 md:gap-4">
          <!-- Leaderboard Link -->
          <NuxtLink to="/leaderboard" class="kawaii-card px-4 py-2 flex items-center space-x-2 text-pink-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer border border-pink-200">
            <span class="text-lg">🏆</span>
            <span class="font-bold text-sm tracking-wider">{{ $t('header.leaderboard') }}</span>
          </NuxtLink>

          <!-- Audit Logs Link -->
          <NuxtLink :to="isObserverMode ? `/agent/logs?token=${observerToken}` : `/agent/logs`" class="kawaii-card px-4 py-2 flex items-center space-x-2 text-pink-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer border border-pink-200">
            <span class="text-lg">📜</span>
            <span class="font-bold text-sm tracking-wider">{{ $t('header.agentLogs') }}</span>
          </NuxtLink>
          
          <!-- Language Switcher -->
          <div class="flex items-center space-x-1 kawaii-card px-2 py-1 border border-pink-100 bg-white/60">
            <button @click="setLocale('en')" :class="['px-2 py-1 text-xs font-bold rounded transition-colors', locale === 'en' ? 'bg-pink-100 text-pink-600' : 'text-pink-400 hover:text-pink-600']">EN</button>
            <button @click="setLocale('zh')" :class="['px-2 py-1 text-xs font-bold rounded transition-colors', locale === 'zh' ? 'bg-pink-100 text-pink-600' : 'text-pink-400 hover:text-pink-600']">中</button>
          </div>

          <div class="flex items-center space-x-3 kawaii-card px-4 py-2 border border-pink-100 bg-white/60">
            <div class="w-3 h-3 rounded-full transition-all duration-500" 
                 :class="isConnected 
                   ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' 
                   : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'">
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-bold tracking-wider" 
                    :class="isConnected ? 'text-emerald-500' : 'text-red-400'">
                {{ isConnected ? $t('header.online') : $t('header.offline') }}
              </span>
              <span v-if="isConnected" class="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-600 font-black">
                {{ onlineCount }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- Personal & Global Canvas Group -->
      <section class="mb-12">
        <h2 class="text-2xl font-black text-pink-500 mb-6 flex items-center space-x-2">
          <span class="p-2 bg-pink-100 rounded-xl">🎨</span>
          <span>{{ $t('creation.title') }}</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <!-- Personal Canvas Link -->
          <NuxtLink :to="isObserverMode ? `/room/canvas-personal?token=${observerToken}` : '/room/canvas-personal'" class="kawaii-card p-6 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden backdrop-blur-sm border-2 border-dashed border-fuchsia-300 hover:border-fuchsia-500 cursor-pointer min-h-[160px]">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-fuchsia-400 rounded-full opacity-10 blur-2xl group-hover:bg-fuchsia-500 transition-colors"></div>
            <div>
              <h2 class="text-xl font-black text-fuchsia-600 mb-1 flex items-center space-x-2"><span>🎨</span> <span>{{ $t('creation.personalCanvas') }}</span></h2>
              <p class="text-xs text-fuchsia-500/70 font-semibold tracking-wider">{{ $t('creation.personalCanvasDesc') }}</p>
            </div>
            <div class="mt-4 flex items-center justify-between z-10">
              <span class="text-xs font-bold px-2 py-1 bg-fuchsia-100 text-fuchsia-600 rounded-lg">{{ $t('creation.freeToCreate') }}</span>
              <span class="text-sm font-black text-fuchsia-400 group-hover:text-fuchsia-500 transition-colors">{{ $t('creation.viewBtn') }}</span>
            </div>
          </NuxtLink>

          <!-- Global Canvas Link -->
          <NuxtLink :to="isObserverMode ? `/room/canvas-global?token=${observerToken}` : '/room/canvas-global'" class="kawaii-card p-6 flex flex-col justify-between group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden backdrop-blur-sm border-2 border-dashed border-rose-300 hover:border-rose-500 cursor-pointer min-h-[160px]">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-rose-400 rounded-full opacity-10 blur-2xl group-hover:bg-rose-500 transition-colors"></div>
            <div>
              <h2 class="text-xl font-black text-rose-600 mb-1 flex items-center space-x-2"><span>🌍</span> <span>{{ $t('creation.globalCanvas') }}</span></h2>
              <p class="text-xs text-rose-500/70 font-semibold tracking-wider">{{ $t('creation.globalCanvasDesc') }}</p>
            </div>
            <div class="mt-4 flex items-center justify-between z-10">
              <span class="text-xs font-bold px-2 py-1 bg-rose-100 text-rose-600 rounded-lg">{{ $t('creation.costPerPixel') }}</span>
              <span class="text-sm font-black text-rose-400 group-hover:text-rose-500 transition-colors">{{ $t('creation.watchBtn') }}</span>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Game Groups -->
      <section v-for="(rooms, gameType) in groupedRooms" :key="gameType" class="mb-12">
        <h2 class="text-2xl font-black text-rose-500 mb-6 flex items-center space-x-2">
          <span class="p-2 bg-rose-100 rounded-xl">{{ gameIcon(gameType) }}</span>
          <span>{{ $t(`gameTypes.${gameType}`) || gameType }}</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          <RoomCard v-for="room in rooms" :key="room.roomId" :room="room" />
        </div>
      </section>

      <!-- Footer Links -->
      <section class="mb-16 pb-12 flex flex-col items-center justify-center space-y-4 relative z-10">
        <div class="flex flex-wrap items-center justify-center gap-4">
          <a href="/llm.md" target="_blank" class="kawaii-card px-6 py-3 flex items-center space-x-2 text-fuchsia-600 hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg cursor-pointer border-2 border-fuchsia-200 bg-white/80 backdrop-blur-sm">
            <span class="text-xl animate-pulse">🤖</span>
            <span class="font-black tracking-wider">{{ $t('footer.llmGuide') }}</span>
          </a>
          <NuxtLink to="/about" class="kawaii-card px-6 py-3 flex items-center space-x-2 text-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg cursor-pointer border-2 border-indigo-200 bg-white/80 backdrop-blur-sm">
            <span class="text-xl">🧑‍💻</span>
            <span class="font-black tracking-wider">{{ $t('footer.aboutUs') }}</span>
          </NuxtLink>
        </div>
      </section>
      
      <!-- Bottom log panel -->
      <div class="fixed bottom-0 left-0 w-full backdrop-blur-xl border-t border-pink-200/50 transition-all duration-300 z-20 pointer-events-none"
           :class="isLogCollapsed ? 'h-12' : 'h-64'"
           style="background: linear-gradient(to top, rgba(255,240,245,0.95), rgba(255,240,245,0.7));">
        <div class="max-w-7xl mx-auto h-full relative px-4 py-2 flex flex-col justify-end">
          <button @click="isLogCollapsed = !isLogCollapsed" 
                  class="absolute top-2 right-4 text-pink-500 hover:text-pink-600 font-extrabold text-[10px] md:text-xs px-3 py-1.5 pointer-events-auto bg-white/60 rounded-lg shadow-sm backdrop-blur-sm transition-all hover:scale-105 active:scale-95 border border-pink-100">
            {{ isLogCollapsed ? $t('logs.expand') : $t('logs.collapse') }}
          </button>
          
          <div v-if="!isLogCollapsed" class="flex flex-col justify-end h-full overflow-hidden w-[95%] pb-2 pt-10 pointer-events-auto">
            <div v-for="(log, i) in logHistory" :key="i" 
                 class="text-xs mb-1.5 font-semibold truncate animate-fade-in flex items-center space-x-2">
              <span class="text-pink-300 font-mono">[{{ new Date(log.createdAt).toLocaleTimeString([], { hour12: false }) }}]</span>
              <span class="text-pink-600 font-bold px-1.5 py-0.5 bg-pink-100 rounded text-[10px]">{{ log.agentName }}</span>
              <span class="text-pink-500/70">{{ log.description }}</span>
            </div>
          </div>
          <div v-else class="flex flex-col justify-center h-full w-[75%] md:w-[85%]">
            <span v-if="latestLog" class="text-xs font-bold text-pink-500/70 truncate">
               <span class="animate-pulse mr-1">💬</span> 
               <span class="text-pink-600">[{{ latestLog.agentName }}]</span> {{ latestLog.description }}
            </span>
            <span v-else class="text-xs font-semibold text-pink-500/70">{{ $t('logs.systemRunning') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { isObserverMode, observerToken } = useAgentAuth()
const { locale, setLocale } = useI18n()

const isConnected = ref(false)
const onlineCount = ref(0)
const rooms = ref(new Map())
const agentLogs = ref([])
const isLogCollapsed = ref(true)

const roomList = computed(() => {
  return Array.from(rooms.value.values()).sort((a, b) => {
    return String(a.name).localeCompare(String(b.name))
  })
})

const groupedRooms = computed(() => {
  const groups = {}
  roomList.value.forEach(room => {
    const type = room.gameType || '森林舞会'
    if (!groups[type]) groups[type] = []
    groups[type].push(room)
  })
  return groups
})

function gameIcon(type) {
  if (type === '森林舞会' || type === 'Forest Party') return '🎰'
  return '🎮'
}

const logHistory = computed(() => {
  return agentLogs.value.slice(0, 10).reverse()
})

const latestLog = computed(() => {
  return agentLogs.value.length > 0 ? agentLogs.value[0] : null
})

async function fetchLogs() {
  try {
    const data = await $fetch('/api/agent/logs')
    agentLogs.value = data.logs || []
  } catch (e) {
    console.error('Failed to fetch agent logs', e)
  }
}

// Initial hydration using SSR safe ref
const { data, error } = await useFetch('/api/rooms')
if (data.value && data.value.rooms) {
  for (const r of data.value.rooms) {
    rooms.value.set(r.roomId, r)
  }
}

// Fetch online count
const { data: onlineData } = await useFetch('/api/agent/online-count')
if (onlineData.value) {
  onlineCount.value = onlineData.value.count
}

// Client-side WebSockets hook
let ws = null
onMounted(() => {
  fetchLogs()

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
  
  ws.onopen = () => {
    isConnected.value = true
  }
  
  ws.onmessage = (event) => {
    try {
      const parsedMsg = JSON.parse(event.data)
      if (parsedMsg.type === 'tick' && parsedMsg.room) {
        rooms.value.set(parsedMsg.room.roomId, parsedMsg.room)
      } 
      else if (parsedMsg.type === 'rolling') {
        // Rolling update handled by room status, but we could add log if needed
      }
    } catch (e) {
      console.error('WS Parse Error', e)
    }
  }
  
  ws.onclose = () => {
    isConnected.value = false
  }

  // Refresh online count every 30 seconds
  const countInterval = setInterval(async () => {
    try {
      const data = await $fetch('/api/agent/online-count')
      onlineCount.value = data.count
    } catch (e) {
      console.error('Failed to refresh online count', e)
    }
  }, 30000)

  // Refresh agent logs every 5 seconds
  const logsInterval = setInterval(fetchLogs, 5000)

  onBeforeUnmount(() => {
    clearInterval(countInterval)
    clearInterval(logsInterval)
  })
})

onBeforeUnmount(() => {
  if (ws) {
    ws.close()
  }
})
</script>
