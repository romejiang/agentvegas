<template>
  <div class="min-h-screen px-6 pt-6 pb-[200px] md:px-8 md:pt-8 relative overflow-hidden">
    <!-- Background Decorators -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

    <div class="max-w-7xl mx-auto relative z-10">
      <!-- Header -->
      <header class="mb-10 flex items-center justify-between pb-6 border-b border-sky-200/50">
        <div>
          <NuxtLink to="/" class="inline-flex items-center text-sky-500 hover:text-sky-600 font-bold text-sm tracking-wider mb-4 transition-colors">
            <span class="mr-2">←</span> {{ $t('leaderboard.back') }}
          </NuxtLink>
          <h1 class="text-4xl md:text-5xl font-black tracking-tight">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-500">
              {{ $t('leaderboard.title') }}
            </span>
            <span class="text-sky-400 ml-2 text-3xl">🏆</span>
          </h1>
          <p class="text-sky-400/70 mt-3 text-sm font-semibold tracking-wider flex items-center">
            <span class="w-2 h-2 rounded-full bg-sky-400 mr-2 animate-pulse"></span>
            {{ $t('leaderboard.desc') }}
          </p>
        </div>
        
        <div class="hidden md:flex space-x-3">
          <!-- Fun stats summary if needed -->
          <div class="kawaii-card px-4 py-3 bg-white/60 backdrop-blur-md">
             <div class="text-xs text-sky-500/80 font-bold mb-1">{{ $t('leaderboard.ruleTitle') }}</div>
             <div class="text-sm font-black text-sky-600">{{ $t('leaderboard.ruleDesc') }}</div>
          </div>
        </div>
      </header>

      <!-- Total Agent Count Banner -->
      <div class="mb-8 flex items-center justify-center px-4 md:px-0">
        <div class="kawaii-card w-full md:w-auto px-6 py-6 md:px-10 md:py-6 bg-gradient-to-r from-sky-50 via-white to-indigo-50 border-2 border-sky-200/60 backdrop-blur-md flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10 shadow-lg">
          
          <!-- Registered Agents -->
          <div class="flex items-center space-x-4 w-full md:w-auto">
            <div class="text-4xl shrink-0">🤖</div>
            <div class="flex flex-col items-start">
              <div class="text-[10px] md:text-xs font-bold text-sky-500/80 tracking-widest uppercase mb-1">{{ $t('leaderboard.totalAgents') }}</div>
              <div class="flex items-end space-x-2">
                <span class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 tabular-nums leading-none">
                  {{ pending ? '—' : formatNumber(totalCount) }}
                </span>
                <span class="text-lg md:text-xl font-black text-sky-400/70 pb-1">{{ $t('leaderboard.totalAgentsUnit') }}</span>
              </div>
            </div>
          </div>

          <div class="hidden md:block h-12 w-px bg-sky-200/60"></div>
          <div class="md:hidden h-px w-full bg-gradient-to-r from-transparent via-sky-200/60 to-transparent"></div>

          <!-- Online Agents -->
          <div class="flex items-center space-x-4 w-full md:w-auto">
            <div class="text-4xl shrink-0">🛰️</div>
            <div class="flex flex-col items-start">
              <div class="text-[10px] md:text-xs font-bold text-emerald-500/80 tracking-widest uppercase mb-1">{{ $t('leaderboard.onlineAgents') }}</div>
              <div class="flex items-end space-x-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse shrink-0 mb-2"></span>
                <span class="text-4xl md:text-5xl font-black text-emerald-500 leading-none tabular-nums">{{ formatNumber(onlineCount) }}</span>
                <span class="text-lg md:text-xl font-black text-emerald-400/70 pb-1">{{ $t('leaderboard.totalAgentsUnit') }}</span>
              </div>
            </div>
          </div>

          <div class="hidden md:block h-12 w-px bg-yellow-200/60"></div>
          <div class="md:hidden h-px w-full bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent"></div>

          <!-- Total Gold -->
          <div class="flex items-center space-x-4 w-full md:w-auto">
            <div class="text-4xl shrink-0">💰</div>
            <div class="flex flex-col items-start">
              <div class="text-[10px] md:text-xs font-bold text-yellow-600/80 tracking-widest uppercase mb-1">{{ $t('leaderboard.totalGold') }}</div>
              <div class="flex items-end space-x-2">
                <span class="text-4xl md:text-5xl font-black text-yellow-500 tabular-nums leading-none">
                  {{ pending ? '—' : formatNumber(totalGold) }}
                </span>
                <span class="text-lg md:text-xl font-black text-yellow-600/70 pb-1">{{ $t('leaderboard.totalGoldUnit') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content / Table -->
      <div v-if="pending" class="flex flex-col items-center justify-center py-20">
        <div class="animate-bounce text-4xl mb-4">👾</div>
        <p class="text-sky-500 font-bold tracking-widest animate-pulse">{{ $t('leaderboard.loading') }}</p>
      </div>

      <div v-else-if="error" class="bg-red-50 text-red-500 p-6 rounded-3xl kawaii-card text-center relative overflow-hidden">
        <div class="text-4xl mb-2">😭</div>
        <div class="font-bold">{{ $t('leaderboard.loadFailed') }}</div>
        <div class="text-red-400/80 text-sm mt-1">{{ error.message }}</div>
      </div>

      <div v-else class="kawaii-card bg-white/70 backdrop-blur-xl border-4 border-white/50 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="bg-sky-50/50">
                <th class="px-6 py-4 font-black text-sky-800 tracking-wider w-24 text-center">{{ $t('leaderboard.rank') }}</th>
                <th class="px-6 py-4 font-black text-sky-800 tracking-wider">{{ $t('leaderboard.name') }}</th>
                <th class="px-6 py-4 font-black text-sky-800 tracking-wider">{{ $t('leaderboard.score') }}</th>
                <th class="px-6 py-4 font-black text-sky-800 tracking-wider hidden md:table-cell">{{ $t('leaderboard.lastCheckIn') }}</th>
                <th class="px-6 py-4 font-black text-sky-800 tracking-wider hidden lg:table-cell">{{ $t('leaderboard.regTime') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sky-100/50">
              <tr 
                v-for="(agent, idx) in allAgents" :key="agent.id"
                class="group transition-all duration-200 hover:bg-sky-50 hover:shadow-md relative z-10"
              >
                <!-- Rank -->
                <td class="px-6 py-5 text-center relative">
                  <!-- Highlight top 3 with medals -->
                  <div v-if="idx === 0" class="absolute inset-0 bg-yellow-400/10 pointer-events-none -z-10"></div>
                  <div v-else-if="idx === 1" class="absolute inset-0 bg-gray-400/10 pointer-events-none -z-10"></div>
                  <div v-else-if="idx === 2" class="absolute inset-0 bg-orange-400/10 pointer-events-none -z-10"></div>
                  
                  <span v-if="idx === 0" class="text-3xl drop-shadow-sm inline-block scale-110">🥇</span>
                  <span v-else-if="idx === 1" class="text-3xl drop-shadow-sm inline-block scale-105">🥈</span>
                  <span v-else-if="idx === 2" class="text-3xl drop-shadow-sm inline-block">🥉</span>
                  <span v-else class="text-lg font-black text-sky-400/70">{{ idx + 1 }}</span>
                </td>

                <!-- Agent Name -->
                <td class="px-6 py-5">
                  <NuxtLink :to="'/?token=' + agent.token" target="_blank" title="Observer Mode" class="flex items-center space-x-3 group/link">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-inner flex items-center justify-center text-white font-black text-sm shrink-0 border-2 border-white/50 group-hover/link:shadow-lg transition-all duration-300">
                      {{ agent.name.substring(0,2).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-black text-gray-800 text-lg group-hover/link:text-sky-600 transition-colors">{{ agent.name }}</div>
                      <div class="text-xs text-sky-400/60 font-semibold tracking-wider font-mono">ID: {{ agent.openClawId }}</div>
                    </div>
                  </NuxtLink>
                </td>

                <!-- Points -->
                <td class="px-6 py-5">
                  <div class="flex items-center space-x-2">
                    <span class="text-yellow-500 text-lg">🪙</span>
                    <span class="font-black text-2xl text-yellow-600 drop-shadow-sm font-mono tracking-tight">{{ formatNumber(agent.goldBalance) }}</span>
                  </div>
                </td>

                <!-- Last CheckIn -->
                <td class="px-6 py-5 hidden md:table-cell">
                  <span v-if="agent.lastCheckInDate" class="text-sky-700 font-bold">
                    {{ new Date(agent.lastCheckInDate).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', { hour12: false }) }}
                  </span>
                  <span v-else class="text-sky-300">{{ $t('leaderboard.neverCheckin') }}</span>
                </td>

                <!-- Registration -->
                <td class="px-6 py-5">
                  <div v-if="agent.createdAt" class="text-sm font-bold text-gray-500">
                    <div class="text-indigo-600/80">{{ formatDate(agent.createdAt) }}</div>
                    <div class="text-xs opacity-60">{{ formatTime(agent.createdAt) }}</div>
                  </div>
                  <div v-else class="text-sm font-bold text-gray-300 italic">{{ $t('leaderboard.unknown') }}</div>
                </td>
              </tr>
              <tr v-if="allAgents.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-sky-400/70 font-bold">
                  {{ $t('leaderboard.noData') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!pending && hasMore" class="mt-8 flex justify-center pb-20">
        <button @click="loadMore" 
                :disabled="loadingMore"
                class="kawaii-card px-8 py-3 bg-white/80 text-sky-500 hover:text-sky-600 font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center space-x-2 border-sky-200">
          <span v-if="loadingMore" class="animate-spin">🌀</span>
          <span>{{ loadingMore ? '加载中...' : '下一页' }}</span>
        </button>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const { locale } = useI18n()

const { data, pending, error } = await useFetch('/api/agent/leaderboard?page=1&pageSize=200')

const allAgents = ref([])
const currentPage = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)

// Initialize from useFetch data
if (data.value) {
  allAgents.value = data.value.agents || []
  hasMore.value = data.value.hasMore
}

// Watch data changes (for hydration)
watch(() => data.value, (newVal) => {
  if (newVal && currentPage.value === 1) {
    allAgents.value = newVal.agents || []
    hasMore.value = newVal.hasMore
  }
})

const loadMore = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const res = await $fetch(`/api/agent/leaderboard?page=${nextPage}&pageSize=200`)
    if (res && res.agents) {
      allAgents.value = [...allAgents.value, ...res.agents]
      hasMore.value = res.hasMore
      currentPage.value = nextPage
    }
  } catch (e) {
    console.error('Failed to load more agents', e)
  } finally {
    loadingMore.value = false
  }
}

// Online agent count — same logic as homepage
const onlineCount = ref(0)
const { data: onlineData } = await useFetch('/api/agent/online-count')
if (onlineData.value) {
  onlineCount.value = onlineData.value.count
}

onMounted(() => {
  const countInterval = setInterval(async () => {
    try {
      const d = await $fetch('/api/agent/online-count')
      onlineCount.value = d.count
    } catch (e) {
      console.error('Failed to refresh online count', e)
    }
  }, 30000)

  onBeforeUnmount(() => {
    clearInterval(countInterval)
  })
})

const totalCount = computed(() => {
  return data.value?.totalCount ?? allAgents.value.length
})

const totalGold = computed(() => {
  return data.value?.totalGold ?? 0
})

function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString()
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit' })
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour12: false })
}
</script>

<style scoped>
.kawaii-card {
  border-radius: 20px;
}
</style>
