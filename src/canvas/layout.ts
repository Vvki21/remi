import { savedTime, type SavedItem } from '../data/items'
import type { TimeWindow } from './time'

export interface TileBox {
  x: number
  y: number
  w: number
  h: number
  /** fades as a tile slides past the field's edge */
  opacity: number
  inView: boolean
}

const COL_GAP = 18
const ROW_GAP = 22
/** never zoom in so far that fewer than this many index steps fill the field */
const MIN_SPAN = 2
const AVG_ASPECT = 0.95

// Stable per-item rhythm, so a tile keeps its character as the layout moves.
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
const SCALES = [1, 0.86, 0.94]
const ALIGNS = [0, 1, 0.5]

/** Continuous index of a moment within the (sorted) items: k at item k's date. */
function indexAt(times: number[], t: number) {
  const n = times.length
  const gap = n > 1 ? (times[n - 1] - times[0]) / (n - 1) || 1 : 7 * 86_400_000
  if (t <= times[0]) return (t - times[0]) / gap
  if (t >= times[n - 1]) return n - 1 + (t - times[n - 1]) / gap
  let k = 0
  while (times[k + 1] <= t) k++
  const span = times[k + 1] - times[k]
  return k + (span ? (t - times[k]) / span : 0)
}

/**
 * A chronological strip, oldest on the left, in 1–4 staggered rows: item k
 * sits in row k mod r, so neighbours step diagonally across the field. The
 * time window decides which stretch of the strip fills the field. Because
 * positions are fractional in time, dragging the window pans and zooms the
 * strip continuously instead of re-dealing a grid.
 */
export function layoutCanvas(
  visible: SavedItem[],
  window: TimeWindow,
  field: { w: number; h: number },
  /** rows used last time: kept unless another count is clearly better */
  prevRows = 0,
): { boxes: Map<string, TileBox>; rows: number } {
  const out = new Map<string, TileBox>()
  const n = visible.length
  if (!n || !field.w || !field.h) return { boxes: out, rows: prevRows }
  const times = visible.map(savedTime)

  let a = window ? indexAt(times, window.start) : 0
  let b = window ? indexAt(times, window.end) : n - 1
  if (b - a < MIN_SPAN) {
    const mid = (a + b) / 2
    a = mid - MIN_SPAN / 2
    b = mid + MIN_SPAN / 2
  }
  const span = b - a

  // rows: whichever count gives the largest tiles for this stretch. A tall
  // phone field wants many rows, a wide one few. Hysteresis keeps the count
  // steady while scrubbing, so tiles glide instead of re-dealing.
  const sizeFor = (r: number) => {
    const cw = field.w / (span / r + 1)
    const ch = (field.h - ROW_GAP * (r - 1)) / r
    return Math.min(ch, (cw - COL_GAP) / AVG_ASPECT)
  }
  let rows = 1
  let best = 0
  for (let r = 1; r <= 10; r++) {
    const size = sizeFor(r)
    if (size > best * 1.04) {
      best = size
      rows = r
    }
  }
  if (prevRows && prevRows !== rows && sizeFor(prevRows) >= best * 0.86) rows = prevRows
  const cellW = field.w / (span / rows + 1)
  const cellH = (field.h - ROW_GAP * (rows - 1)) / rows

  visible.forEach((item, k) => {
    const hv = hash(item.id)
    let h = cellH * SCALES[hv % 3]
    let w = h * item.aspect
    if (w > cellW - COL_GAP) {
      w = cellW - COL_GAP
      h = w / item.aspect
    }
    // keep far-off tiles just past the edges rather than miles away
    const cx = Math.min(field.w * 1.35, Math.max(-field.w * 0.35, cellW / 2 + ((k - a) / rows) * cellW))
    const row = k % rows
    const y = row * (cellH + ROW_GAP) + (cellH - h) * ALIGNS[(hv >>> 3) % 3]
    const x = cx - w / 2
    const overflow = Math.max(0, -x, x + w - field.w)
    out.set(item.id, {
      x,
      y,
      w,
      h,
      opacity: Math.max(0, 1 - overflow / (w * 0.7)),
      inView: overflow < w * 0.5,
    })
  })
  return { boxes: out, rows }
}
