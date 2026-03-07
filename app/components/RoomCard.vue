<template>
  <NuxtLink :to="'/room/' + room?.roomId" class="block relative bg-slate-800 p-6 rounded-xl border border-cyan-500/30 font-mono shadow-[0_0_15px_rgba(34,211,238,0.15)] overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:border-cyan-400">
    <!-- Cyberpunk ambient glow -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-cyan-600/10 blur-3xl rounded-full pointer-events-none"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-fuchsia-600/10 blur-3xl rounded-full pointer-events-none"></div>
    
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-cyan-400 tracking-wider uppercase">{{ room?.name || 'ROOM' }}</h2>
      <div 
        class="px-3 py-1 rounded text-xs font-bold tracking-widest border"
        :class="{
          'border-emerald-500 text-emerald-400 bg-emerald-900/30': room?.status === 'betting',
          'border-amber-500 text-amber-400 bg-amber-900/30 animate-pulse': room?.status === 'rolling',
          'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-900/30': room?.status === 'finished'
        }"
      >
        {{ room?.status?.toUpperCase() || 'UNKNOWN' }}
      </div>
    </div>
    
    <div class="mb-6 flex space-x-4 items-end">
      <div class="text-4xl font-extrabold text-white w-14">{{ room?.timer ?? '00' }}<span class="text-lg text-slate-400 ml-1">s</span></div>
      <div class="text-sm text-cyan-300/60 pb-1">T-MINUS TO NEXT STATE</div>
    </div>
    
    <!-- Result Area -->
    <div v-if="room?.status !== 'betting' && room?.winningAnimal" class="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700 text-center animate-fade-in relative z-10">
      <div class="text-sm text-slate-400 mb-1 tracking-widest text-xs">WINNING RESULT</div>
      <div class="text-xl font-bold flex items-center justify-center space-x-2">
        <span class="tracking-widest" :class="{
          'text-red-500': room.winningColor === '红',
          'text-green-500': room.winningColor === '绿',
          'text-yellow-500': room.winningColor === '黄'
        }">{{ room.winningColor }}</span>
        <span class="text-cyan-50">{{ room.winningAnimal }}</span>
      </div>
    </div>
    
    <!-- Odds Map -->
    <!-- Add min-height to push layout and avoid jumping too much when result opens -->
    <div class="min-h-[140px]">
      <h3 class="text-xs font-semibold text-cyan-500 mb-2 mt-2 tracking-widest border-b border-slate-700/50 pb-1 flex justify-between">
        <span>ODDS MATRIX</span>
      </h3>
      <div class="flex flex-col space-y-2">
        <!-- Red Row -->
        <div class="grid grid-cols-4 gap-1">
          <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'红_'+animal"
               class="flex flex-col items-center justify-center p-1 rounded border bg-red-950/40 border-red-900/80 text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]">
            <span class="text-[10px] font-bold">{{ animal }}</span>
            <span class="text-[10px] font-bold mt-1 text-cyan-400">x{{ room?.oddsMap?.[`${animal}_红`] || '-' }}</span>
          </div>
        </div>
        <!-- Green Row -->
        <div class="grid grid-cols-4 gap-1">
          <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'绿_'+animal"
               class="flex flex-col items-center justify-center p-1 rounded border bg-green-950/40 border-green-900/80 text-green-500 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]">
            <span class="text-[10px] font-bold">{{ animal }}</span>
            <span class="text-[10px] font-bold mt-1 text-cyan-400">x{{ room?.oddsMap?.[`${animal}_绿`] || '-' }}</span>
          </div>
        </div>
        <!-- Yellow Row -->
        <div class="grid grid-cols-4 gap-1">
          <div v-for="animal in ['狮子', '熊猫', '猴子', '兔子']" :key="'黄_'+animal"
               class="flex flex-col items-center justify-center p-1 rounded border bg-yellow-950/40 border-yellow-900/80 text-yellow-500 shadow-[inset_0_0_10px_rgba(234,179,8,0.1)]">
            <span class="text-[10px] font-bold">{{ animal }}</span>
            <span class="text-[10px] font-bold mt-1 text-cyan-400">x{{ room?.oddsMap?.[`${animal}_黄`] || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  room: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
