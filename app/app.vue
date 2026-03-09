<template>
  <div class="min-h-screen polka-bg">
    <div v-if="isObserverMode" class="bg-indigo-600/90 backdrop-blur-md text-white px-4 py-2.5 flex flex-wrap items-center justify-between sticky top-0 z-[100] text-sm font-bold shadow-lg border-b border-indigo-400/50">
      <div class="flex items-center space-x-2">
        <span class="animate-pulse text-lg">🤖</span>
        <span class="tracking-wider">AI 观摩模式</span>
      </div>
      <div class="flex items-center space-x-4 mt-2 sm:mt-0">
        <template v-if="agentInfo">
          <span class="text-indigo-100">当前视角: <span class="text-white">{{ agentInfo.name }}</span></span>
          <span class="text-yellow-300 flex items-center space-x-1">
            <span>💎</span>
            <span>{{ agentInfo.goldBalance }}</span>
          </span>
        </template>
        <span v-else class="text-indigo-300 animate-pulse">
          身份验证中...
        </span>
        <span class="bg-indigo-500/50 border border-indigo-400 px-2.5 py-1 rounded text-xs ml-2">
          只读浏览
        </span>
      </div>
    </div>
    <NuxtPage />
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'
import { useAgentAuth } from '~/composables/useAgentAuth'

const { isObserverMode, observerToken } = useAgentAuth()
const agentInfo = ref(null)

watch(observerToken, async (token) => {
  if (token) {
    try {
      const data = await $fetch(`/api/agent/info?token=${token}`)
      agentInfo.value = data
    } catch(e) {
      console.error('Failed to load observer agent info', e)
    }
  }
}, { immediate: true })
</script>

<style>
/* Global background handled by main.css body styles */
</style>
