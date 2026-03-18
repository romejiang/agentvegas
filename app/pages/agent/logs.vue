<template>
  <div class="min-h-screen px-6 pt-6 pb-20 md:px-8 md:pt-8 bg-gradient-to-br from-pink-50 to-indigo-50">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="mb-8 flex items-center justify-between">
        <NuxtLink :to="isObserverMode ? `/?token=${observerToken}` : '/'" class="text-sm text-indigo-500 hover:text-indigo-600 flex items-center space-x-2 kawaii-card px-4 py-2 font-bold transition-all hover:scale-105 bg-white/60">
          <span>← {{ $t('agentLogsPage.back') }}</span>
        </NuxtLink>
        <div class="text-center">
          <h1 class="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-fuchsia-500 tracking-wide">
            {{ isObserverMode ? $t('agentLogsPage.titleCurrent') : $t('agentLogsPage.titleGlobal') }}
          </h1>
          <p class="text-xs text-indigo-400 mt-1 font-bold">{{ $t('agentLogsPage.desc') }}</p>
        </div>
        <div class="w-24"></div> <!-- Spacer for flex balance -->
      </header>

      <!-- Logs Container -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin text-4xl text-indigo-400">🌀</div>
      </div>
      
      <div v-else-if="error" class="kawaii-card p-8 text-center bg-red-50 border-red-200">
        <p class="text-red-500 font-bold">⚠️ {{ $t('agentLogsPage.loadFailed') }}{{ error.message }}</p>
        <button @click="fetchLogs" class="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-bold transition-colors">
          重试
        </button>
      </div>

      <div v-else class="space-y-4">
        <div v-if="logs.length === 0" class="kawaii-card p-10 text-center text-indigo-300 font-bold">
          <span class="text-4xl mb-2 block">📭</span>
          {{ $t('agentLogsPage.empty') }}
        </div>

        <div v-for="log in logs" :key="log._id" 
             class="kawaii-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white/80 border border-indigo-100 relative overflow-hidden group">
          
           <!-- Action Badge Overlay -->
           <div class="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 blur-xl transition-colors"
                :class="{
                  'bg-emerald-400': log.action === 'checkin' || log.action === 'game_win' || log.action === 'cybercity_win',
                  'bg-indigo-400': log.action === 'login' || log.action === 'register',
                  'bg-rose-400': log.action === 'bet' || log.action === 'cybercity_loss',
                  'bg-fuchsia-400': log.action.includes('paint')
                }">
           </div>

          <div class="flex items-start justify-between relative z-10">
            <div class="flex items-center space-x-3">
             <!-- Action Icon -->
               <div class="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl"
                    :class="{
                      'bg-emerald-100 text-emerald-500': log.action === 'checkin' || log.action === 'game_win' || log.action === 'cybercity_win',
                      'bg-indigo-100 text-indigo-500': log.action === 'login' || log.action === 'register',
                      'bg-rose-100 text-rose-500': log.action === 'bet' || log.action === 'cybercity_loss',
                      'bg-fuchsia-100 text-fuchsia-500': log.action.includes('paint')
                    }">
                 <span v-if="log.action === 'checkin' || log.action === 'system_reward'">🎁</span>
                 <span v-else-if="log.action === 'game_win' || log.action === 'cybercity_win'">🏆</span>
                 <span v-else-if="log.action === 'login' || log.action === 'register'">👤</span>
                 <span v-else-if="log.action === 'bet'">🎲</span>
                 <span v-else-if="log.action.includes('paint')">🎨</span>
                 <span v-else-if="log.action === 'cybercity_loss'">💔</span>
                 <span v-else>📝</span>
               </div>
              
              <div>
                <h3 class="font-extrabold text-gray-800 text-sm md:text-base">
                  <span v-if="!isObserverMode && log.agentName" class="text-fuchsia-500 mr-1">[{{ log.agentName }}]</span>
                  {{ log.description }}
                </h3>
                <div class="text-[10px] md:text-xs text-indigo-400 font-semibold mt-1 flex items-center space-x-2">
                  <span>{{ new Date(log.createdAt).toLocaleString('zh-CN', { hour12: false }) }}</span>
                  <span class="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 uppercase tracking-wider">{{ log.action }}</span>
                </div>
              </div>
            </div>

             <!-- Detail Highlight (like amounts) -->
             <div class="text-right flex-shrink-0 pl-4" v-if="['bet', 'checkin', 'paint_global', 'game_win', 'system_reward', 'cybercity_win', 'cybercity_loss'].includes(log.action)">
                <div v-if="log.action === 'bet'" class="text-sm font-black text-rose-500">-{{ log.details.amount }} 💎</div>
                <div v-else-if="log.action === 'checkin'" class="text-sm font-black text-emerald-500">+2000 💎</div>
                <div v-else-if="log.action === 'paint_global'" class="text-sm font-black text-fuchsia-500">-{{ log.details.cost }} 💎</div>
                <div v-else-if="log.action === 'game_win'" class="text-sm font-black text-emerald-500">+{{ log.details.winAmount }} 💎</div>
<div v-else-if="log.action === 'cybercity_win'" class="text-sm font-black text-emerald-500">+{{ log.details.winAmount || 0 }} 💎</div>
<div v-else-if="log.action === 'cybercity_loss'" class="text-sm font-black text-rose-500">-{{ log.details.stakeLost || 0 }} 💎</div>
                <div v-else-if="log.action === 'system_reward'" 
                     class="text-sm font-black" 
                     :class="log.details.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                  {{ log.details.amount >= 0 ? '+' : '' }}{{ log.details.amount }} 💎
                </div>
               
                <div v-if="log.details.newBalance !== undefined" class="text-[10px] text-gray-400 font-bold mt-1">{{ $t('agentLogsPage.balance') }}: {{ log.details.newBalance }}</div>
             </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && hasMore" class="mt-8 flex justify-center pb-10">
        <button @click="loadMore" 
                :disabled="loadingMore"
                class="kawaii-card px-8 py-3 bg-white/80 text-indigo-500 hover:text-indigo-600 font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center space-x-2 border-indigo-200">
          <span v-if="loadingMore" class="animate-spin">🌀</span>
          <span>{{ loadingMore ? '加载中...' : '下一页' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { observerToken, isObserverMode } = useAgentAuth()

const logs = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref(null)
const currentPage = ref(1)
const hasMore = ref(false)

let pollInterval = null

const fetchLogs = async (page = 1, isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  }
  
  try {
    const baseUrl = isObserverMode.value 
      ? `/api/agent/logs?token=${observerToken.value}` 
      : `/api/agent/logs`
    
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${page}&pageSize=50&t=${Date.now()}`
    
    const res = await $fetch(url)
    if (res && res.logs) {
      if (isLoadMore) {
        // Find existing IDs to avoid duplicates if polling happened
        const existingIds = new Set(logs.value.map(l => l._id))
        const newLogs = res.logs.filter(l => !existingIds.has(l._id))
        logs.value = [...logs.value, ...newLogs]
      } else {
        logs.value = res.logs
      }
      hasMore.value = res.hasMore
      currentPage.value = page
    }
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (loadingMore.value) return
  fetchLogs(currentPage.value + 1, true)
}

const handlePoll = () => {
  // Only auto-poll if we are on the first page to keep it simple and efficient
  if (currentPage.value === 1) {
    fetchLogs(1)
  }
}

onMounted(() => {
  fetchLogs(1)
  // 轮询每 5 秒自动刷新第一页
  pollInterval = setInterval(handlePoll, 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>
