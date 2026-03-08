<template>
  <div class="min-h-screen p-4 md:p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <header class="mb-8 pb-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-sm text-pink-500 hover:text-pink-600 flex items-center space-x-2 kawaii-card px-4 py-2 font-bold transition-all hover:scale-105">
          <span>← 返回大厅</span>
        </NuxtLink>
        <div v-if="room" class="flex flex-col items-center">
          <h1 class="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-500 tracking-wide">
            {{ room.name }}
          </h1>
          <div class="text-xs text-pink-400 tracking-wider mt-1 font-bold flex items-center space-x-2">
            <span>状态:</span>
            <span class="status-badge"
              :class="{
                'status-betting': room.status === 'betting',
                'status-rolling': room.status === 'rolling',
                'status-finished': room.status === 'finished'
              }">
              {{ statusText }}
            </span>
          </div>
        </div>
        <div class="kawaii-card px-3 py-2 flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full transition-all duration-500" 
               :class="isConnected 
                 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' 
                 : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'">
          </div>
          <span class="text-xs font-bold" :class="isConnected ? 'text-emerald-500' : 'text-red-400'">
            {{ isConnected ? '在线' : '离线' }}
          </span>
        </div>        
      </header>

      <main v-if="room" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Left: The Visualizer (Roulette Wheel) -->
        <div class="kawaii-card p-6 md:p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
          <!-- Soft ambient gradient -->
          <div class="absolute inset-0 pointer-events-none" 
               style="background: radial-gradient(circle at 30% 30%, rgba(255,182,193,0.15), transparent 60%), radial-gradient(circle at 70% 70%, rgba(186,147,255,0.1), transparent 60%);"></div>
          
          <!-- Countdown Timer overlay -->
          <div class="absolute top-5 left-5 flex items-center space-x-2">
            <span class="text-4xl font-black" :class="{
              'text-emerald-500': room.status === 'betting',
              'text-amber-500': room.status === 'rolling',
              'text-pink-500': room.status === 'finished'
            }">
              {{ room.timer }}
            </span>
            <span class="text-sm font-bold text-pink-300">秒</span>
          </div>

          <!-- Target Display -->
          <div class="relative w-56 h-56 md:w-[260px] md:h-[260px] flex items-center justify-center z-10">
            <!-- Rotating Wheel Base and Animals -->
            <div class="absolute inset-0 rounded-full transition-all duration-300"
                 style="background: linear-gradient(135deg, rgba(255,240,245,0.8), rgba(255,228,237,0.6)); border: 3px solid rgba(255,182,193,0.5); box-shadow: inset 0 0 30px rgba(255,182,193,0.2), 0 8px 32px rgba(255,105,180,0.15);"
                 :class="{ 'animate-slow-spin': room?.status === 'rolling' && spinDirection === 1, 'animate-slow-spin-reverse': room?.status === 'rolling' && spinDirection === -1 }">
              
              <!-- Animals positioned around circle -->
              <div v-for="(slot, i) in slots" :key="i"
                   class="absolute w-16 h-16 -ml-8 -mt-8 transition-all duration-150"
                   :style="getSlotStyle(i)"
                   :class="activeIndex === i ? 'z-40' : 'z-10'">
                <img :src="getFullBodyIcon(slot.animal, slot.color)" :alt="slot.animal" 
                     class="w-full h-full object-contain transition-all duration-[100ms] ease-out"
                     :class="[
                       activeIndex === i ? 'scale-150 drop-shadow-[0_0_30px_rgba(255,255,255,1)] brightness-125 saturate-150' : 'scale-[0.85] brightness-[0.85] opacity-90 drop-shadow-md'
                     ]" />
              </div>
            </div>
            
            <!-- Center Result Text -->
            <div class="relative z-30 flex flex-col items-center justify-center text-center animate-bounce-in bg-white/30 backdrop-blur-sm rounded-full w-36 h-36 shadow-inner border border-white/40" v-if="room.status === 'finished' && room.winningAnimal">
              <span class="text-xs text-pink-500 tracking-wider mb-1 font-extrabold">🏆 赢家</span>
              <span class="text-3xl md:text-3xl font-black drop-shadow-lg" :class="getTextColorClass(room.winningColor)">
                {{ room.winningColor }}{{ room.winningAnimal }}
              </span>
              <span class="text-[10px] text-fuchsia-500 mt-2 tracking-wider font-bold sparkle">✨ 已记录</span>
            </div>
            <div class="relative z-30 flex flex-col items-center justify-center bg-white/30 backdrop-blur-sm rounded-full w-24 h-24 border border-white/20" v-else-if="room.status === 'rolling'">
              <span class="text-sm text-amber-600 font-extrabold tracking-wider animate-pulse">🎰 旋转中</span>
            </div>
            <div class="relative z-30 flex flex-col items-center justify-center" v-else>
              <span class="text-sm text-emerald-600 tracking-wider font-extrabold bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm">💰 等待投注</span>
            </div>
          </div>
        </div>
        
        <!-- Right: Odds Betting Interface -->
        <div class="kawaii-card p-5 md:p-6 w-full relative">
          <h2 class="text-xs text-pink-500 tracking-wider mb-5 font-extrabold pb-2 border-b border-pink-200/50 flex items-center space-x-2">
            <span>📊</span>
            <span>投注矩阵 3×4</span>
          </h2>
          
          <div class="flex flex-col space-y-4">
            
            <!-- Red Row -->
            <div>
              <div class="text-[10px] font-bold text-red-400 mb-1.5 tracking-wider">🔴 红色</div>
              <div class="grid grid-cols-4 gap-2.5">
                <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'红_'+animal"
                     class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
                     :class="[room?.status === 'finished' && room?.winningAnimal === animal && room?.winningColor === '红' ? 'scale-110 z-10 animate-pulse drop-shadow-[0_0_15px_rgba(248,113,113,0.8)]' : '']">
                  <img :src="getAnimalIcon(animal, '红')" :alt="animal" class="w-16 h-16 object-contain drop-shadow-md" />
                  <span class="mt-1.5 text-sm font-extrabold bg-white/60 px-2 py-0.5 rounded-lg w-full text-center text-pink-600 shadow-sm">
                    x{{ room?.oddsMap?.[`${animal}_红`] || '--' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Green Row -->
            <div>
              <div class="text-[10px] font-bold text-emerald-500 mb-1.5 tracking-wider">🟢 绿色</div>
              <div class="grid grid-cols-4 gap-2.5">
                <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'绿_'+animal"
                     class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
                     :class="[room?.status === 'finished' && room?.winningAnimal === animal && room?.winningColor === '绿' ? 'scale-110 z-10 animate-pulse drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]' : '']">
                  <img :src="getAnimalIcon(animal, '绿')" :alt="animal" class="w-16 h-16 object-contain drop-shadow-md" />
                  <span class="mt-1.5 text-sm font-extrabold bg-white/60 px-2 py-0.5 rounded-lg w-full text-center text-pink-600 shadow-sm">
                    x{{ room?.oddsMap?.[`${animal}_绿`] || '--' }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Yellow Row -->
            <div>
              <div class="text-[10px] font-bold text-amber-500 mb-1.5 tracking-wider">🟡 黄色</div>
              <div class="grid grid-cols-4 gap-2.5">
                <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'黄_'+animal"
                     class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
                     :class="[room?.status === 'finished' && room?.winningAnimal === animal && room?.winningColor === '黄' ? 'scale-110 z-10 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : '']">
                  <img :src="getAnimalIcon(animal, '黄')" :alt="animal" class="w-16 h-16 object-contain drop-shadow-md" />
                  <span class="mt-1.5 text-sm font-extrabold bg-white/60 px-2 py-0.5 rounded-lg w-full text-center text-pink-600 shadow-sm">
                    x{{ room?.oddsMap?.[`${animal}_黄`] || '--' }}
                  </span>
                </div>
              </div>
            </div>

          </div>
          
          <!-- Bottom Action -->
          <div class="mt-6 border-t border-pink-200/50 pt-4">
             <div class="text-xs text-pink-400/60 font-semibold">💡 Agent 投注接口: POST /api/game/bet</div>
          </div>
        </div>
      </main>
      
      <div v-else class="flex justify-center items-center h-64 text-pink-400/50 font-bold text-lg">
        <span class="animate-pulse">🎮 连接中...</span>
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
const spinDirection = ref(1)

// Generate the 12 slots for the wheel: 3 colors x 4 animals
const COLORS = ['红', '绿', '黄']
const ANIMALS = ['狮子', '熊猫', '猴子', '兔子']

// Animal name to icon filename mapping
const ANIMAL_NAME_MAP = { '狮子': 'lion', '熊猫': 'panda', '猴子': 'monkey', '兔子': 'rabbit' }
const COLOR_NAME_MAP = { '红': 'red', '绿': 'green', '黄': 'yellow' }

function getAnimalIcon(animal, color) {
  const a = ANIMAL_NAME_MAP[animal]
  const c = COLOR_NAME_MAP[color]
  return a && c ? `/icons/${a}-${c}.png` : ''
}

function getFullBodyIcon(animal, color) {
  const a = ANIMAL_NAME_MAP[animal]
  const c = COLOR_NAME_MAP[color]
  return a && c ? `/animals/${a}-${c}.png` : ''
}

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

const statusText = computed(() => {
  const map = {
    'betting': '投注中',
    'rolling': '开奖中',
    'finished': '已结束'
  }
  return map[room.value?.status] || '未知'
})

const slots = computed(() => {
  const arr = []
  for (let a of ANIMALS) {
    for (let c of COLORS) {
      arr.push({ animal: a, color: c })
    }
  }
  if (!roomId) return arr;
  const rng = seedRandom(roomId.toString())
  return arr.sort(() => rng() - 0.5)
})

const fixedSlots = ref(null)

function getSlotStyle(i) {
  const R = 158
  const angle = (i * (360 / 12)) * (Math.PI / 180) - (Math.PI / 2)
  const x = R * Math.cos(angle)
  const y = R * Math.sin(angle)
  return {
    top: `50%`,
    left: `50%`,
    transform: `translate(${x}px, ${y}px) rotate(${angle + Math.PI/2}rad)`
  }
}

function getTextColorClass(color) {
  if (color === '红') return 'text-red-500'
  if (color === '绿') return 'text-emerald-500'
  if (color === '黄') return 'text-amber-500'
  return ''
}

// Initial fetch
const { data, error } = await useFetch('/api/rooms')
if (data.value && data.value.rooms) {
  const found = data.value.rooms.find(r => r.roomId === roomId)
  if (found) room.value = found
}

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
        Object.assign(room.value, parsedMsg.room)
      } else if (parsedMsg.type === 'rolling' && room.value && room.value.roomId === parsedMsg.roomId) {
      }
    } catch (e) { }
  }
  
  ws.onclose = () => { isConnected.value = false }
})

// Spin visualizer logic
watch(() => room.value?.status, (newStatus) => {
  if (newStatus === 'rolling') {
    spinDirection.value = Math.random() > 0.5 ? 1 : -1
    if (spinInterval) clearInterval(spinInterval)
    let speed = 65 // slowed down by ~30% from 50
    const startSpin = () => {
      activeIndex.value = (activeIndex.value + 1) % 12
    }
    spinInterval = setInterval(startSpin, speed)
  } else if (newStatus === 'finished') {
    if (spinInterval) {
      clearInterval(spinInterval)
      spinInterval = null
    }
    if (room.value.winningAnimal && room.value.winningColor && fixedSlots.value) {
      const idx = fixedSlots.value.findIndex(s => s.animal === room.value.winningAnimal && s.color === room.value.winningColor)
      if (idx !== -1) activeIndex.value = idx
    }
  } else {
    if (spinInterval) {
      clearInterval(spinInterval)
      spinInterval = null
    }
    activeIndex.value = -1
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (ws) ws.close()
  if (spinInterval) clearInterval(spinInterval)
})
</script>

<style scoped>
.animate-bounce-in {
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
@keyframes bounceIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slowSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes slowSpinReverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}
.animate-slow-spin {
  animation: slowSpin 25s linear infinite;
}
.animate-slow-spin-reverse {
  animation: slowSpinReverse 25s linear infinite;
}
</style>
