<template>
  <NuxtLink :to="isObserverMode ? `/room/${room?.roomId}?token=${observerToken}` : `/room/${room?.roomId}`" 
    class="block kawaii-card p-6 overflow-hidden transition-all duration-300 group cursor-pointer">
    
    <!-- Soft ambient glow spots -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-pink-300/20 blur-3xl rounded-full pointer-events-none"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-fuchsia-300/15 blur-3xl rounded-full pointer-events-none"></div>
    
    <!-- Header Row: Room Name + Status Badge -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-extrabold text-pink-600 tracking-wide">
        {{ room?.name || $t('roomCard.room') }}
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
      <div class="text-xs text-pink-400/60 pb-2 font-semibold">{{ $t('roomCard.countdown') }}</div>
    </div>
    
    <!-- Result Area -->
    <div v-if="room?.status === 'finished' && room?.winningAnimal" 
         class="mb-5 p-4 rounded-2xl text-center animate-bounce-in relative z-10"
         style="background: linear-gradient(135deg, #FFF0F5, #FFE4ED);">
      <div class="text-xs text-pink-400 mb-1 font-bold tracking-wider">🏆 {{ $t('roomCard.result') }}</div>
      <div class="text-xl font-black flex items-center justify-center space-x-2">
        <span :class="winningColorClass">{{ $t(`colors.${room.winningColor}`) }}</span>
        <span class="text-pink-700">{{ $t(`animals.${room.winningAnimal}`) }}</span>
      </div>
    </div>
    
    <!-- Odds Map -->
    <div class="min-h-[140px]">
      <h3 class="text-xs font-bold text-pink-500 mb-3 mt-1 tracking-wider pb-1 flex justify-between items-center border-b border-pink-200/50">
        <span>📊 {{ $t('roomCard.oddsMap') }}</span>
      </h3>
      <div class="flex flex-col space-y-2">
        <!-- Red Row -->
        <div class="grid grid-cols-4 gap-2">
          <div v-for="animal in ['Lion', 'Panda', 'Monkey', 'Rabbit']" :key="'Red_'+animal"
               class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110">
            <img :src="getAnimalIcon(animal, 'Red')" :alt="animal" class="w-10 h-10 object-contain drop-shadow-sm" />
            <span class="text-[10px] font-extrabold mt-1 text-pink-600 bg-white/60 px-1 rounded-md w-full text-center">x{{ room?.oddsMap?.[`${animal}_Red`] || '-' }}</span>
          </div>
        </div>
        <!-- Green Row -->
        <div class="grid grid-cols-4 gap-2">
          <div v-for="animal in ['Lion', 'Panda', 'Monkey', 'Rabbit']" :key="'Green_'+animal"
               class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110">
            <img :src="getAnimalIcon(animal, 'Green')" :alt="animal" class="w-10 h-10 object-contain drop-shadow-sm" />
            <span class="text-[10px] font-extrabold mt-1 text-pink-600 bg-white/60 px-1 rounded-md w-full text-center">x{{ room?.oddsMap?.[`${animal}_Green`] || '-' }}</span>
          </div>
        </div>
        <!-- Yellow Row -->
        <div class="grid grid-cols-4 gap-2">
          <div v-for="animal in ['Lion', 'Panda', 'Monkey', 'Rabbit']" :key="'Yellow_'+animal"
               class="flex flex-col items-center justify-center transition-all duration-200 hover:scale-110">
            <img :src="getAnimalIcon(animal, 'Yellow')" :alt="animal" class="w-10 h-10 object-contain drop-shadow-sm" />
            <span class="text-[10px] font-extrabold mt-1 text-pink-600 bg-white/60 px-1 rounded-md w-full text-center">x{{ room?.oddsMap?.[`${animal}_Yellow`] || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- History Area -->
    <div class="mt-6 pt-4 border-t border-pink-100/50">
      <h3 class="text-[10px] font-black text-pink-400 mb-3 tracking-widest flex justify-between items-center uppercase">
        <span>📜 {{ $t('roomCard.gameHistory') }}</span>
      </h3>
      <div v-if="history.length > 0" class="flex flex-wrap gap-2">
         <div v-for="item in history" :key="item._id" 
              class="w-7 h-7 rounded-full flex items-center justify-center p-0.5 border shadow-sm transition-transform hover:scale-125 hover:z-10"
              :class="getHistoryBgClass(item.winningColor)"
              :title="`${$t('animals.'+item.winningAnimal)} ${$t('colors.'+item.winningColor)}`"
         >
           <img :src="getAnimalIcon(item.winningAnimal, item.winningColor)" :alt="item.winningAnimal" class="w-full h-full object-contain filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" />
         </div>
      </div>
      <div v-else class="text-[10px] text-pink-300 italic font-medium">{{ $t('roomCard.noHistory') }}</div>
    </div>
  </NuxtLink>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { observerToken, isObserverMode } = useAgentAuth()
const { t } = useI18n()

// Animal name to icon filename mapping
const ANIMAL_NAME_MAP = { 
  'Lion': 'lion', 'Panda': 'panda', 'Monkey': 'monkey', 'Rabbit': 'rabbit',
  '狮子': 'lion', '熊猫': 'panda', '猴子': 'monkey', '兔子': 'rabbit'
}
const COLOR_NAME_MAP = { 
  'Red': 'red', 'Green': 'green', 'Yellow': 'yellow',
  '红': 'red', '绿': 'green', '黄': 'yellow'
}

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
    'betting': t('roomCard.status.betting'),
    'rolling': t('roomCard.status.rolling'),
    'finished': t('roomCard.status.finished')
  }
  return map[props.room?.status] || t('roomCard.status.unknown')
})

const winningColorClass = computed(() => {
  const colorMap = {
    'Red': 'text-red-500',
    'Green': 'text-emerald-500',
    'Yellow': 'text-amber-500'
  }
  return colorMap[props.room?.winningColor] || ''
})

const history = ref([])
async function fetchHistory() {
  if (!props.room?.roomId) return
  try {
    const data = await $fetch(`/api/rooms/${props.room.roomId}/history`)
    history.value = data.records || []
  } catch (e) {
    console.error('Failed to fetch history', e)
  }
}

watch(() => props.room?.status, (newStatus) => {
  if (newStatus === 'finished') {
    // Wait a bit for the DB to be updated
    setTimeout(fetchHistory, 1000)
  }
})

onMounted(() => {
  fetchHistory()
})

const getHistoryBgClass = (color) => {
  const map = {
    'Red': 'bg-red-50/80 border-red-100',
    '红': 'bg-red-50/80 border-red-100',
    'Green': 'bg-emerald-50/80 border-emerald-100',
    '绿': 'bg-emerald-50/80 border-emerald-100',
    'Yellow': 'bg-amber-50/80 border-amber-100',
    '黄': 'bg-amber-50/80 border-amber-100'
  }
  return map[color] || 'bg-gray-50 border-gray-100'
}
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
