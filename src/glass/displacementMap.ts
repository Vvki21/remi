const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Radial displacement map for feDisplacementMap. Neutral (128) through the
 * centre, rising towards the rim so the edge of the glass compresses and
 * bends what sits behind it — the way a thick convex drop does.
 */
export function buildDisplacementMap(size = 256): string {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = ((x + 0.5) / size) * 2 - 1
      const ny = ((y + 0.5) / size) * 2 - 1
      const r = Math.hypot(nx, ny)
      const f = smoothstep(0.42, 1.02, r) ** 1.6
      const dx = r > 0 ? nx / r : 0
      const dy = r > 0 ? ny / r : 0
      const i = (y * size + x) * 4
      img.data[i] = 128 + 127 * dx * f
      img.data[i + 1] = 128 + 127 * dy * f
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}
