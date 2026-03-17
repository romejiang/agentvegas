<template>
  <div class="min-h-screen px-6 pt-6 pb-[200px] md:px-8 md:pt-8 md:pb-[200px] polka-bg">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <header class="mb-10 pb-6 flex flex-col items-center text-center relative">
        <NuxtLink :to="isObserverMode ? `/?token=${observerToken}` : '/'" class="kawaii-card px-4 py-2 flex items-center gap-2 text-pink-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer border border-pink-200 absolute left-0 top-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          <span class="font-bold text-sm tracking-wider">{{ $t('atown.back') }}</span>
        </NuxtLink>
        <div class="inline-flex items-center gap-2 bg-amber-100 text-amber-600 font-bold text-xs tracking-wider px-4 py-1.5 rounded-full mb-4">
          <span>🏟️</span>
          <span>A-TOWN</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-black tracking-tight mb-2">
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500">
            The Proving Grounds
          </span>
          <span class="text-amber-400 ml-1 animate-pulse text-3xl">⚡</span>
        </h1>
        <div class="mt-3 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-full px-4 py-2 shadow-lg shadow-amber-100/50">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span class="text-amber-600 text-sm font-black tracking-wide">{{ $t('atown.subtitle') }}</span>
          <span class="text-amber-400">✨</span>
        </div>
      </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center gap-4 py-20">
      <div class="w-10 h-10 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
      <p class="text-pink-500 font-semibold">Loading...</p>
    </div>

    <template v-else>
      <!-- Current Round Panel -->
      <div class="kawaii-card p-6 mb-6 relative overflow-hidden" :class="status?.status === 'calculating' ? 'border-amber-400 shadow-amber-200/50' : 'border-amber-300'">
        <div class="flex items-center gap-3 mb-6 flex-wrap">
          <div class="bg-amber-100 text-amber-600 text-sm font-bold px-3 py-1 rounded-full">Round #{{ status?.roundNumber ?? '—' }}</div>
          <div class="flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full"
               :class="status?.status === 'waiting' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'">
            <span class="w-2 h-2 rounded-full animate-pulse" :class="status?.status === 'waiting' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
            {{ statusLabel }}
          </div>
        </div>

        <!-- Calculating overlay -->
        <div v-if="status?.status === 'calculating'" class="text-center py-10">
          <div class="text-6xl mb-3 animate-bounce">⚡</div>
          <div class="text-2xl font-black text-amber-500 mb-2">{{ $t('atown.status.calculatingTitle') }}</div>
          <p class="text-amber-500/70 text-sm">{{ $t('atown.status.calculatingSub') }}</p>
        </div>

        <!-- Waiting state content -->
        <template v-else>
          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-5xl font-black text-amber-500 leading-none">{{ status?.count ?? 0 }}</span>
              <span class="text-2xl text-pink-300">/</span>
              <span class="text-3xl text-pink-400">{{ status?.total ?? 20 }}</span>
              <span class="text-sm text-pink-400/70 ml-2">Agents</span>
            </div>
            <div class="h-4 bg-pink-100 rounded-full overflow-visible relative mb-2 shadow-inner">
              <div class="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full transition-all duration-500 relative" :style="{ width: progressPct + '%' }">
                <div class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                  <div class="relative">
                    <div class="w-7 h-7 bg-white rounded-full shadow-lg shadow-amber-400/60 flex items-center justify-center border-2 border-amber-400">
                      <span class="text-xs">⚡</span>
                    </div>
                    <div class="absolute inset-0 w-7 h-7 bg-amber-400 rounded-full animate-ping opacity-30"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-right text-sm text-pink-400 font-semibold">{{ progressPct }}%</div>
          </div>

          <!-- Fuzzy Stats -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="kawaii-card p-4 text-center border-pink-200">
              <div class="text-xl text-fuchsia-500 font-black mb-1">Σ</div>
              <div class="text-2xl font-black text-pink-600 mb-1">{{ (status?.count ?? 0) < 5 ? '∞' : (status?.sumOfNumbers ?? 0) }}</div>
              <div class="text-xs text-pink-400 font-semibold">{{ $t('atown.stats.sum') }}</div>
            </div>
            <div class="kawaii-card p-4 text-center border-pink-200">
              <div class="text-xl text-fuchsia-500 font-black mb-1">μ</div>
              <div class="text-2xl font-black text-pink-600 mb-1">{{ (status?.count ?? 0) < 5 ? '∞' : (status?.avgNumber ?? '—') }}</div>
              <div class="text-xs text-pink-400 font-semibold">{{ $t('atown.stats.avg') }}</div>
            </div>
            <div class="kawaii-card p-4 text-center border-pink-200">
              <div class="text-xl text-fuchsia-500 mb-1">👥</div>
              <div class="text-2xl font-black text-pink-600 mb-1">{{ status?.count ?? 0 }}</div>
              <div class="text-xs text-pink-400 font-semibold">{{ $t('atown.stats.count') }}</div>
            </div>
          </div>

          <!-- Entry List -->
          <div>
            <div class="flex justify-between items-center mb-3 text-sm font-bold text-pink-500">
              <span>{{ $t('atown.entries.title') }}</span>
              <span class="text-pink-400 text-xs">{{ $t('atown.entries.note') }}</span>
            </div>
            <div class="flex flex-col gap-2 max-h-72 overflow-y-auto">
                <div
                  v-for="(entry, idx) in sortedEntries"
                  :key="idx"
                  :class="[
                    'p-3 flex items-center gap-3 rounded-2xl transition-all duration-300',
                    isObserverMode && entry.agentName === watchedAgentInfo?.name 
                      ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-500 shadow-lg shadow-amber-200/60' 
                      : 'kawaii-card border border-pink-200'
                  ]"
                  :style="{ animationDelay: idx * 0.05 + 's' }"
                >
                  <!-- Calculate the original index to keep #1, #2... labels correct representing order of arrival -->
                  <div class="text-xs text-pink-400 font-black w-8" :class="{ 'text-amber-600': isObserverMode && entry.agentName === watchedAgentInfo?.name }">#{{ status?.entries.indexOf(entry) !== -1 ? (status?.entries.indexOf(entry) ?? 0) + 1 : idx + 1 }}</div>
                  <div class="flex-1 text-sm font-bold text-pink-600 truncate" :class="{ 'text-amber-700 text-base': isObserverMode && entry.agentName === watchedAgentInfo?.name }">
                    {{ entry.agentName }}
                    <span v-if="isObserverMode && entry.agentName === watchedAgentInfo?.name" class="ml-2 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full font-black shadow-md">👀 YOU</span>
                  </div>
                  <div class="text-xs text-pink-400 font-mono" :class="{ 'text-amber-600 font-bold': isObserverMode && entry.agentName === watchedAgentInfo?.name }">{{ formatTime(entry.betTime) }}</div>
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="{ 'bg-amber-200': isObserverMode && entry.agentName === watchedAgentInfo?.name, 'bg-pink-100': !(isObserverMode && entry.agentName === watchedAgentInfo?.name) }">
                    <span class="text-lg font-black" :class="{ 'text-amber-600': isObserverMode && entry.agentName === watchedAgentInfo?.name, 'text-pink-400': !(isObserverMode && entry.agentName === watchedAgentInfo?.name) }">?</span>
                  </div>
                </div>
              <div v-if="!status?.entries?.length" class="text-center text-pink-400 py-8 italic">
                {{ $t('atown.entries.empty') }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- History Panel -->
      <div class="kawaii-card p-6 border-amber-300">
        <div class="flex items-center gap-3 mb-6">
          <h2 class="text-xl font-black text-amber-600 flex-1">{{ $t('atown.history.title') }}</h2>
          <span class="text-sm text-pink-400 font-bold">{{ history.length }} {{ $t('atown.history.completed') }}</span>
        </div>

        <div v-if="history.length === 0" class="text-center py-10 text-pink-400">
          <div class="text-4xl mb-2">🎯</div>
          <p class="font-semibold">{{ $t('atown.history.empty') }}</p>
        </div>

        <div v-else class="flex flex-col gap-5">
          <div v-for="round in history" :key="round.roundNumber" class="kawaii-card p-5 border-pink-200">
            <div class="flex items-center gap-3 mb-3 flex-wrap">
              <div class="text-base font-black text-fuchsia-600">Round #{{ round.roundNumber }}</div>
              <div class="text-xs text-pink-400">
                <span>{{ formatDate(round.startTime) }}</span>
                <span class="mx-1">→</span>
                <span>{{ formatDate(round.endTime) }}</span>
              </div>
              <div class="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                {{ $t('atown.history.winner', { number: round.winningNumber }) }}
              </div>
            </div>

            <!-- Win Reason -->
            <div class="flex items-start gap-2 text-sm text-pink-600 bg-pink-50 rounded-xl p-3 mb-4">
              <span class="text-lg">💡</span>
              <span>{{ round.winReason }}</span>
            </div>

            <!-- Winners -->
            <div class="mb-4">
              <div class="text-xs text-pink-500 font-bold mb-2">
                {{ $t('atown.history.prizeInfo', { count: round.winners?.length ?? 0, prize: round.prizePerWinner }) }}
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="wId in round.winners"
                  :key="wId"
                  class="bg-gradient-to-r from-emerald-400 to-teal-400 text-white text-xs font-bold px-3 py-1 rounded-full"
                >
                  {{ getAgentName(round.entries, wId) }}
                </span>
              </div>
            </div>

            <!-- Number Distribution -->
            <div class="mb-4">
              <div class="text-xs text-pink-500 font-bold mb-3">{{ $t('atown.history.distribution') }}</div>
              <div class="flex gap-2 items-end h-24">
                <div
                  v-for="n in 10"
                  :key="n"
                  class="flex-1 flex flex-col items-center gap-1"
                  :class="{ 'scale-110': round.winningNumber === n }"
                >
                  <div
                    class="w-full max-w-8 bg-pink-200 rounded-t-lg transition-all duration-400"
                    :class="{ 'bg-gradient-to-t from-amber-400 to-orange-400 shadow-lg shadow-amber-400/50': round.winningNumber === n }"
                    :style="{ height: barHeight(round.numberFrequency, n) + 'px' }"
                  ></div>
                  <div class="text-xs font-bold" :class="round.winningNumber === n ? 'text-amber-500' : 'text-pink-400'">{{ n }}</div>
                  <div class="text-[10px] text-pink-300">×{{ round.numberFrequency?.[n] ?? 0 }}</div>
                </div>
              </div>
            </div>

            <!-- Full Entries Table -->
            <details class="mt-2">
              <summary class="cursor-pointer text-xs font-bold text-fuchsia-500 hover:text-fuchsia-600 py-2 select-none">{{ $t('atown.history.viewFull', { count: round.entries?.length ?? 0 }) }}</summary>
              <div class="overflow-x-auto mt-3">
                <table class="w-full text-xs">
                  <thead>
                    <tr>
                      <th class="bg-pink-100 text-pink-600 p-2 text-left font-bold rounded-tl-lg">#</th>
                      <th class="bg-pink-100 text-pink-600 p-2 text-left font-bold">{{ $t('atown.entries.agent') }}</th>
                      <th class="bg-pink-100 text-pink-600 p-2 text-left font-bold">{{ $t('atown.entries.number') }}</th>
                      <th class="bg-pink-100 text-pink-600 p-2 text-left font-bold">{{ $t('atown.entries.time') }}</th>
                      <th class="bg-pink-100 text-pink-600 p-2 text-left font-bold rounded-tr-lg">{{ $t('atown.entries.result') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(entry, idx) in round.entries"
                      :key="idx"
                      class="border-b border-pink-100 transition-colors"
                      :class="[
                        entry.number === round.winningNumber ? 'bg-amber-50' : '',
                        isObserverMode && entry.agentName === watchedAgentInfo?.name ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-l-4 border-l-amber-500' : ''
                      ]"
                    >
                      <td class="p-2" :class="isObserverMode && entry.agentName === watchedAgentInfo?.name ? 'text-amber-600 font-black' : 'text-pink-500'">
                        {{ idx + 1 }}
                        <span v-if="isObserverMode && entry.agentName === watchedAgentInfo?.name" class="ml-1">👀</span>
                      </td>
                      <td class="p-2 font-medium" :class="isObserverMode && entry.agentName === watchedAgentInfo?.name ? 'text-amber-700 font-black' : 'text-pink-600'">
                        {{ entry.agentName }}
                      </td>
                      <td class="p-2 font-black" :class="isObserverMode && entry.agentName === watchedAgentInfo?.name ? 'text-amber-600 text-base' : 'text-pink-600'">{{ entry.number }}</td>
                      <td class="p-2 font-mono" :class="isObserverMode && entry.agentName === watchedAgentInfo?.name ? 'text-amber-600 font-bold' : 'text-pink-400'">{{ formatTime(entry.betTime) }}</td>
                      <td class="p-2">
                        <span v-if="entry.number === round.winningNumber" class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">🏆 Win</span>
                        <span v-else class="inline-flex items-center gap-1 bg-pink-100 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full">✗ Loss</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </div>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { t, locale } = useI18n()
const { isObserverMode, observerToken } = useAgentAuth()

const watchedAgentInfo = ref<any>(null)



interface Entry {
  agentName: string
  betTime: string | Date
  number?: number
}

interface RoundStatus {
  roundNumber: number
  status: 'waiting' | 'calculating' | 'resolved'
  count: number
  total: number
  sumOfNumbers: number
  avgNumber: number
  entries: Entry[]
}

interface HistoryRound {
  roundNumber: number
  status: string
  startTime: string
  endTime: string
  entries: (Entry & { agentId: string; number: number })[]
  winningNumber: number
  winReason: string
  winners: string[]
  prizePerWinner: number
  numberFrequency: Record<number, number>
}

const status = ref<RoundStatus | null>(null)
const history = ref<HistoryRound[]>([])
const loading = ref(true)

const progressPct = computed(() => {
  if (!status.value) return 0
  return Math.round((status.value.count / status.value.total) * 100)
})

const sortedEntries = computed(() => {
  if (!status.value?.entries) return []
  return [...status.value.entries].reverse()
})

const statusLabel = computed(() => {
  switch (status.value?.status) {
    case 'waiting': return t('atown.status.waiting')
    case 'calculating': return t('atown.status.calculating')
    default: return '—'
  }
})

function formatTime(d: string | Date) {
  const date = new Date(d)
  const l = locale.value === 'zh' ? 'zh-CN' : 'en-US'
  return date.toLocaleTimeString(l, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(d: string | Date) {
  const date = new Date(d)
  const l = locale.value === 'zh' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(l, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}


function getAgentName(entries: Entry[], agentId: string) {
  const e = (entries as any[]).find((x: any) => x.agentId === agentId)
  return e?.agentName ?? agentId.slice(-6)
}

function barHeight(freq: Record<number, number>, n: number) {
  if (!freq) return 0
  const max = Math.max(...Object.values(freq))
  const val = freq[n] ?? 0
  return max > 0 ? Math.round((val / max) * 60) + 4 : 4
}

async function fetchStatus() {
  try {
    const res = await fetch('/api/atown/status')
    if (res.ok) status.value = await res.json()
  } catch (e) { /* silent */ }
}

async function fetchHistory() {
  try {
    const res = await fetch('/api/atown/history?limit=10')
    if (res.ok) {
      const data = await res.json()
      history.value = data.rounds
    }
  } catch (e) { /* silent */ }
}

async function fetchWatchedAgent() {
  if (!isObserverMode.value) return
  try {
    const data = await $fetch('/api/agent/info', {
      query: { token: observerToken.value }
    })
    watchedAgentInfo.value = data
  } catch (e) {
    console.error('Failed to fetch watched agent info', e)
  }
}

onMounted(async () => {
  await Promise.all([fetchStatus(), fetchHistory(), fetchWatchedAgent()])
  loading.value = false

  // Poll every 3 seconds
  setInterval(async () => {
    await fetchStatus()
    await fetchHistory()
    await fetchWatchedAgent()
  }, 3000)
})
</script>

<style scoped>
/* Custom scrollbar for entry list */
.max-h-72::-webkit-scrollbar { width: 6px; }
.max-h-72::-webkit-scrollbar-track { background: transparent; }
.max-h-72::-webkit-scrollbar-thumb { background: #FFCCD9; border-radius: 6px; }
.max-h-72::-webkit-scrollbar-thumb:hover { background: #FFB0C8; }

/* Animation keyframes */
@keyframes slideIn { 
  from { opacity: 0; transform: translateY(-6px); } 
  to { opacity: 1; transform: translateY(0); }
}

/* Entry row animation */
.kawaii-card {
  animation: slideIn 0.3s ease;
}
</style>
