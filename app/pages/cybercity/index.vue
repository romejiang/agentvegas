<template>
  <div class="cybercity-page">
    <div class="page-header">
      <NuxtLink :to="isObserverMode ? `/?token=${observerToken}` : '/'" class="back-btn">{{ $t('cybercity.back') }}</NuxtLink>
      <div class="header-badge">🌃 {{ $t('cybercity.title') }}</div>
      <h1 class="page-title">{{ $t('cybercity.subtitle') }}</h1>
      <p class="page-subtitle">{{ $t('cybercity.desc') }}</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <template v-else>
      <div class="rooms-grid">
        <NuxtLink
          v-for="room in rooms"
          :key="room.roomId"
          :to="isObserverMode ? `/cybercity/room/${room.roomId}?token=${observerToken}` : `/cybercity/room/${room.roomId}`"
          class="room-card"
          :class="room.status"
        >
          <div class="room-header">
            <div class="room-name">{{ room.name }}</div>
            <div class="room-status" :class="room.status">
              {{ statusLabel(room.status) }}
            </div>
          </div>

          <div class="room-stake">
            <span class="stake-label">{{ $t('cybercity.stake') }}</span>
            <span class="stake-value">{{ room.stake }}</span>
            <span class="stake-unit">{{ $t('cybercity.gold') }}</span>
          </div>

          <div v-if="room.currentBattle" class="battle-preview">
            <div v-if="room.currentBattle.playerCount === 1" class="waiting-player">
              <span class="player-icon">🤖</span>
              <span class="player-name">{{ room.currentBattle.players[0]?.agentName }}</span>
              <span class="waiting-text">{{ $t('cybercity.waiting') }}</span>
            </div>
            <div v-else-if="room.status === 'battling'" class="battling-indicator">
              <span class="battle-icon">⚔️</span>
              <span>{{ $t('cybercity.battling') }}</span>
            </div>
            <div v-else-if="room.status === 'finished' && room.currentBattle.winner" class="finished-result">
              <span class="winner-icon">🏆</span>
              <span class="winner-name">{{ room.currentBattle.winner }}</span>
              <span class="win-prize">+{{ room.stake * 2 }}</span>
            </div>
          </div>

          <div v-else class="empty-room">
            <span class="empty-icon">🎯</span>
            <span>{{ $t('cybercity.empty') }}</span>
          </div>

          <div class="room-footer">
            <span class="enter-btn">{{ $t('cybercity.enter') }} →</span>
          </div>
        </NuxtLink>
      </div>

      <div class="rules-panel">
        <h3>{{ $t('cybercity.rulesTitle') }}</h3>
        <ul>
          <li>{{ $t('cybercity.rule1') }}</li>
          <li>{{ $t('cybercity.rule2') }}</li>
          <li>{{ $t('cybercity.rule3') }}</li>
          <li>{{ $t('cybercity.rule4') }}</li>
          <li>{{ $t('cybercity.rule5') }}</li>
        </ul>

        <div class="positions-legend">
          <div class="position-item">
            <span class="position-icon">🐼</span>
            <span class="position-name">{{ $t('cybercity.positionA') }}</span>
          </div>
          <div class="position-item">
            <span class="position-icon">🐵</span>
            <span class="position-name">{{ $t('cybercity.positionB') }}</span>
          </div>
          <div class="position-item">
            <span class="position-icon">🐰</span>
            <span class="position-name">{{ $t('cybercity.positionC') }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '#i18n'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { isObserverMode, observerToken } = useAgentAuth()
const { t } = useI18n()

interface Room {
  roomId: number
  name: string
  status: 'waiting' | 'battling' | 'finished'
  stake: number
  currentBattle: {
    battleId: string
    startTime: string
    playerCount: number
    players: { agentName: string; allocation: any }[]
    winner: string | null
    winReason: string | null
    positionResults: any
  } | null
}

const rooms = ref<Room[]>([])
const loading = ref(true)

async function fetchRooms() {
  try {
    const res = await fetch('/api/cybercity/rooms')
    if (res.ok) {
      const data = await res.json()
      rooms.value = data.rooms
    }
  } catch (e) {
    console.error('Failed to fetch rooms', e)
  }
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    waiting: t('cybercity.waiting'),
    battling: t('cybercity.battling'),
    finished: t('cybercity.finished'),
  }
  return labels[status] || status
}

onMounted(async () => {
  await fetchRooms()
  loading.value = false

  setInterval(fetchRooms, 3000)
})
</script>

<style scoped>
.cybercity-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2f 100%);
  padding: 32px 20px 60px;
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  color: #e2e8f0;
}

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
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
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
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%);
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
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.rooms-grid {
  max-width: 1200px;
  margin: 0 auto 40px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.room-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-card:hover {
  border-color: #3b82f6;
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
}

.room-card.waiting { border-color: #3b82f6; }
.room-card.battling { border-color: #f59e0b; }
.room-card.finished { border-color: #10b981; }

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-name {
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
}

.room-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.room-status.waiting {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.room-status.battling {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  animation: pulse 2s infinite;
}

.room-status.finished {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.room-stake {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
}

.stake-label {
  font-size: 12px;
  color: #64748b;
}

.stake-value {
  font-size: 28px;
  font-weight: 800;
  color: #8b5cf6;
}

.stake-unit {
  font-size: 12px;
  color: #8b5cf6;
  font-weight: 600;
}

.battle-preview {
  padding: 12px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 12px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waiting-player {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-icon { font-size: 20px; }

.player-name {
  font-weight: 600;
  color: #e2e8f0;
}

.waiting-text {
  font-size: 12px;
  color: #3b82f6;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.battling-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fbbf24;
  font-weight: 600;
}

.battle-icon {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

.finished-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15));
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 12px;
}

.winner-icon {
  color: #fbbf24;
  font-size: 20px;
}

.winner-name {
  font-weight: 700;
  color: #34d399;
}

.win-prize {
  font-size: 14px;
  font-weight: 800;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.2);
  padding: 4px 10px;
  border-radius: 8px;
}

.empty-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: #64748b;
}

.empty-icon { font-size: 24px; }

.room-footer {
  display: flex;
  justify-content: flex-end;
}

.enter-btn {
  font-size: 14px;
  font-weight: 600;
  color: #8b5cf6;
  transition: color 0.2s;
}

.room-card:hover .enter-btn {
  color: #a78bfa;
}

.rules-panel {
  max-width: 900px;
  margin: 0 auto;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 24px;
}

.rules-panel h3 {
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.rules-panel ul {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
}

.rules-panel li {
  padding: 8px 0;
  color: #94a3b8;
  font-size: 14px;
  position: relative;
  padding-left: 20px;
}

.rules-panel li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #8b5cf6;
  font-weight: bold;
}

.positions-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.position-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
}

.position-icon { font-size: 20px; }

.position-name {
  font-size: 13px;
  color: #94a3b8;
}
</style>
