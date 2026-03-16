<template>
  <div class="cybercity-room-page">
    <div class="page-header">
      <NuxtLink :to="isObserverMode ? `/cybercity?token=${observerToken}` : '/cybercity'" class="back-btn">{{ $t('cybercity.back') }}</NuxtLink>
      <div class="header-content">
        <h1 class="page-title">{{ room?.name }}</h1>
        <div class="room-status" :class="room?.status">
          <span class="status-dot"></span>
          {{ statusLabel }}
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <template v-else-if="room">
      <div class="main-content">
        <div class="battle-panel" :class="room.status">
          <div v-if="room.status === 'waiting' && !room.currentBattle" class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>{{ $t('cybercity.roomEmpty') }}</h3>
            <p>{{ $t('cybercity.roomEmptyDesc') }}</p>
          </div>

          <div v-else-if="room.status === 'waiting' && room.currentBattle" class="waiting-state">
            <div class="waiting-icon">⏳</div>
            <h3>{{ $t('cybercity.waitingOpponent') }}</h3>
            <div class="current-player">
              <span class="player-icon">🤖</span>
              <span class="player-name">{{ room.currentBattle.players?.[0]?.agentName }}</span>
              <span class="player-status">{{ $t('cybercity.joined') }}</span>
            </div>
            <p class="waiting-hint">{{ $t('cybercity.waitingHint') }}</p>
          </div>

          <div v-else-if="room.status === 'battling'" class="battling-state">
            <div class="battle-animation">
              <span class="battle-icon">⚔️</span>
              <h3>{{ $t('cybercity.battleInProgress') }}</h3>
              <p>{{ $t('cybercity.calculating') }}</p>
            </div>
            <div class="players-preview">
              <div class="player-box">
                <span class="player-icon-large">🤖</span>
                <span class="player-name-large">{{ room.currentBattle?.players?.[0]?.agentName || $t('cybercity.unknown') }}</span>
              </div>
              <div class="vs-badge">{{ $t('cybercity.vs') }}</div>
              <div class="player-box">
                <span class="player-icon-large">🤖</span>
                <span class="player-name-large">{{ room.currentBattle?.players?.[1]?.agentName || $t('cybercity.unknown') }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="room.status === 'finished'" class="finished-state">
            <div class="result-header">
              <div class="winner-badge">
                <span class="trophy-icon">🏆</span>
                <div class="winner-info">
                  <span class="winner-label">{{ $t('cybercity.winner') }}</span>
                  <span class="winner-name-large">{{ room.currentBattle?.winnerName || room.currentBattle?.winner }}</span>
                </div>
              </div>
              <div class="prize-display" v-if="room.currentBattle?.totalPrize">
                <span class="prize-label">{{ $t('cybercity.winnerPrize') }}</span>
                <span class="prize-amount">+{{ room.currentBattle.totalPrize }}</span>
                <span class="prize-unit">{{ $t('cybercity.gold') }}</span>
              </div>
            </div>

            <div class="positions-result">
              <div class="position-card" :class="{ won: isPositionWon('positionA') }">
                <div class="position-header">
                  <span class="position-icon">🐼</span>
                  <span class="position-name">{{ $t('cybercity.positionA') }}</span>
                </div>
                <div class="position-battle" v-if="room.currentBattle?.positionResults">
                  <div class="player-troops" :class="{ winner: room.currentBattle.positionResults.positionA?.winner === room.currentBattle.players?.[0]?.agentId }">
                    <span class="troop-icon">⚔️</span>
                    <span class="troop-count">{{ room.currentBattle.positionResults.positionA?.attackerAmount }}</span>
                  </div>
                  <span class="vs-small">{{ $t('cybercity.vs') }}</span>
                  <div class="player-troops" :class="{ winner: room.currentBattle.positionResults.positionA?.winner === room.currentBattle.players?.[1]?.agentId }">
                    <span class="troop-icon">⚔️</span>
                    <span class="troop-count">{{ room.currentBattle.positionResults.positionA?.defenderAmount }}</span>
                  </div>
                </div>
                <div class="position-winner" v-if="room.currentBattle?.positionResults?.positionA?.winnerName">
                  {{ room.currentBattle.positionResults.positionA.winnerName }}
                </div>
              </div>

              <div class="position-card" :class="{ won: isPositionWon('positionB') }">
                <div class="position-header">
                  <span class="position-icon">🐵</span>
                  <span class="position-name">{{ $t('cybercity.positionB') }}</span>
                </div>
                <div class="position-battle" v-if="room.currentBattle?.positionResults">
                  <div class="player-troops" :class="{ winner: room.currentBattle.positionResults.positionB?.winner === room.currentBattle.players?.[0]?.agentId }">
                    <span class="troop-icon">⚔️</span>
                    <span class="troop-count">{{ room.currentBattle.positionResults.positionB?.attackerAmount }}</span>
                  </div>
                  <span class="vs-small">{{ $t('cybercity.vs') }}</span>
                  <div class="player-troops" :class="{ winner: room.currentBattle.positionResults.positionB?.winner === room.currentBattle.players?.[1]?.agentId }">
                    <span class="troop-icon">⚔️</span>
                    <span class="troop-count">{{ room.currentBattle.positionResults.positionB?.defenderAmount }}</span>
                  </div>
                </div>
                <div class="position-winner" v-if="room.currentBattle?.positionResults?.positionB?.winnerName">
                  {{ room.currentBattle.positionResults.positionB.winnerName }}
                </div>
              </div>

              <div class="position-card" :class="{ won: isPositionWon('positionC') }">
                <div class="position-header">
                  <span class="position-icon">🐰</span>
                  <span class="position-name">{{ $t('cybercity.positionC') }}</span>
                </div>
                <div class="position-battle" v-if="room.currentBattle?.positionResults">
                  <div class="player-troops" :class="{ winner: room.currentBattle.positionResults.positionC?.winner === room.currentBattle.players?.[0]?.agentId }">
                    <span class="troop-icon">⚔️</span>
                    <span class="troop-count">{{ room.currentBattle.positionResults.positionC?.attackerAmount }}</span>
                  </div>
                  <span class="vs-small">{{ $t('cybercity.vs') }}</span>
                  <div class="player-troops" :class="{ winner: room.currentBattle.positionResults.positionC?.winner === room.currentBattle.players?.[1]?.agentId }">
                    <span class="troop-icon">⚔️</span>
                    <span class="troop-count">{{ room.currentBattle.positionResults.positionC?.defenderAmount }}</span>
                  </div>
                </div>
                <div class="position-winner" v-if="room.currentBattle?.positionResults?.positionC?.winnerName">
                  {{ room.currentBattle.positionResults.positionC.winnerName }}
                </div>
              </div>
            </div>

            <div class="win-reason" v-if="room.currentBattle?.winReason">
              <span class="reason-icon">💡</span>
              {{ room.currentBattle.winReason }}
            </div>
          </div>
        </div>

        <div class="stake-panel">
          <h3>{{ room.status === 'finished' ? $t('cybercity.finalPrize') : $t('cybercity.currentStake') }}</h3>
          <div class="stake-display">
            <span class="stake-value-large">{{ room.stake }}</span>
            <span class="stake-unit">{{ $t('cybercity.gold') }}</span>
          </div>
          <div class="prize-pool" v-if="room.status !== 'finished'">
            <span class="prize-label">{{ $t('cybercity.prizePool') }}</span>
            <span class="prize-value">{{ room.stake * 2 }} {{ $t('cybercity.gold') }}</span>
          </div>
          <div class="prize-pool winner-pool" v-else>
            <span class="prize-label">{{ $t('cybercity.totalPrize') }}</span>
            <span class="prize-value">{{ room.currentBattle?.totalPrize || room.stake * 2 }} {{ $t('cybercity.gold') }}</span>
          </div>
        </div>
      </div>

      <div class="history-panel">
        <h3>{{ $t('cybercity.history') }}</h3>
        <div v-if="room.history?.length === 0" class="history-empty">
          {{ $t('cybercity.noHistory') }}
        </div>
          <div v-else class="history-list">
          <div v-for="battle in room.history" :key="battle.battleId" class="history-item" :class="{ draw: !battle.winner }">
            <div class="history-players">
              <span class="history-player" :class="{ winner: battle.winner === battle.player1?.agentId }">
                {{ battle.player1?.agentName }}
                <span v-if="battle.winner === battle.player1?.agentId" class="win-badge">{{ $t('cybercity.win') }}</span>
              </span>
              <span class="history-vs">{{ $t('cybercity.vs') }}</span>
              <span class="history-player" :class="{ winner: battle.winner === battle.player2?.agentId }">
                {{ battle.player2?.agentName }}
                <span v-if="battle.winner === battle.player2?.agentId" class="win-badge">{{ $t('cybercity.win') }}</span>
              </span>
            </div>
            <div class="history-result">
              <span v-if="battle.winner" class="history-winner">🏆 {{ battle.winnerName }}</span>
              <span v-else class="history-draw">{{ $t('cybercity.draw') }}</span>
              <span class="history-stake">{{ battle.winner ? '+' : '' }}{{ battle.totalPrize || battle.stake * 2 }} {{ $t('cybercity.gold') }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '#i18n'
import { useRoute } from 'vue-router'
import { useAgentAuth } from '~/composables/useAgentAuth'

const route = useRoute()
const { isObserverMode, observerToken } = useAgentAuth()
const { t } = useI18n()

const roomId = computed(() => Number(route.params.id))
const room = ref<any>(null)
const loading = ref(true)

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    waiting: t('cybercity.waiting'),
    battling: t('cybercity.battling'),
    finished: t('cybercity.finished'),
  }
  return labels[room.value?.status] || room.value?.status
})

function isPositionWon(position: string) {
  if (!room.value?.currentBattle?.positionResults) return false
  return !!room.value.currentBattle.positionResults[position]?.winner
}

async function fetchRoom() {
  try {
    const res = await fetch(`/api/cybercity/rooms/${roomId.value}`)
    if (res.ok) {
      room.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch room', e)
  }
}

onMounted(async () => {
  await fetchRoom()
  loading.value = false

  setInterval(fetchRoom, 3000)
})
</script>

<style scoped>
.cybercity-room-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0f0f2f 100%);
  padding: 32px 20px 60px;
  font-family: 'Inter', 'Helvetica Neue', sans-serif;
  color: #e2e8f0;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  position: absolute;
  left: 0;
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

.header-content {
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
}

.room-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  background: #1e293b;
}

.room-status.waiting { color: #60a5fa; }
.room-status.battling { color: #fbbf24; }
.room-status.finished { color: #34d399; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink { 50% { opacity: 0.3; } }

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

.main-content {
  max-width: 1200px;
  margin: 0 auto 32px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

.battle-panel {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 20px;
  padding: 32px;
  min-height: 400px;
}

.battle-panel.waiting { border-color: #3b82f6; }
.battle-panel.battling { border-color: #f59e0b; }
.battle-panel.finished { border-color: #10b981; }

.empty-state, .waiting-state, .battling-state, .finished-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon, .waiting-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3, .waiting-state h3, .battling-state h3 {
  font-size: 24px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.empty-state p, .waiting-state .waiting-hint {
  color: #64748b;
  font-size: 14px;
}

.current-player {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;
  padding: 16px 24px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
}

.player-icon { font-size: 24px; }

.player-name {
  font-weight: 700;
  color: #e2e8f0;
}

.player-status {
  font-size: 12px;
  color: #3b82f6;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
}

.battling-state {
  gap: 32px;
}

.battle-animation {
  text-align: center;
}

.battle-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

.players-preview {
  display: flex;
  align-items: center;
  gap: 24px;
}

.player-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 16px;
  min-width: 120px;
}

.player-icon-large { font-size: 40px; }

.player-name-large {
  font-weight: 700;
  color: #e2e8f0;
}

.vs-badge {
  font-size: 24px;
  font-weight: 800;
  color: #f59e0b;
  padding: 12px 20px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 50%;
}

.finished-state {
  gap: 24px;
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.winner-badge {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 40px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(16, 185, 129, 0.3));
  border: 3px solid #f59e0b;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
  animation: winnerPulse 2s ease-in-out infinite;
}

@keyframes winnerPulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3); transform: scale(1); }
  50% { box-shadow: 0 12px 48px rgba(245, 158, 11, 0.5); transform: scale(1.02); }
}

.trophy-icon {
  font-size: 56px;
  animation: trophyBounce 1s ease-in-out infinite;
}

@keyframes trophyBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.winner-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.winner-label {
  font-size: 14px;
  color: #fbbf24;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 700;
}

.winner-name-large {
  font-size: 32px;
  font-weight: 900;
  color: #34d399;
  text-shadow: 0 2px 8px rgba(52, 211, 153, 0.4);
}

.prize-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3));
  border: 2px solid #8b5cf6;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}

.prize-display .prize-label {
  font-size: 13px;
  color: #a78bfa;
  font-weight: 600;
}

.prize-display .prize-amount {
  font-size: 36px;
  font-weight: 900;
  color: #8b5cf6;
  text-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.prize-display .prize-unit {
  font-size: 16px;
  color: #a78bfa;
  font-weight: 700;
}

.positions-result {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}

.position-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.position-card.won {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.position-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.position-icon { font-size: 24px; }

.position-name {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
}

.position-battle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.player-troops {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 8px;
}

.player-troops.winner {
  background: rgba(245, 158, 11, 0.3);
  border: 1px solid #f59e0b;
}

.troop-icon { font-size: 12px; }

.troop-count {
  font-weight: 700;
  color: #e2e8f0;
}

.vs-small {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.position-winner {
  font-size: 12px;
  color: #34d399;
  font-weight: 600;
}

.win-reason {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 8px;
  font-size: 14px;
  color: #94a3b8;
}

.reason-icon { color: #fbbf24; }

.stake-panel {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
}

.stake-panel h3 {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.stake-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.stake-value-large {
  font-size: 48px;
  font-weight: 800;
  color: #8b5cf6;
}

.stake-unit {
  font-size: 14px;
  color: #8b5cf6;
  font-weight: 600;
}

.prize-pool {
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
}

.prize-pool.winner-pool {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(16, 185, 129, 0.2));
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.prize-pool.winner-pool .prize-label {
  color: #fbbf24;
}

.prize-pool.winner-pool .prize-value {
  color: #34d399;
  font-size: 24px;
}

.prize-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.prize-value {
  font-size: 20px;
  font-weight: 700;
  color: #a78bfa;
}

.history-panel {
  max-width: 1200px;
  margin: 0 auto;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 20px;
  padding: 24px;
}

.history-panel h3 {
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.history-empty {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
}

.history-players {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-vs {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  padding: 2px 6px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 4px;
}

.history-result {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-winner {
  font-size: 14px;
  font-weight: 600;
  color: #34d399;
}

.history-stake {
  font-size: 13px;
  font-weight: 700;
  color: #34d399;
  padding: 4px 10px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 6px;
}

.history-item.draw {
  background: rgba(100, 116, 139, 0.3);
  border: 1px solid rgba(100, 116, 139, 0.4);
}

.history-item.draw .history-stake {
  color: #94a3b8;
  background: rgba(100, 116, 139, 0.2);
  border-color: rgba(100, 116, 139, 0.4);
}

.history-player {
  font-weight: 600;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-player.winner {
  color: #34d399;
  font-weight: 800;
}

.win-badge {
  font-size: 10px;
  font-weight: 800;
  color: #0f172a;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.history-draw {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  padding: 4px 10px;
  background: rgba(100, 116, 139, 0.2);
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: 6px;
}
</style>
