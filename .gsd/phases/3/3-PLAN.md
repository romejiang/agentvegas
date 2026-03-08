---
phase: 3
plan: 3
wave: 2
---

# Plan 3.3: Frontend Canvas Visualization Component

## Objective
Build a high-performance Vue component to render the pixel canvases using Canvas 2D, with horizontal scrolling for the global canvas and tooltips for painted pixels.

## Context
- app/components/PixelCanvasRenderer.vue (new)

## Tasks

<task type="auto">
  <name>Generate Palette Utility</name>
  <files>
    app/utils/colorPalette.ts
  </files>
  <action>
    - Export a function `getPalette()` that returns an array of 1024 distinct hex codes.
    - Generate them using nested loops of HSL based systematically so hue ranges 0-360, sat 50-100%, light 20-80%.
    - Cache the array globally so it's not regenerated constantly.
  </action>
  <verify>cat app/utils/colorPalette.ts</verify>
  <done>1024-color array is readily accessible to rendering engines.</done>
</task>

<task type="auto">
  <name>Develop Virtualized Pixel Renderer</name>
  <files>
    app/components/PixelCanvasRenderer.vue
  </files>
  <action>
    - Component Props: `pixels` Object/Array, `mode` ('personal' | 'global'), `totalWidth` (number, e.g. 50000 or 1000), `totalHeight` (number, 1000).
    - Architecture: To bypass browser maximum canvas width limits, rely on a container `<div>` with `overflow-x: auto; position: relative` and an inner `<div>` set to exact `width: {totalWidth}px; height: {totalHeight}px`.
    - Multiple Canvases: Based on the `totalWidth`, create an array of logical canvases (e.g., 1000x1000 sizes). For totalWidth 50000, 50 elements. 
    - Render loop: Create a method `drawPixels(updatedPixels)`. Determine which internal 1000x1000 `<canvas>` tile a pixel belongs to (`Math.floor(x/1000)`), fetch its 2d context, and do `ctx.fillStyle = palette[pixel.color]; ctx.fillRect(x % 1000, y, 1, 1)`. 
    - Note on size: A 1x1 pixel is tiny on high res screens. Instead of physical 1 pixel, we can let user scale using CSS `transform` or just draw them exactly 1:1. Render 1:1 but allow CSS scaling or a "zoom" button to apply `transform: scale(2)` to the wrapper.
    - Tooltip: Add `@mousemove` on the wrapper. Calculate the true pixel `(X, Y)`. Look up in the local `pixels` state if there's a pixel there. If `mode === 'global'`, extract `agentId` and format the tooltip "绘制者: {agentId}".
  </action>
  <verify>cat app/components/PixelCanvasRenderer.vue</verify>
  <done>A robust multi-tile canvas renderer handles up to 50k width efficiently without browser crash limits.</done>
</task>

## Success Criteria
- [ ] Palette generates precisely 1024 colors reliably.
- [ ] The component partitions rendering into multiple 1000x1000 tiles safely.
- [ ] Hover states reliably map coordinates to canvas data.
