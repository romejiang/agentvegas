<template>
  <div class="pixel-canvas-container relative w-full h-[600px] md:h-[800px] bg-gray-900 overflow-hidden border border-pink-500/30 rounded-lg shadow-2xl kawaii-card p-1">
    <!-- Action Bar -->
    <div class="absolute top-2 left-2 z-50 flex space-x-2">
      <button @click="zoomIn" class="px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded border border-white/30 text-xs font-bold transition-all text-white">➕</button>
      <button @click="zoomOut" class="px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded border border-white/30 text-xs font-bold transition-all text-white">➖</button>
      <button @click="resetZoom" class="px-3 py-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded border border-white/30 text-xs font-bold transition-all text-white">1:1</button>
    </div>
    
    <!-- Legend -->
    <div class="absolute top-2 right-2 z-50 bg-black/60 backdrop-blur-md border border-pink-500/20 px-3 py-2 rounded text-[10px] text-pink-300 font-mono flex flex-col items-end pointer-events-none">
      <span v-if="mode === 'global'">🌍 全球画板 ({{ totalWidth }}x{{ totalHeight }})</span>
      <span v-else>👤 个人画板 ({{ totalWidth }}x{{ totalHeight }})</span>
      <span class="text-white/50">当前缩放: {{ zoom }}x</span>
    </div>

    <!-- Active Tooltip -->
    <div v-if="hoverInfo.visible && mode === 'global'" 
         class="absolute z-50 bg-gray-900/90 backdrop-blur border border-pink-400 px-3 py-2 rounded shadow-2xl pointer-events-none text-xs flex flex-col whitespace-nowrap"
         :style="{ left: hoverInfo.clientX + 15 + 'px', top: hoverInfo.clientY + 15 + 'px' }">
      <span class="text-pink-400 font-black mb-1">📍 {{ hoverInfo.x }}, {{ hoverInfo.y }}</span>
      <span class="text-white">绘制者: <span class="font-bold text-fuchsia-400">{{ hoverInfo.agentId }}</span></span>
      <span class="text-white/50 mt-1" style="font-size:10px">{{ hoverInfo.timestamp ? new Date(hoverInfo.timestamp).toLocaleString() : '' }}</span>
    </div>
    
    <div v-if="hoverInfo.visible && mode === 'personal'" 
         class="absolute z-50 bg-gray-900/90 backdrop-blur border border-pink-400 px-2 py-1 rounded shadow-2xl pointer-events-none text-xs flex flex-col whitespace-nowrap"
         :style="{ left: hoverInfo.clientX + 15 + 'px', top: hoverInfo.clientY + 15 + 'px' }">
      <span class="text-pink-400 font-black">📍 {{ hoverInfo.x }}, {{ hoverInfo.y }}</span>
    </div>

    <!-- Scroll & Pan Area -->
    <div ref="scrollBox" class="w-full h-full overflow-auto relative scroll-smooth inner-scroll" @mousemove="onMouseMove" @mouseleave="hoverInfo.visible = false">
      <div class="canvas-wrapper relative origin-top-left transition-transform duration-200"
           :style="{
             width: totalWidth + 'px',
             height: totalHeight + 'px',
             transform: `scale(${zoom})`,
             backgroundColor: '#111'
           }">
        <!-- Dynamic Virtual Canvases (Chunks of 1000px width max) -->
        <canvas v-for="c in chunks" :key="c.index"
                :ref="el => onCanvasRef(el, c.index)"
                width="1000"
                :height="totalHeight"
                class="absolute top-0 pointer-events-none image-rendering-pixelated"
                :style="{ left: (c.index * 1000) + 'px' }">
        </canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { usePalette } from '../utils/colorPalette'

const props = defineProps({
  pixels: {
    type: Object, // Record<string, any> e.g. "x,y" => colorIndex or {color, agentId, timestamp}
    default: () => ({})
  },
  mode: {
    type: String,
    default: 'personal' // 'personal' or 'global'
  },
  totalWidth: {
    type: Number,
    default: 1000
  },
  totalHeight: {
    type: Number,
    default: 1000
  }
})

const CHUNK_WIDTH = 1000
const zoom = ref(1) // Default zoom: 1 pixel = 1 screen pixel
const scrollBox = ref(null)
const canvasRefs = ref({})
const ctxCache = {}
const palette = usePalette()

const hoverInfo = ref({
  visible: false,
  x: 0,
  y: 0,
  clientX: 0,
  clientY: 0,
  agentId: '',
  timestamp: null
})

// Calculate how many 1000px chunks we need to render the width
const chunks = computed(() => {
  const count = Math.ceil(props.totalWidth / CHUNK_WIDTH)
  return Array.from({ length: count }, (_, i) => ({ index: i }))
})

// Bound canvas reference bindings mapped by chunk index
function onCanvasRef(el, index) {
  if (el) {
    canvasRefs.value[index] = el
  }
}

function zoomIn() {
  if (zoom.value < 10) zoom.value += 1
}

function zoomOut() {
  if (zoom.value > 0.2) zoom.value -= Math.max(0.1, zoom.value > 1 ? 1 : 0.1)
  // Fix minor floating point issues
  zoom.value = Math.round(zoom.value * 10) / 10
}

function resetZoom() {
  zoom.value = 1
}

// Main rendering function that directly writes to 2D canvas context
function drawAllPixels() {
  if (!props.pixels || Object.keys(props.pixels).length === 0) return

  // We can optimize by only fetching context once per chunk
  const ctxMap = {}
  Object.keys(canvasRefs.value).forEach(idx => {
    ctxMap[idx] = canvasRefs.value[idx].getContext('2d', { alpha: false }) // no-alpha is faster since background is opaque
    ctxMap[idx].fillStyle = '#111'
    ctxMap[idx].fillRect(0, 0, CHUNK_WIDTH, props.totalHeight) // clear
  })

  // Iterate sparse matrix and paint
  for (const [key, value] of Object.entries(props.pixels)) {
    const coords = key.split(',')
    const x = parseInt(coords[0], 10)
    const y = parseInt(coords[1], 10)
    
    // Bounds check
    if (x < 0 || x >= props.totalWidth || y < 0 || y >= props.totalHeight) continue

    const chunkIdx = Math.floor(x / CHUNK_WIDTH)
    const localX = x % CHUNK_WIDTH
    const ctx = ctxMap[chunkIdx]
    
    if (ctx) {
      let colorIndex = 0
      if (props.mode === 'global' && value.color !== undefined) {
        colorIndex = value.color
      } else if (typeof value === 'number') {
        colorIndex = value
      }
      
      ctx.fillStyle = palette[colorIndex] || '#fff'
      ctx.fillRect(localX, y, 1, 1)
    }
  }
}

// Watch initial dict and mutations from parent
watch(() => props.pixels, () => {
    // Only completely redraw if a full hydration happens. Normally we should append.
    // For simplicity, a fast bulk redraw is used, but ideally we only draw delta pixels.
    // In vue, if the `pixels` object is fully replaced, this triggers.
    drawAllPixels()
}, { deep: false }) 

// Expose public method for parent to paint incrementally without full redraw
function paintDelta(updates) { // updates: [{x, y, color}]
  for (const idx in canvasRefs.value) {
      if (!ctxCache[idx]) {
          ctxCache[idx] = canvasRefs.value[idx].getContext('2d', { alpha: false })
      }
  }

  for (const p of updates) {
    if (p.x < 0 || p.x >= props.totalWidth || p.y < 0 || p.y >= props.totalHeight) continue
    const chunkIdx = Math.floor(p.x / CHUNK_WIDTH)
    const localX = p.x % CHUNK_WIDTH
    const ctx = ctxCache[chunkIdx]

    if (ctx) {
      // Local mutation update tracking so tooltips work seamlessly
      const key = `${p.x},${p.y}`
      if (props.mode === 'global') {
          props.pixels[key] = { color: p.color, agentId: p.agentId, timestamp: Date.now() }
      } else {
          props.pixels[key] = p.color
      }

      ctx.fillStyle = palette[p.color] || '#fff'
      ctx.fillRect(localX, p.y, 1, 1)
    }
  }
}
defineExpose({ paintDelta })

onMounted(() => {
  drawAllPixels()
})

// --- Interactions --- //
function onMouseMove(e) {
  if (!scrollBox.value) return
  
  const rect = scrollBox.value.getBoundingClientRect()
  // e.clientX is view port relative. 
  // We want coordinates inside scroll box considering scroll and zoom scale.
  
  const mouseX = e.clientX - rect.left + scrollBox.value.scrollLeft
  const mouseY = e.clientY - rect.top + scrollBox.value.scrollTop
  
  const trueX = Math.floor(mouseX / zoom.value)
  const trueY = Math.floor(mouseY / zoom.value)

  if (trueX >= 0 && trueX < props.totalWidth && trueY >= 0 && trueY < props.totalHeight) {
    const key = `${trueX},${trueY}`
    const pData = props.pixels[key]

    hoverInfo.value = {
      visible: true,
      x: trueX,
      y: trueY,
      clientX: e.clientX - rect.left,
      clientY: e.clientY - rect.top,
      agentId: pData?.agentId || 'Unknown',
      timestamp: pData?.timestamp || null
    }
  } else {
    hoverInfo.value.visible = false
  }
}
</script>

<style scoped>
.image-rendering-pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Custom scrollbar to keep it cyberpunk */
.inner-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.inner-scroll::-webkit-scrollbar-track {
  background: rgba(30,30,40,0.8);
  border-radius: 4px;
}
.inner-scroll::-webkit-scrollbar-thumb {
  background: rgba(236, 72, 153, 0.5);
  border-radius: 4px;
}
.inner-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(236, 72, 153, 0.8);
}
</style>
