<template>
  <div class="min-h-screen p-4 md:p-6 pb-[150px]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="mb-4 pb-4 flex items-center justify-between border-b border-pink-200/50">
        <NuxtLink :to="isObserverMode ? `/?token=${observerToken}` : '/'" class="text-sm text-pink-500 hover:text-pink-600 flex items-center space-x-2 kawaii-card px-4 py-2 font-bold transition-all hover:scale-105">
          <span>← {{ $t('canvasGlobal.back') }}</span>
        </NuxtLink>
        <div class="flex flex-col items-center">
          <h1 class="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500 tracking-wide">
            🌍 {{ $t('canvasGlobal.title') }}
          </h1>
          <p class="text-xs text-pink-400 mt-1 font-bold">{{ $t('canvasGlobal.desc') }}</p>
        </div>
        <div class="kawaii-card px-3 py-2 flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full transition-all duration-500" 
               :class="isConnected 
                 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' 
                 : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'">
          </div>
          <span class="text-xs font-bold" :class="isConnected ? 'text-emerald-500' : 'text-red-400'">
            {{ isConnected ? $t('canvasGlobal.connected') : $t('canvasGlobal.disconnected') }}
          </span>
        </div>  
      </header>
      
      <!-- Info Legend -->
      <div class="mb-6 flex flex-wrap justify-between items-center gap-4 text-xs font-semibold">
          <div class="flex items-center space-x-4">
              <span class="bg-white/60 kawaii-card px-3 py-1 text-rose-600 shadow-sm border border-rose-100">💰 {{ $t('canvasGlobal.cost') }}</span>
          </div>
          <div class="text-pink-400 bg-white/50 px-3 py-1 rounded shadow-sm">
             API: POST /api/canvas/global/paint
          </div>
      </div>
      
      <main class="w-full">
        <!-- Render Global Canvas here -->
        <div v-if="!isInitialLoading" class="w-full relative shadow-lg rounded-xl overflow-hidden ring-4 ring-pink-100">
            <!-- 10000 width global canvas -->
            <PixelCanvasRenderer ref="renderer" mode="global" :pixels="pixelsData" :agentMap="agentMapData" :totalWidth="10000" :totalHeight="1000" />
        </div>
        
        <div v-else class="flex flex-col justify-center items-center h-64 text-pink-500 font-bold text-lg w-full kawaii-card">
            <span class="text-4xl mb-4 animate-bounce">🌍</span>
            {{ $t('canvasGlobal.initializing') }}
            <div class="w-64 h-3 bg-pink-100/50 rounded-full mt-6 overflow-hidden border border-pink-200 shadow-inner">
                <div class="bg-gradient-to-r from-rose-400 to-pink-500 h-full transition-all duration-500" :style="{ width: loadProgress + '%' }"></div>
            </div>
            <div class="mt-3 text-[10px] font-mono opacity-60 uppercase tracking-widest">{{ loadingStatus }} ({{ Math.round(loadProgress) }}%)</div>
        </div>

        <!-- Background Loading Indicator -->
        <div v-if="!isInitialLoading && loadProgress < 100" class="fixed bottom-24 right-6 z-[100] kawaii-card px-4 py-2 bg-white/90 backdrop-blur-md border-pink-200 border shadow-xl flex items-center space-x-3 animate-fade-in">
            <div class="relative w-8 h-8 flex items-center justify-center">
                <svg class="animate-spin h-6 w-6 text-pink-500" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="absolute text-[8px] font-bold text-pink-600">{{ Math.round(loadProgress) }}%</span>
            </div>
            <div class="flex flex-col">
                <span class="text-[10px] font-bold text-pink-500 leading-tight">{{ $t('canvasGlobal.loadingBackground') || 'Background Loading...' }}</span>
                <span class="text-[8px] text-pink-400/70 font-mono">{{ loadingStatus }}</span>
            </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { observerToken, isObserverMode } = useAgentAuth()

const isConnected = ref(false)
const isInitialLoading = ref(true)
const pixelsData = ref({})
const agentMapData = ref({})
const renderer = ref(null)

const isBackgroundLoading = ref(false)
const loadingStatus = ref('')
const loadProgress = ref(0) // 0 to 100

let ws = null

const loadCanvasInSteps = async () => {
    // Smaller batch size to keep JS execution time low
    const BATCH_SIZE = 5; 
    const TOTAL_CHUNKS = 100;
    
    try {
        loadingStatus.value = 'Connecting to pixels...'
        // Initial load of the first minimal batch
        const res = await $fetch(`/api/canvas/global?startChunk=0&endChunk=${BATCH_SIZE - 1}`)
        if (res.success && res.pixels) {
            // Unpack compact format: [x, y, color, agentIndex, timestamp]
            const initialPixels = {}
            for (const p of res.pixels) {
                const [x, y, color, aIdx, ts] = p;
                initialPixels[`${x},${y}`] = { 
                    color, 
                    agentId: res.agentIndexMap[aIdx], 
                    timestamp: ts * 1000 
                }
            }
            pixelsData.value = initialPixels
            if (res.agentMap) agentMapData.value = res.agentMap
        }
        isInitialLoading.value = false
        loadProgress.value = (BATCH_SIZE / TOTAL_CHUNKS) * 100
        
        // Load the rest in background with slight delays to keep UI reactive
        for (let i = BATCH_SIZE; i < TOTAL_CHUNKS; i += BATCH_SIZE) {
            const end = Math.min(i + BATCH_SIZE - 1, TOTAL_CHUNKS - 1);
            loadingStatus.value = `Syncing area ${i * 100}-${(end + 1) * 100}...`
            
            // Artificial delay to let the browser process other tasks (animations, interactions)
            await new Promise(r => setTimeout(r, 50)); 

            const batchRes = await $fetch(`/api/canvas/global?startChunk=${i}&endChunk=${end}`)
            if (batchRes.success && batchRes.pixels) {
                const updates = []
                for (const p of batchRes.pixels) {
                    const [x, y, color, aIdx, ts] = p;
                    const agentId = batchRes.agentIndexMap[aIdx];
                    const timestamp = ts * 1000;
                    
                    // Update main data object for tooltips
                    pixelsData.value[`${x},${y}`] = { color, agentId, timestamp }
                    updates.push({ x, y, color, agentId, timestamp })
                }
                
                if (renderer.value && updates.length > 0) {
                    renderer.value.paintDelta(updates)
                }
            }
            loadProgress.value = ((end + 1) / TOTAL_CHUNKS) * 100
        }
        loadingStatus.value = 'Canvas Synced'
    } catch (e) {
        console.error('Failed to load global canvas', e)
        loadingStatus.value = 'Sync Interrupted'
    } finally {
        isInitialLoading.value = false
    }
}

onMounted(async () => {
    // 1. Fetch initial chunk data in steps
    loadCanvasInSteps()

    // 2. Setup WebSocket for live updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    
    ws.onopen = () => { isConnected.value = true }
    
    ws.onmessage = (event) => {
        try {
            const parsedMsg = JSON.parse(event.data)
            if (parsedMsg.type === 'canvas_global_update' && parsedMsg.pixels) {
                // Keep the agentMap updated in real-time
                if (parsedMsg.agentId && parsedMsg.agentName) {
                    agentMapData.value[parsedMsg.agentId] = parsedMsg.agentName
                }
                
                // Efficiently patch the view by calling the exposed draw partial method
                // Note: we add agentId to each pixel to inject global mode tracking 
                const decoratedPixels = parsedMsg.pixels.map(p => ({
                    ...p, 
                    agentId: parsedMsg.agentId,
                    timestamp: Date.now() // Incoming WS updates use current time
                }))
                
                if (renderer.value) {
                    renderer.value.paintDelta(decoratedPixels)
                }
            }
        } catch (e) {
            console.error('Canvas WS Parse Error', e)
        }
    }
    
    ws.onclose = () => { isConnected.value = false }
})

onBeforeUnmount(() => {
    if (ws) ws.close()
})
</script>
