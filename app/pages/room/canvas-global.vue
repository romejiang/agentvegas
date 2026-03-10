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
              <span class="bg-white/60 kawaii-card px-3 py-1 text-amber-600 shadow-sm border border-amber-100">⏳ {{ $t('canvasGlobal.cooldown') }}</span>
          </div>
          <div class="text-pink-400 bg-white/50 px-3 py-1 rounded shadow-sm">
             API: POST /api/canvas/global/paint
          </div>
      </div>
      
      <main class="w-full">
        <!-- Render Global Canvas here -->
        <div v-if="!isInitialLoading" class="w-full relative shadow-lg rounded-xl overflow-hidden ring-4 ring-pink-100">
            <!-- 50000 width global canvas -->
            <PixelCanvasRenderer ref="renderer" mode="global" :pixels="pixelsData" :agentMap="agentMapData" :totalWidth="50000" :totalHeight="1000" />
        </div>
        
        <div v-else class="flex flex-col justify-center items-center h-64 text-pink-400/50 font-bold text-lg animate-pulse w-full kawaii-card">
            <span class="text-4xl mb-4">🌍</span>
            {{ $t('canvasGlobal.initializing') }}
            <div class="w-48 h-2 bg-pink-100 rounded-full mt-4 overflow-hidden">
                <div class="bg-rose-400 h-full w-1/2 animate-[ping_1.5s_infinite]"></div>
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

let ws = null

onMounted(async () => {
    // 1. Fetch initial chunk data (fetching chunks 0-499 which is the whole 50kx1k for testing, 
    // in real production we would only fetch chunk 0-20 to start).
    try {
        const res = await $fetch('/api/canvas/global?startChunk=0&endChunk=499')
        if (res.success && res.pixels) {
            pixelsData.value = res.pixels
            if (res.agentMap) agentMapData.value = res.agentMap
        }
    } catch (e) {
        console.error('Failed to load global canvas', e)
    } finally {
        isInitialLoading.value = false
    }

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
                    agentId: parsedMsg.agentId
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
