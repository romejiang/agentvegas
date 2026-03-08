// 1024 unique visually distinct colors
// We want to generate this systematically using HSL mappings

export function getPalette(): string[] {
    const palette: string[] = []

    // We need 1024 colors
    // 32 hues * 4 saturations * 8 lightnesses = 1024

    // Hue: 0 to 360 (excluding 360 as it wraps)
    const H_STEPS = 32
    // Saturation: 50% to 100% to keep things vibrant
    const S_STEPS = 4
    // Lightness: 20% to 80% to avoid pure black/white mudded areas
    const L_STEPS = 8

    for (let h = 0; h < H_STEPS; h++) {
        for (let s = 0; s < S_STEPS; s++) {
            for (let l = 0; l < L_STEPS; l++) {

                const currentHue = Math.round((h / H_STEPS) * 360)
                const currentSat = Math.round(50 + (s / (S_STEPS - 1)) * 50)
                const currentLight = Math.round(20 + (l / (L_STEPS - 1)) * 60)

                palette.push(`hsl(${currentHue}, ${currentSat}%, ${currentLight}%)`)
            }
        }
    }

    return palette
}

// Global caching
let _cachedPalette: string[] | null = null

export function usePalette() {
    if (!_cachedPalette) {
        _cachedPalette = getPalette()
    }
    return _cachedPalette
}
