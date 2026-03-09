<template>
  <NuxtLink :to="isObserverMode ? `/room/${room?.roomId}?token=${observerToken}` : `/room/${room?.roomId}`" 
    class="block kawaii-card p-6 overflow-hidden transition-all duration-300 group cursor-pointer">
    
    <!-- Soft ambient glow spots -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-pink-300/20 blur-3xl rounded-full pointer-events-none"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-fuchsia-300/15 blur-3xl rounded-full pointer-events-none"></div>
    
    <!-- Header Row: Room Name + Status Badge -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-extrabold text-pink-600 tracking-wide">
        {{ room?.name || '房间' }}
      </h2>
      <div class="status-badge"
        :class="{
          'status-betting': room?.status === 'betting',
          'status-rolling': room?.status === 'rolling',
          'status-finished': room?.status === 'finished'
        }">
        {{ statusText }}
      </div>
    </div>
    
    <!-- Timer -->
    <div class="mb-5 flex items-end space-x-3">
      <div class="text-5xl font-black text-pink-500">
        {{ room?.timer ?? '00' }}
        <span class="text-lg text-pink-300 ml-1 font-bold">s</span>
      </div>
      <div class="text-xs text-pink-400/60 pb-2 font-semibold">倒计时</div>
    </div>
    
    <!-- Result Area -->
    <div v-if="room?.status === 'finished' && room?.winningAnimal" 
         class="mb-5 p-4 rounded-2xl text-center animate-bounce-in relative z-10"
         style="background: linear-gradient(135deg, #FFF0F5, #FFE4ED);">
      <div class="text-xs text-pink-400 mb-1 font-bold tracking-wider">🏆 开奖结果</div>
      <div class="text-xl font-black flex items-center justify-center space-x-2">
        <span :class="winningColorClass">{{ room.winningColor }}</span>
        <span class="text-pink-700">{{ room.winningAnimal }}</span>
      </div>
    </div>
    
    <!-- Odds Map -->
    <div class="min-h-[140px]">
      <h3 class="text-xs font-bold text-pink-500 mb-3 mt-1 tracking-wider pb-1 flex justify-between items-center border-b border-pink-200/50">
        <span>📊 赔率矩阵</span>
      </h3>
      <div class="flex flex-col space-y-2">
        <!-- Red Row -->
        <div class="grid grid-cols-4 gap-2">
          <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'红_'+animal"
               class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110">
            <img :src="getAnimalIcon(animal, '红')" :alt="animal" class="w-10 h-10 object-contain drop-shadow-sm" />
            <span class="text-[10px] font-extrabold mt-1 text-pink-600 bg-white/60 px-1 rounded-md w-full text-center">x{{ room?.oddsMap?.[`${animal}_红`] || '-' }}</span>
          </div>
        </div>
        <!-- Green Row -->
        <div class="grid grid-cols-4 gap-2">
          <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'绿_'+animal"
               class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110">
            <img :src="getAnimalIcon(animal, '绿')" :alt="animal" class="w-10 h-10 object-contain drop-shadow-sm" />
            <span class="text-[10px] font-extrabold mt-1 text-pink-600 bg-white/60 px-1 rounded-md w-full text-center">x{{ room?.oddsMap?.[`${animal}_绿`] || '-' }}</span>
          </div>
        </div>
        <!-- Yellow Row -->
        <div class="grid grid-cols-4 gap-2">
          <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'黄_'+animal"
               class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110">
            <img :src="getAnimalIcon(animal, '黄')" :alt="animal" class="w-10 h-10 object-contain drop-shadow-sm" />
            <span class="text-[10px] font-extrabold mt-1 text-pink-600 bg-white/60 px-1 rounded-md w-full text-center">x{{ room?.oddsMap?.[`${animal}_黄`] || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
import { computed } from 'vue'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { observerToken, isObserverMode } = useAgentAuth()

// Animal name to icon filename mapping
const ANIMAL_NAME_MAP = { '狮子': 'lion', '熊猫': 'panda', '猴子': 'monkey', '兔子': 'rabbit' }
const COLOR_NAME_MAP = { '红': 'red', '绿': 'green', '黄': 'yellow' }

function getAnimalIcon(animal, color) {
  const a = ANIMAL_NAME_MAP[animal]
  const c = COLOR_NAME_MAP[color]
  return a && c ? `/icons/${a}-${c}.png` : ''
}

const props = defineProps({
  room: {
    type: Object,
    default: () => ({})
  }
})

const statusText = computed(() => {
  const map = {
    'betting': '投注中',
    'rolling': '开奖中',
    'finished': '已结束'
  }
  return map[props.room?.status] || '未知'
})

const winningColorClass = computed(() => {
  const colorMap = {
    '红': 'text-red-500',
    '绿': 'text-emerald-500',
    '黄': 'text-amber-500'
  }
  return colorMap[props.room?.winningColor] || ''
})
</script>

<style scoped>
.animate-bounce-in {
  animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
