<template>
  <div class="min-h-screen bg-[#0f1015] p-6 font-mono text-cyan-50">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <header class="mb-8 border-b border-cyan-800/50 pb-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1">
          <span>&lt;&lt; RETURN TO LOBBY</span>
        </NuxtLink>
        <div v-if="room" class="flex flex-col items-center">
          <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 tracking-widest uppercase">
            {{ room.name }}
          </h1>
          <div class="text-xs text-slate-400 tracking-[0.2em] mt-1 shadow-fuchsia-500/50 drop-shadow-md">
            SECTOR STATUS: 
            <span :class="{
              'text-emerald-400': room.status === 'betting',
              'text-yellow-400 animate-pulse': room.status === 'rolling',
              'text-red-400': room.status === 'finished'
            }">{{ room.status.toUpperCase() }}</span>
          </div>
        </div>
        <div class="w-3 h-3 rounded-full" :class="isConnected ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'"></div>
      </header>

      <main v-if="room" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- Left: The Visualizer (Roulette Wheel) -->
        <div class="bg-slate-900/60 p-8 rounded-2xl border border-cyan-900/50 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] shadow-[0_0_30px_rgba(8,145,178,0.1)]">
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-fuchsia-500/5 pointer-events-none"></div>
          
          <!-- Countdown Timer overlay -->
          <div class="absolute top-4 left-4 text-4xl font-extrabold" :class="{
            'text-emerald-500/80': room.status === 'betting',
            'text-yellow-500/80': room.status === 'rolling',
            'text-red-500/80': room.status === 'finished'
          }">
            {{ room.timer }}<span class="text-sm">s</span>
          </div>
          
          <!-- Target Display -->
          <div class="relative w-72 h-72 border-2 border-slate-700/50 rounded-full flex items-center justify-center
                      shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-slate-950/80 z-10 transition-all duration-300">
            <!-- Animals positioned around circle -->
            <div v-for="(slot, i) in slots" :key="i"
                 class="absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg transition-all duration-[30ms]"
                 :style="getSlotStyle(i)"
                 :class="[
                   getSlotColorClass(slot.color),
                   activeIndex === i ? 'scale-125 z-20 ' + getActiveSlotGlow(slot.color) : 'opacity-60 grayscale-[30%]'
                 ]">
              {{ slot.animal }}
            </div>
            
            <!-- Center Result Text -->
            <div class="flex flex-col items-center justify-center text-center animate-fade-in" v-if="room.status === 'finished' && room.winningAnimal">
              <span class="text-sm text-slate-400 tracking-widest mb-1">WINNER</span>
              <span class="text-4xl font-extrabold tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" :class="getTextColorClass(room.winningColor)">
                {{ room.winningColor }}{{ room.winningAnimal }}
              </span>
              <span class="text-xs text-fuchsia-400 mt-2 tracking-[0.3em]">RECORD SAVED</span>
            </div>
            <div class="flex flex-col items-center justify-center" v-else-if="room.status === 'rolling'">
              <span class="text-xs text-yellow-500 animate-pulse tracking-widest font-bold">SPINNING...</span>
            </div>
            <div class="flex flex-col items-center justify-center" v-else>
              <span class="text-xs text-emerald-500 tracking-widest font-bold">AWAITING BETS</span>
            </div>
          </div>
        </div>
        
        <!-- Right: Odds Betting Interface -->
        <div class="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 w-full relative">
          <h2 class="text-xs text-cyan-500 tracking-widest mb-6 font-semibold border-b border-cyan-900 pb-2">BETTING MATRIX 3x4</h2>
          
          <div class="flex flex-col space-y-4">
            
            <!-- Red Row -->
            <div class="grid grid-cols-4 gap-3">
              <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'红_'+animal"
                   class="flex flex-col p-2 rounded items-center justify-center border transition-all hover:brightness-125 cursor-pointer
                          bg-red-950/40 border-red-900/80 text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]"
                   :class="[room?.status === 'finished' && room?.winningAnimal === animal && room?.winningColor === '红' ? 'animate-pulse ring-2 ring-red-400 shadow-[0_0_20px_rgba(248,113,113,0.8)] bg-red-800/80 scale-105 z-10 text-white' : '']">
                <span class="text-xs mb-1 font-bold">{{ animal }}</span>
                <span class="text-[10px] text-red-300 opacity-60 uppercase tracking-wider">Red</span>
                <span class="mt-2 text-sm font-bold bg-slate-950/50 px-2 py-0.5 rounded w-full text-center">x{{ room?.oddsMap?.[`${animal}_红`] || '--' }}</span>
              </div>
            </div>
            
            <!-- Green Row -->
            <div class="grid grid-cols-4 gap-3">
              <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'绿_'+animal"
                   class="flex flex-col p-2 rounded items-center justify-center border transition-all hover:brightness-125 cursor-pointer
                          bg-green-950/40 border-green-900/80 text-green-500 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]"
                   :class="[room?.status === 'finished' && room?.winningAnimal === animal && room?.winningColor === '绿' ? 'animate-pulse ring-2 ring-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] bg-green-800/80 scale-105 z-10 text-white' : '']">
                <span class="text-xs mb-1 font-bold">{{ animal }}</span>
                <span class="text-[10px] text-green-300 opacity-60 uppercase tracking-wider">Green</span>
                <span class="mt-2 text-sm font-bold bg-slate-950/50 px-2 py-0.5 rounded w-full text-center">x{{ room?.oddsMap?.[`${animal}_绿`] || '--' }}</span>
              </div>
            </div>
            
            <!-- Yellow Row -->
            <div class="grid grid-cols-4 gap-3">
              <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'黄_'+animal"
                   class="flex flex-col p-2 rounded items-center justify-center border transition-all hover:brightness-125 cursor-pointer
                          bg-yellow-950/40 border-yellow-900/80 text-yellow-500 shadow-[inset_0_0_10px_rgba(234,179,8,0.1)]"
                   :class="[room?.status === 'finished' && room?.winningAnimal === animal && room?.winningColor === '黄' ? 'animate-pulse ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] bg-yellow-800/80 scale-105 z-10 text-white' : '']">
                <span class="text-xs mb-1 font-bold">{{ animal }}</span>
                <span class="text-[10px] text-yellow-300 opacity-60 uppercase tracking-wider">Yellow</span>
                <span class="mt-2 text-sm font-bold bg-slate-950/50 px-2 py-0.5 rounded w-full text-center">x{{ room?.oddsMap?.[`${animal}_黄`] || '--' }}</span>
              </div>
            </div>

          </div>
          
          <!-- Fake Place Bet Action -->
          <div class="mt-8 border-t border-slate-700/50 pt-6">
             <div class="text-xs text-slate-500 mb-2 truncate">>> Agent execution requires POST /api/game/bet</div>
          </div>
        </div>
      </main>
      
      <div v-else class="flex justify-center items-center h-64 text-cyan-500/50 animate-pulse">
        [ CONNECTING TO STREAM... ]
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const roomId = route.params.id

const isConnected = ref(false)
const room = ref(null)
const activeIndex = ref(-1)

// Generate the 12 slots for the wheel: 3 colors x 4 animals
const COLORS = ['红', '绿', '黄']
const ANIMALS = ['狮子', '熊猫', '猴子', '兔子']
// Simple deterministic random generator based on a string seed
function seedRandom(seed) {
  let x = 0;
  for (let i = 0; i < seed.length; i++) {
    x = (x + seed.charCodeAt(i)) * 31 & 0xFFFFFFFF;
  }
  return function() {
    x = (x * 1103515245 + 12345) & 0x7FFFFFFF;
    return x / 0x7FFFFFFF;
  }
}

const slots = computed(() => {
  const arr = []
  // Pattern to interleave colors and animals
  for (let a of ANIMALS) {
    for (let c of COLORS) {
      arr.push({ animal: a, color: c })
    }
  }
  // Deterministic shuffle based on roomId
  if (!roomId) return arr;
  const rng = seedRandom(roomId.toString())
  return arr.sort(() => rng() - 0.5)
})
// Fix the slots layout so they don't jump per tick
const fixedSlots = ref(null)

function getSlotStyle(i) {
  const R = 150 // Radius
  const angle = (i * (360 / 12)) * (Math.PI / 180) - (Math.PI / 2)
  const x = R * Math.cos(angle)
  const y = R * Math.sin(angle)
  return {
    top: `50%`,
    left: `50%`,
    transform: `translate(${x}px, ${y}px) rotate(${angle + Math.PI/2}rad)`
  }
}

function getSlotColorClass(color) {
  if (color === '红') return 'bg-red-950/80 border-red-500 text-red-400'
  if (color === '绿') return 'bg-green-950/80 border-green-500 text-green-400'
  if (color === '黄') return 'bg-yellow-950/80 border-yellow-500 text-yellow-400'
  return ''
}
function getTextColorClass(color) {
  if (color === '红') return 'text-red-500'
  if (color === '绿') return 'text-green-500'
  if (color === '黄') return 'text-yellow-500'
  return ''
}
function getActiveSlotGlow(color) {
  if (color === '红') return 'shadow-[0_0_20px_rgba(239,68,68,1)] border-white scale-[1.3]'
  if (color === '绿') return 'shadow-[0_0_20px_rgba(34,197,94,1)] border-white scale-[1.3]'
  if (color === '黄') return 'shadow-[0_0_20px_rgba(234,179,8,1)] border-white scale-[1.3]'
  return ''
}

// Initial fetch
const { data, error } = await useFetch('/api/rooms')
if (data.value && data.value.rooms) {
  const found = data.value.rooms.find(r => r.roomId === roomId)
  if (found) room.value = found
}

// Fixed slots memory so it doesn't shuffle on reactive ticks
onMounted(() => {
  fixedSlots.value = slots.value
})

let ws = null
let spinInterval = null

onMounted(() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
  
  ws.onopen = () => { isConnected.value = true }
  
  ws.onmessage = (event) => {
    try {
      const parsedMsg = JSON.parse(event.data)
      if (parsedMsg.type === 'tick' && parsedMsg.room && parsedMsg.room.roomId === roomId) {
        // Sync full room heartbeat
        Object.assign(room.value, parsedMsg.room)
      } else if (parsedMsg.type === 'rolling' && room.value && room.value.roomId === parsedMsg.roomId) {
        // We know the winner arrived via tick later, but we can do things on exact roll
      }
    } catch (e) { }
  }
  
  ws.onclose = () => { isConnected.value = false }
})

// Spin visualizer logic
watch(() => room.value?.status, (newStatus) => {
  if (newStatus === 'rolling') {
    // High speed spin 20s
    if (spinInterval) clearInterval(spinInterval)
    let speed = 50
    const startSpin = () => {
      activeIndex.value = (activeIndex.value + 1) % 12
    }
    spinInterval = setInterval(startSpin, speed)
    // We could slow it down towards the end but for now just spin fast
  } else if (newStatus === 'finished') {
    if (spinInterval) {
      clearInterval(spinInterval)
      spinInterval = null
    }
    // Snap to the winning animal
    if (room.value.winningAnimal && room.value.winningColor && fixedSlots.value) {
      const idx = fixedSlots.value.findIndex(s => s.animal === room.value.winningAnimal && s.color === room.value.winningColor)
      if (idx !== -1) activeIndex.value = idx
    }
  } else {
    // Betting mode
    if (spinInterval) {
      clearInterval(spinInterval)
      spinInterval = null
    }
    activeIndex.value = -1 // No highlight
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (ws) ws.close()
  if (spinInterval) clearInterval(spinInterval)
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
