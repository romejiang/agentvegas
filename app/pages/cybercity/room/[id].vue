<template>
  <div class="min-h-screen px-6 pt-6 pb-20 md:px-8 md:pt-8">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <header class="mb-8 relative flex flex-col items-center justify-center min-h-[48px]">
        <!-- 返回按钮：绝对定位左上角 -->
        <NuxtLink :to="isObserverMode ? `/?token=${observerToken}` : '/'" class="absolute left-0 top-0 kawaii-card px-4 py-2 flex items-center space-x-1.5 text-pink-600 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer border border-pink-200 text-sm font-bold">
          <span>←</span>
          <span>{{ $t('cybercity.back') }}</span>
        </NuxtLink>
        <!-- 标题居中 -->
        <div class="flex flex-col items-center gap-2 pt-1">
          <h1 class="text-2xl md:text-3xl font-black text-center">
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-500">
              {{ room?.name || $t('cybercity.title') }}
            </span>
          </h1>
          <div v-if="room" class="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
            :class="{
              'bg-blue-100 text-blue-600': room.status === 'waiting',
              'bg-amber-100 text-amber-600 animate-pulse': room.status === 'battling',
              'bg-emerald-100 text-emerald-600': room.status === 'finished',
            }"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
            {{ statusLabel }}
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
        <div class="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        <p class="text-pink-400 text-sm font-semibold">{{ $t('common.loading') }}</p>
      </div>

      <template v-else-if="room">
        <!-- Main Battle Panel -->
        <div class="kawaii-card p-6 md:p-8 mb-6 relative overflow-hidden border-2"
          :class="{
            'border-blue-200': room.status === 'waiting',
            'border-amber-300': room.status === 'battling',
            'border-emerald-300': room.status === 'finished',
          }"
        >
          <div class="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-5 blur-3xl"
            :class="{
              'bg-violet-400': room.status === 'waiting',
              'bg-amber-400': room.status === 'battling',
              'bg-emerald-400': room.status === 'finished',
            }"
          ></div>

          <div class="grid md:grid-cols-[1fr_220px] gap-6">
            <!-- Battle State -->
            <div class="flex flex-col items-center justify-center text-center min-h-[300px]">

              <!-- Empty: 等待庄家 -->
              <div v-if="room.status === 'waiting' && !room.currentBattle" class="flex flex-col items-center gap-4">
                <div class="text-6xl animate-pulse">👑</div>
                <h3 class="text-xl font-black text-violet-600">{{ $t('cybercity.roomEmpty') }}</h3>
                <p class="text-pink-400/70 text-sm max-w-xs">{{ $t('cybercity.roomEmptyDesc') }}</p>
              </div>

              <!-- Waiting for challenger: 庄家已就位 -->
              <div v-else-if="room.status === 'waiting' && room.currentBattle" class="flex flex-col items-center gap-4">
                <div class="text-6xl animate-bounce">⚔️</div>
                <h3 class="text-xl font-black text-orange-500">{{ $t('cybercity.waitingOpponent') }}</h3>
                <div class="relative flex items-center gap-3 px-5 py-3 rounded-2xl shadow-md transition-all duration-300"
                  :class="[
                    'bg-orange-50 border-2',
                    isObserverMode && room.currentBattle.players?.[0]?.agentName === watchedAgentInfo?.name
                      ? 'border-orange-500 shadow-xl shadow-orange-300/50 bg-gradient-to-r from-orange-100 to-amber-100 scale-105'
                      : 'border-orange-200 shadow-orange-100'
                  ]">
                  <span class="text-2xl">👑</span>
                  <div class="flex flex-col items-start">
                    <span class="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5"
                      :class="isObserverMode && room.currentBattle.players?.[0]?.agentName === watchedAgentInfo?.name ? 'text-orange-600' : 'text-orange-400'">HOST</span>
                    <span class="font-black text-lg leading-tight"
                      :class="isObserverMode && room.currentBattle.players?.[0]?.agentName === watchedAgentInfo?.name ? 'text-orange-800' : 'text-orange-800'">{{ room.currentBattle.players?.[0]?.agentName }}</span>
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full border"
                    :class="isObserverMode && room.currentBattle.players?.[0]?.agentName === watchedAgentInfo?.name
                      ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                      : 'bg-orange-100 text-orange-600 border-orange-200'">{{ $t('cybercity.joined') }}</span>
                  <span v-if="isObserverMode && room.currentBattle.players?.[0]?.agentName === watchedAgentInfo?.name"
                    class="absolute -right-3 -top-2 text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-black shadow-lg border-2 border-white">👀 YOU</span>
                </div>
                <p class="text-orange-500/80 text-xs font-semibold max-w-xs">{{ $t('cybercity.waitingHint') }}</p>
              </div>

              <!-- Battling -->
              <div v-else-if="room.status === 'battling'" class="flex flex-col items-center gap-6">
                <div class="text-6xl" style="animation: shake 0.4s infinite">⚔️</div>
                <h3 class="text-xl font-black text-amber-500">{{ $t('cybercity.battleInProgress') }}</h3>
                <div class="flex items-center gap-4">
                  <div class="relative flex flex-col items-center gap-2 px-6 py-4 rounded-2xl min-w-[110px] transition-all duration-300"
                    :class="[
                      'bg-pink-50 border-2',
                      isObserverMode && room.currentBattle?.players?.[0]?.agentName === watchedAgentInfo?.name
                        ? 'border-orange-500 shadow-xl shadow-orange-300/50 bg-gradient-to-b from-orange-50 to-amber-50 scale-105'
                        : 'border-pink-200'
                    ]">
                    <span v-if="isObserverMode && room.currentBattle?.players?.[0]?.agentName === watchedAgentInfo?.name"
                      class="absolute -top-2 -right-2 text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-black shadow-lg border-2 border-white z-10">👀 YOU</span>
                    <span class="text-3xl">🤖</span>
                    <span class="font-black text-sm"
                      :class="isObserverMode && room.currentBattle?.players?.[0]?.agentName === watchedAgentInfo?.name ? 'text-orange-700' : 'text-rose-600'">
                      {{ room.currentBattle?.players?.[0]?.agentName || $t('cybercity.unknown') }}
                    </span>
                  </div>
                  <div class="text-2xl font-black text-amber-500 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-200">VS</div>
                  <div class="relative flex flex-col items-center gap-2 px-6 py-4 rounded-2xl min-w-[110px] transition-all duration-300"
                    :class="[
                      'bg-pink-50 border-2',
                      isObserverMode && room.currentBattle?.players?.[1]?.agentName === watchedAgentInfo?.name
                        ? 'border-orange-500 shadow-xl shadow-orange-300/50 bg-gradient-to-b from-orange-50 to-amber-50 scale-105'
                        : 'border-pink-200'
                    ]">
                    <span v-if="isObserverMode && room.currentBattle?.players?.[1]?.agentName === watchedAgentInfo?.name"
                      class="absolute -top-2 -right-2 text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-black shadow-lg border-2 border-white z-10">👀 YOU</span>
                    <span class="text-3xl">🤖</span>
                    <span class="font-black text-sm"
                      :class="isObserverMode && room.currentBattle?.players?.[1]?.agentName === watchedAgentInfo?.name ? 'text-orange-700' : 'text-rose-600'">
                      {{ room.currentBattle?.players?.[1]?.agentName || $t('cybercity.unknown') }}
                    </span>
                  </div>
                </div>
                <p class="text-pink-400/70 text-sm animate-pulse">{{ $t('cybercity.calculating') }}</p>
                <!-- 开奖倒计时 -->
                <div v-if="battleCountdown !== null" class="flex flex-col items-center gap-1">
                  <div class="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-md shadow-amber-100">
                    <span class="text-amber-500 text-sm font-bold">{{ $t('cybercity.battleCountdownLabel') }}</span>
                    <span class="text-3xl font-black text-amber-600 tabular-nums min-w-[2ch] text-center">{{ battleCountdown }}</span>
                    <span class="text-amber-500 text-sm font-bold">{{ $t('cybercity.seconds') }}</span>
                  </div>
                  <div class="w-48 h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-400 rounded-full transition-all duration-1000"
                      :style="{ width: `${Math.max(0, (battleCountdown / 3) * 100)}%` }"></div>
                  </div>
                </div>
              </div>

              <!-- Finished -->
              <div v-else-if="room.status === 'finished'" class="flex flex-col items-center gap-4 w-full">
                <div class="flex flex-col items-center gap-3 px-8 py-5 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 w-full max-w-sm" style="animation: winnerPulse 2s ease-in-out infinite">
                  <span class="text-5xl" style="animation: trophyBounce 1s ease-in-out infinite">🏆</span>
                  <div class="text-xs font-black text-amber-500 tracking-widest uppercase">{{ $t('cybercity.winner') }}</div>
                  <div class="text-2xl font-black text-emerald-600">{{ room.currentBattle?.winnerName || room.currentBattle?.winner }}</div>
                </div>
                <div v-if="room.currentBattle?.totalPrize" class="flex items-center gap-2 px-5 py-2 bg-violet-50 border border-violet-200 rounded-full">
                  <span class="text-xs font-bold text-violet-500">{{ $t('cybercity.winnerPrize') }}</span>
                  <span class="text-xl font-black text-violet-600">+{{ room.currentBattle.totalPrize }}</span>
                  <span class="text-xs font-bold text-violet-500">{{ $t('cybercity.gold') }}</span>
                </div>
                <!-- 房间重置倒计时 -->
                <div v-if="resetCountdown !== null" class="flex flex-col items-center gap-1 w-full max-w-xs">
                  <div class="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl w-full">
                    <span class="text-emerald-600 text-sm font-bold">{{ $t('cybercity.resetCountdownLabel') }}</span>
                    <span class="text-3xl font-black text-emerald-600 tabular-nums min-w-[2ch] text-center">{{ resetCountdown }}</span>
                    <span class="text-emerald-600 text-sm font-bold">{{ $t('cybercity.seconds') }}</span>
                  </div>
                  <div class="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                      :style="{ width: `${Math.max(0, (resetCountdown / 30) * 100)}%` }"></div>
                  </div>
                </div>

                <!-- Position results -->
                <div class="grid grid-cols-3 gap-3 w-full mt-2"
                  :class="isObserverMode && (room.currentBattle?.winnerName === watchedAgentInfo?.name || 
                    (room.currentBattle?.players?.[0]?.agentName === watchedAgentInfo?.name && room.currentBattle?.winner === room.currentBattle?.players?.[0]?.agentId) ||
                    (room.currentBattle?.players?.[1]?.agentName === watchedAgentInfo?.name && room.currentBattle?.winner === room.currentBattle?.players?.[1]?.agentId))
                    ? 'p-3 rounded-2xl border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg shadow-orange-200/50' : ''">
                  <div v-for="(posKey, idx) in ['positionA', 'positionB', 'positionC']" :key="posKey"
                    class="border rounded-xl p-3 text-center transition-all"
                    :class="room.currentBattle?.positionResults?.[posKey]?.winner ? 'border-amber-300 bg-amber-50' : 'border-pink-100 bg-white/60'"
                  >
                    <div class="text-xl mb-1">{{ ['🐼', '🐵', '🐰'][idx] }}</div>
                    <div class="text-xs font-bold text-rose-500 mb-2">{{ $t(['cybercity.positionA', 'cybercity.positionB', 'cybercity.positionC'][idx]) }}</div>
                    <div v-if="room.currentBattle?.positionResults?.[posKey]" class="flex items-center justify-center gap-1 text-xs">
                      <span class="font-black" :class="room.currentBattle.positionResults[posKey].winner === room.currentBattle.players?.[0]?.agentId ? 'text-amber-600' : 'text-rose-300'">
                        {{ room.currentBattle.positionResults[posKey].attackerAmount }}
                      </span>
                      <span class="text-pink-300 font-bold">vs</span>
                      <span class="font-black" :class="room.currentBattle.positionResults[posKey].winner === room.currentBattle.players?.[1]?.agentId ? 'text-amber-600' : 'text-rose-300'">
                        {{ room.currentBattle.positionResults[posKey].defenderAmount }}
                      </span>
                    </div>
                    <div v-if="room.currentBattle?.positionResults?.[posKey]?.winnerName" class="text-[10px] font-black text-emerald-600 mt-1">
                      {{ room.currentBattle.positionResults[posKey].winnerName }}
                    </div>
                  </div>
                </div>

                <div v-if="room.currentBattle?.winReason" class="flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-500 font-semibold w-full">
                  <span>💡</span>
                  <span>{{ room.currentBattle.winReason }}</span>
                </div>
              </div>
            </div>

            <!-- Stake Sidebar -->
            <div class="kawaii-card border border-pink-100 p-5 text-center flex flex-col items-center gap-4">
              <div class="text-xs font-black text-pink-400/70 uppercase tracking-widest">
                {{ room.status === 'finished' ? $t('cybercity.finalPrize') : $t('cybercity.currentStake') }}
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-5xl font-black text-violet-600">{{ room.stake }}</span>
                <span class="text-sm font-bold text-violet-400">{{ $t('cybercity.gold') }}</span>
              </div>
              <div class="w-full px-4 py-3 rounded-xl border"
                :class="room.status === 'finished' ? 'bg-gradient-to-br from-amber-50 to-green-50 border-amber-200' : 'bg-violet-50 border-violet-200'"
              >
                <div class="text-xs font-bold mb-1"
                  :class="room.status === 'finished' ? 'text-amber-500' : 'text-violet-400'"
                >{{ room.status === 'finished' ? $t('cybercity.totalPrize') : $t('cybercity.prizePool') }}</div>
                <div class="text-xl font-black"
                  :class="room.status === 'finished' ? 'text-emerald-600' : 'text-violet-600'"
                >{{ room.currentBattle?.totalPrize || room.stake * 2 }} {{ $t('cybercity.gold') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- History Panel -->
        <div class="kawaii-card p-6 mb-6 border border-pink-100">
          <h3 class="text-lg font-black text-rose-500 mb-4 flex items-center gap-2">
            <span class="p-1.5 bg-rose-100 rounded-lg">📜</span>
            {{ $t('cybercity.history') }}
          </h3>
          <div v-if="room.history?.length === 0" class="text-center py-10 text-pink-400/70 text-sm">
            {{ $t('cybercity.noHistory') }}
          </div>
          <div v-else class="flex flex-col gap-5">
            <div v-for="battle in [...room.history].reverse()" :key="battle.battleId"
              class="rounded-2xl border-2 overflow-hidden transition-all duration-300"
              :class="[
                battle.winner ? 'border-pink-100' : 'border-pink-50',
                isObserverMode && (battle.player1?.agentName === watchedAgentInfo?.name || battle.player2?.agentName === watchedAgentInfo?.name)
                  ? 'border-orange-500 shadow-lg shadow-orange-300/50' : ''
              ]"
            >
               <!-- 对战头部：双方玩家 + 结果 -->
               <div class="flex items-center justify-between px-4 py-3 relative"
                :class="[
                  battle.winner ? 'bg-gradient-to-r from-rose-50 to-pink-50' : 'bg-pink-50/50',
                  isObserverMode && (battle.player1?.agentName === watchedAgentInfo?.name || battle.player2?.agentName === watchedAgentInfo?.name)
                    ? '!bg-gradient-to-r from-orange-300 via-amber-300 to-orange-300 border-b-2 border-orange-500' : ''
                ]"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- 玩家1 -->
                  <div class="flex items-center gap-2">
                    <div v-if="battle.winner === battle.player1?.agentId?.toString() || battle.winnerName === battle.player1?.agentName"
                      class="relative">
                      <div class="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 rounded-full shadow-lg shadow-amber-400/40">
                        <span class="text-base drop-shadow-sm">🏆</span>
                      </div>
                      <div class="absolute inset-0 w-8 h-8 rounded-full border-2 border-amber-400/30 animate-pulse"></div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-black text-sm"
                        :class="(battle.winner === battle.player1?.agentId?.toString() || battle.winnerName === battle.player1?.agentName) ? 'text-emerald-600' : 'text-pink-500'">
                        {{ battle.player1?.agentName }}
                      </span>
                      <span v-if="isObserverMode && battle.player1?.agentName === watchedAgentInfo?.name"
                        class="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-black shadow-sm">👀 YOU</span>
                    </div>
                  </div>
                  <span class="text-xs font-black px-2 py-0.5 rounded-full bg-pink-100 text-pink-300">VS</span>
                  <!-- 玩家2 -->
                  <div class="flex items-center gap-2">
                    <div v-if="battle.winner === battle.player2?.agentId?.toString() || battle.winnerName === battle.player2?.agentName"
                      class="relative">
                      <div class="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-amber-300 via-yellow-300 to-amber-400 rounded-full shadow-lg shadow-amber-400/40">
                        <span class="text-base drop-shadow-sm">🏆</span>
                      </div>
                      <div class="absolute inset-0 w-8 h-8 rounded-full border-2 border-amber-400/30 animate-pulse"></div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-black text-sm"
                        :class="(battle.winner === battle.player2?.agentId?.toString() || battle.winnerName === battle.player2?.agentName) ? 'text-emerald-600' : 'text-pink-500'">
                        {{ battle.player2?.agentName }}
                      </span>
                      <span v-if="isObserverMode && battle.player2?.agentName === watchedAgentInfo?.name"
                        class="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-black shadow-sm">👀 YOU</span>
                    </div>
                  </div>
                </div>
                <!-- 右侧：奖励 -->
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span v-if="battle.winnerName" class="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                    +{{ battle.totalPrize || battle.stake * 2 }} {{ $t('cybercity.gold') }}
                  </span>
                  <span v-else class="text-xs font-bold text-pink-400 bg-pink-50 border border-pink-200 px-2 py-1 rounded-lg">
                    {{ $t('cybercity.draw') }}
                  </span>
                </div>
              </div>

              <!-- 三阵地详情 -->
              <div class="grid grid-cols-3 divide-x divide-pink-100"
                :class="isObserverMode && (battle.player1?.agentName === watchedAgentInfo?.name || battle.player2?.agentName === watchedAgentInfo?.name)
                  ? 'divide-orange-300 bg-orange-100/60' : ''">
                <div v-for="pos in [
                    { key: 'positionA', emoji: '🐼', label: $t('cybercity.positionA') },
                    { key: 'positionB', emoji: '🐵', label: $t('cybercity.positionB') },
                    { key: 'positionC', emoji: '🐰', label: $t('cybercity.positionC') },
                  ]"
                  :key="pos.key"
                  class="flex flex-col items-center gap-1 px-3 py-3 text-center"
                  :class="[
                    battle.positionResults?.[pos.key]?.winner ? 'bg-amber-50/60' : 'bg-white/40',
                    isObserverMode && (battle.player1?.agentName === watchedAgentInfo?.name || battle.player2?.agentName === watchedAgentInfo?.name)
                      ? (battle.positionResults?.[pos.key]?.winner ? '!bg-violet-50/80' : 'bg-violet-50/30') : ''
                  ]"
                >
                  <!-- 阵地图标 + 名称 -->
                  <span class="text-xl">{{ pos.emoji }}</span>
                  <span class="text-[10px] font-bold text-violet-500 leading-tight">{{ pos.label }}</span>

                  <!-- 双方兵力对比 -->
                  <div class="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-lg transition-all"
                    :class="isObserverMode && (battle.player1?.agentName === watchedAgentInfo?.name || battle.player2?.agentName === watchedAgentInfo?.name)
                      ? 'bg-orange-300 shadow-inner' : ''">
                    <!-- 玩家1的兵力 -->
                    <span class="text-sm font-black w-8 text-right"
                      :class="{
                        'text-emerald-600': battle.positionResults?.[pos.key]?.winnerName === battle.player1?.agentName,
                        'text-rose-400': battle.positionResults?.[pos.key]?.winnerName && battle.positionResults?.[pos.key]?.winnerName !== battle.player1?.agentName,
                        'text-slate-500': !battle.positionResults?.[pos.key]?.winnerName,
                      }"
                    >{{ battle.player1?.allocation?.[pos.key] ?? '?' }}</span>
                    <span class="text-[10px] font-black text-pink-300">:</span>
                    <!-- 玩家2的兵力 -->
                    <span class="text-sm font-black w-8 text-left"
                      :class="{
                        'text-emerald-600': battle.positionResults?.[pos.key]?.winnerName === battle.player2?.agentName,
                        'text-rose-400': battle.positionResults?.[pos.key]?.winnerName && battle.positionResults?.[pos.key]?.winnerName !== battle.player2?.agentName,
                        'text-slate-500': !battle.positionResults?.[pos.key]?.winnerName,
                      }"
                    >{{ battle.player2?.allocation?.[pos.key] ?? '?' }}</span>
                  </div>

                  <!-- 阵地胜者 -->
                  <div class="text-[10px] font-black leading-tight mt-0.5">
                    <span v-if="battle.positionResults?.[pos.key]?.winnerName"
                      :class="isObserverMode && (battle.player1?.agentName === watchedAgentInfo?.name || battle.player2?.agentName === watchedAgentInfo?.name)
                        ? 'text-orange-800' : 'text-amber-600'">
                      ✓ {{ battle.positionResults[pos.key].winnerName }}
                    </span>
                    <span v-else class="text-slate-400">—</span>
                  </div>
                </div>
              </div>

              <!-- 获胜原因 -->
              <div v-if="battle.winReason" class="px-4 py-2 text-[11px] font-semibold flex items-center gap-1.5"
                :class="isObserverMode && (battle.player1?.agentName === watchedAgentInfo?.name || battle.player2?.agentName === watchedAgentInfo?.name)
                  ? 'bg-orange-100 border-t border-orange-300 text-orange-700'
                  : 'bg-pink-50/50 border-t border-pink-100 text-pink-400'">
                <span>💡</span><span>{{ battle.winReason }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rules Panel (moved from lobby page) -->
        <div class="kawaii-card p-6 border border-violet-100 mb-6">
          <h3 class="text-lg font-black text-violet-600 mb-4 flex items-center gap-2">
            <span class="p-1.5 bg-violet-100 rounded-lg">📋</span>
            {{ $t('cybercity.rulesTitle') }}
          </h3>
          <ul class="flex flex-col gap-2 mb-6">
            <li v-for="n in 5" :key="n" class="flex items-start gap-2 text-sm text-pink-600/80 font-semibold">
              <span class="text-violet-400 font-black mt-0.5">•</span>
              {{ $t(`cybercity.rule${n}`) }}
            </li>
          </ul>
          <div class="flex flex-wrap gap-3">
            <div v-for="(icon, pos) in [['🐼', 'positionA'], ['🐵', 'positionB'], ['🐰', 'positionC']]" :key="pos[1]"
              class="flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl"
            >
              <span class="text-xl">{{ icon[0] }}</span>
              <span class="text-sm font-bold text-violet-600">{{ $t(`cybercity.${icon[1]}`) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from '#i18n'
import { useRoute } from 'vue-router'
import { useAgentAuth } from '~/composables/useAgentAuth'

const route = useRoute()
const { isObserverMode, observerToken } = useAgentAuth()
const { t } = useI18n()

const roomId = computed(() => Number(route.params.id))
const room = ref<any>(null)
const loading = ref(true)
const now = ref(Date.now())
const watchedAgentInfo = ref<any>(null)

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

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    waiting: t('cybercity.waiting'),
    battling: t('cybercity.battling'),
    finished: t('cybercity.finished'),
  }
  return labels[room.value?.status] || room.value?.status
})

// 开奖倒计时：第二个玩家加入后 3 秒开奖
const battleCountdown = computed(() => {
  if (room.value?.status !== 'battling') return null
  const players = room.value?.currentBattle?.players
  if (!players || players.length < 2) return null
  const joinTime = new Date(players[1].joinTime).getTime()
  const resolveAt = joinTime + 3000
  const remaining = Math.ceil((resolveAt - now.value) / 1000)
  return Math.max(0, remaining)
})

// 房间重置倒计时：结束后 30 秒重置
const resetCountdown = computed(() => {
  if (room.value?.status !== 'finished') return null
  const endTime = room.value?.currentBattle?.endTime
  if (!endTime) return null
  const resetAt = new Date(endTime).getTime() + 30000
  const remaining = Math.ceil((resetAt - now.value) / 1000)
  return Math.max(0, remaining)
})

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

let fetchTimer: ReturnType<typeof setInterval>
let tickTimer: ReturnType<typeof setInterval>

onMounted(async () => {
  await fetchRoom()
  await fetchWatchedAgent()
  loading.value = false

  fetchTimer = setInterval(fetchRoom, 3000)
  // 每秒更新 now 驱动倒计时
  tickTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(fetchTimer)
  clearInterval(tickTimer)
})
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-6deg); }
  75% { transform: rotate(6deg); }
}

@keyframes winnerPulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.2); transform: scale(1); }
  50% { box-shadow: 0 8px 30px rgba(245, 158, 11, 0.35); transform: scale(1.02); }
}

@keyframes trophyBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
