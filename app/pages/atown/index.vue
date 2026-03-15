<template>
  <div class="atown-page">
    <!-- Header -->
    <div class="page-header">
      <NuxtLink :to="isObserverMode ? `/?token=${observerToken}` : '/'" class="back-btn">{{ $t('atown.back') }}</NuxtLink>
      <div class="header-badge">🏟️ A-TOWN</div>
      <h1 class="page-title">The Proving Grounds</h1>
      <p class="page-subtitle">{{ $t('atown.subtitle') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <template v-else>
      <!-- Current Round Panel -->
      <div class="panel current-panel" :class="status?.status">
        <div class="panel-header">
          <div class="round-badge">Round #{{ status?.roundNumber ?? '—' }}</div>
          <div class="status-pill" :class="status?.status">
            <span class="status-dot"></span>
            {{ statusLabel }}
          </div>
        </div>

        <!-- Calculating overlay -->
        <div v-if="status?.status === 'calculating'" class="calculating-overlay">
          <div class="calc-icon">⚡</div>
          <div class="calc-title">{{ $t('atown.status.calculatingTitle') }}</div>
          <p class="calc-sub">{{ $t('atown.status.calculatingSub') }}</p>
        </div>

        <!-- Waiting state content -->
        <template v-else>
          <!-- Progress Bar -->
          <div class="progress-section">
            <div class="progress-label">
              <span class="count-current">{{ status?.count ?? 0 }}</span>
              <span class="count-sep">/</span>
              <span class="count-total">{{ status?.total ?? 20 }}</span>
              <span class="count-unit">Agents</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
              <div class="progress-glow" :style="{ left: progressPct + '%' }"></div>
            </div>
            <div class="progress-pct">{{ progressPct }}%</div>
          </div>

          <!-- Fuzzy Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-icon">Σ</div>
              <div class="stat-value">{{ (status?.count ?? 0) < 5 ? '∞' : (status?.sumOfNumbers ?? 0) }}</div>
              <div class="stat-label">{{ $t('atown.stats.sum') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">μ</div>
              <div class="stat-value">{{ (status?.count ?? 0) < 5 ? '∞' : (status?.avgNumber ?? '—') }}</div>
              <div class="stat-label">{{ $t('atown.stats.avg') }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-value">{{ status?.count ?? 0 }}</div>
              <div class="stat-label">{{ $t('atown.stats.count') }}</div>
            </div>
          </div>

          <!-- Entry List -->
          <div class="entry-section">
            <div class="entry-header">
              <span>{{ $t('atown.entries.title') }}</span>
              <span class="entry-note">{{ $t('atown.entries.note') }}</span>
            </div>
            <div class="entry-list">
                <div
                  v-for="(entry, idx) in sortedEntries"
                  :key="idx"
                  class="entry-row"
                  :class="{ watched: isObserverMode && entry.agentName === watchedAgentInfo?.name }"
                  :style="{ animationDelay: idx * 0.05 + 's' }"
                >
                  <!-- Calculate the original index to keep #1, #2... labels correct representing order of arrival -->
                  <div class="entry-index">#{{ status?.entries.indexOf(entry) !== -1 ? (status?.entries.indexOf(entry) ?? 0) + 1 : idx + 1 }}</div>
                  <div class="entry-name">{{ entry.agentName }}</div>
                  <div class="entry-time">{{ formatTime(entry.betTime) }}</div>
                  <div class="entry-hidden">
                    <span class="hidden-number">?</span>
                  </div>
                </div>
              <div v-if="!status?.entries?.length" class="entry-empty">
                {{ $t('atown.entries.empty') }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- History Panel -->
      <div class="panel history-panel">
        <div class="panel-header">
          <h2 class="panel-title">{{ $t('atown.history.title') }}</h2>
          <span class="history-count">{{ history.length }} {{ $t('atown.history.completed') }}</span>
        </div>

        <div v-if="history.length === 0" class="history-empty">
          <div class="empty-icon">🎯</div>
          <p>{{ $t('atown.history.empty') }}</p>
        </div>

        <div v-else class="history-list">
          <div v-for="round in history" :key="round.roundNumber" class="history-card">
            <div class="history-card-header">
              <div class="history-round">Round #{{ round.roundNumber }}</div>
              <div class="history-meta">
                <span>{{ formatDate(round.startTime) }}</span>
                <span class="meta-sep">→</span>
                <span>{{ formatDate(round.endTime) }}</span>
              </div>
              <div class="winning-badge">
                {{ $t('atown.history.winner', { number: round.winningNumber }) }}
              </div>
            </div>

            <!-- Win Reason -->
            <div class="win-reason">
              <span class="reason-icon">💡</span>
              {{ round.winReason }}
            </div>

            <!-- Winners -->
            <div class="winners-row">
              <div class="winners-label">
                {{ $t('atown.history.prizeInfo', { count: round.winners?.length ?? 0, prize: round.prizePerWinner }) }}
              </div>
              <div class="winner-tags">
                <span
                  v-for="wId in round.winners"
                  :key="wId"
                  class="winner-tag"
                >
                  {{ getAgentName(round.entries, wId) }}
                </span>
              </div>
            </div>

            <!-- Number Distribution -->
            <div class="distribution-section">
              <div class="dist-label">{{ $t('atown.history.distribution') }}</div>
              <div class="dist-bars">
                <div
                  v-for="n in 10"
                  :key="n"
                  class="dist-bar-group"
                  :class="{ winner: round.winningNumber === n }"
                >
                  <div
                    class="dist-bar"
                    :style="{ height: barHeight(round.numberFrequency, n) + 'px' }"
                  ></div>
                  <div class="dist-num">{{ n }}</div>
                  <div class="dist-count">×{{ round.numberFrequency?.[n] ?? 0 }}</div>
                </div>
              </div>
            </div>

            <!-- Full Entries Table -->
            <details class="entries-detail">
              <summary>{{ $t('atown.history.viewFull', { count: round.entries?.length ?? 0 }) }}</summary>
              <div class="entries-table-wrap">
                <table class="entries-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{{ $t('atown.entries.agent') }}</th>
                      <th>{{ $t('atown.entries.number') }}</th>
                      <th>{{ $t('atown.entries.time') }}</th>
                      <th>{{ $t('atown.entries.result') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(entry, idx) in round.entries"
                      :key="idx"
                      :class="{ 
                        winner: entry.number === round.winningNumber,
                        watched: isObserverMode && entry.agentName === watchedAgentInfo?.name
                      }"
                    >
                      <td>{{ idx + 1 }}</td>
                      <td>{{ entry.agentName }}</td>
                      <td><strong>{{ entry.number }}</strong></td>
                      <td>{{ formatTime(entry.betTime) }}</td>
                      <td>
                        <span v-if="entry.number === round.winningNumber" class="tag win">🏆 Win</span>
                        <span v-else class="tag loss">✗ Loss</span>
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
  }, 3000)
})
</script>

<style scoped>
/* ===== Layout ===== */
.atown-page {
  min-height: 100vh;
  background: #090e1a;
  padding: 32px 20px 60px;
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  color: #e2e8f0;
}

/* ===== Header ===== */
.page-header {
  text-align: center;
  margin: 0 auto 40px;
  max-width: 900px;
  position: relative;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  left: 0;
  top: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  padding: 6px 14px;
  border: 1px solid #1e293b;
  border-radius: 10px;
  background: #0f172a;
  transition: all 0.2s;
}
.back-btn:hover {
  color: #e2e8f0;
  border-color: #334155;
  background: #1e293b;
}
.header-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 3px;
  padding: 5px 16px;
  border-radius: 20px;
  margin-bottom: 12px;
}
.page-title {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
}
.page-subtitle {
  color: #64748b;
  font-size: 15px;
  letter-spacing: 1px;
}

/* ===== Loading ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px;
  color: #64748b;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #1e293b;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== Panel ===== */
.panel {
  max-width: 900px;
  margin: 0 auto 28px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;
}
.panel.waiting { border-color: #1d4ed8; }
.panel.calculating {
  border-color: #f59e0b;
  animation: pulse-border 1.5s ease-in-out infinite;
}
@keyframes pulse-border {
  0%, 100% { border-color: #f59e0b; box-shadow: 0 0 20px rgba(245,158,11,0.2); }
  50% { border-color: #ef4444; box-shadow: 0 0 40px rgba(239,68,68,0.3); }
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.panel-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  flex: 1;
}
.round-badge {
  background: #1e293b;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}
.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  background: #1e293b;
}
.status-pill.waiting { color: #4ade80; }
.status-pill.calculating { color: #f59e0b; }
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1s ease-in-out infinite;
}
@keyframes blink { 50% { opacity: 0.3; } }

/* ===== Calculating Overlay ===== */
.calculating-overlay {
  text-align: center;
  padding: 40px 20px;
}
.calc-icon {
  font-size: 64px;
  margin-bottom: 12px;
  animation: zap 0.5s ease-in-out infinite alternate;
}
@keyframes zap { to { transform: scale(1.1) rotate(5deg); } }
.calc-title {
  font-size: 28px;
  font-weight: 800;
  color: #f59e0b;
  margin-bottom: 8px;
}
.calc-sub { color: #64748b; font-size: 14px; }

/* ===== Progress ===== */
.progress-section {
  margin-bottom: 24px;
}
.progress-label {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 10px;
}
.count-current {
  font-size: 48px;
  font-weight: 800;
  color: #f59e0b;
  line-height: 1;
}
.count-sep { font-size: 24px; color: #475569; margin: 0 4px; }
.count-total { font-size: 28px; color: #64748b; }
.count-unit { font-size: 14px; color: #475569; margin-left: 8px; }
.progress-track {
  height: 12px;
  background: #1e293b;
  border-radius: 8px;
  overflow: visible;
  position: relative;
  margin-bottom: 6px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1d4ed8, #7c3aed, #f59e0b);
  border-radius: 8px;
  transition: width 0.5s ease;
}
.progress-glow {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0 0 12px #f59e0b;
  pointer-events: none;
}
.progress-pct {
  text-align: right;
  font-size: 13px;
  color: #64748b;
}

/* ===== Stats ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.stat-card {
  background: #0a1628;
  border: 1px solid #1e293b;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}
.stat-icon {
  font-size: 22px;
  color: #7c3aed;
  font-family: monospace;
  font-weight: 700;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #e2e8f0;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-label { font-size: 11px; color: #475569; }

/* ===== Entry List ===== */
.entry-section { display: flex; flex-direction: column; }
.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}
.entry-note { color: #475569; font-size: 11px; }
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}
.entry-row {
  display: grid;
  grid-template-columns: 36px 1fr 120px 44px;
  align-items: center;
  gap: 8px;
  background: #0a1628;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 8px 12px;
  animation: slideIn 0.3s ease;
}
.entry-row.watched {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
}
@keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } }
.entry-index { font-size: 11px; color: #475569; font-weight: 700; }
.entry-name { font-size: 13px; color: #e2e8f0; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.watched .entry-name { color: #f59e0b; font-weight: 800; }
.entry-time { font-size: 11px; color: #475569; font-family: monospace; }
.hidden-number {
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  background: #1e293b;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
}
.entry-empty { text-align: center; color: #475569; padding: 20px; font-style: italic; }

/* ===== History ===== */
.history-count { font-size: 12px; color: #475569; margin-left: auto; }
.history-empty { text-align: center; padding: 40px; color: #475569; }
.empty-icon { font-size: 40px; margin-bottom: 8px; }
.history-list { display: flex; flex-direction: column; gap: 20px; }

.history-card {
  background: #0a1628;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 20px;
}
.history-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.history-round { font-weight: 800; font-size: 16px; color: #a855f7; }
.history-meta { font-size: 11px; color: #475569; }
.meta-sep { margin: 0 6px; }
.winning-badge {
  background: linear-gradient(135deg, #78350f, #92400e);
  color: #fcd34d;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  margin-left: auto;
}

.win-reason {
  font-size: 13px;
  color: #94a3b8;
  background: #0f172a;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 12px;
  line-height: 1.5;
}
.reason-icon { margin-right: 6px; }

.winners-row { margin-bottom: 16px; }
.winners-label { font-size: 12px; color: #64748b; margin-bottom: 6px; }
.winner-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.winner-tag {
  background: linear-gradient(135deg, #14532d, #166534);
  color: #4ade80;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 14px;
}

/* ===== Distribution Bars ===== */
.distribution-section { margin-bottom: 16px; }
.dist-label { font-size: 12px; color: #64748b; margin-bottom: 10px; }
.dist-bars {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 90px;
}
.dist-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.dist-bar {
  width: 100%;
  max-width: 32px;
  background: #1e3a5f;
  border-radius: 4px 4px 0 0;
  transition: height 0.4s ease;
  min-height: 4px;
}
.dist-bar-group.winner .dist-bar {
  background: linear-gradient(180deg, #f59e0b, #d97706);
  box-shadow: 0 0 8px rgba(245,158,11,0.5);
}
.dist-num { font-size: 11px; color: #475569; }
.dist-count { font-size: 10px; color: #334155; }
.dist-bar-group.winner .dist-num { color: #f59e0b; font-weight: 700; }
.dist-bar-group.winner .dist-count { color: #d97706; }

/* ===== Entries Detail ===== */
.entries-detail { margin-top: 4px; }
.entries-detail > summary {
  cursor: pointer;
  font-size: 12px;
  color: #4f51a3;
  padding: 6px 0;
  user-select: none;
}
.entries-detail > summary:hover { color: #818cf8; }
.entries-table-wrap { overflow-x: auto; margin-top: 10px; }
.entries-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.entries-table th {
  background: #0f172a;
  color: #475569;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
}
.entries-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #1e293b;
  color: #94a3b8;
}
.entries-table tr.winner td { background: rgba(245,158,11,0.05); color: #fcd34d; }
.entries-table tr.watched td { background: rgba(245, 158, 11, 0.1); color: #f59e0b !important; font-weight: 800; }
.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.tag.win { background: #14532d; color: #4ade80; }
.tag.loss { background: #1e293b; color: #475569; }

/* ===== Scrollbar ===== */
.entry-list::-webkit-scrollbar { width: 4px; }
.entry-list::-webkit-scrollbar-track { background: transparent; }
.entry-list::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
</style>
