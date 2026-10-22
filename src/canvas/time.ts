export const DAY = 86_400_000

/** the archive's span: whole months around the saved dates */
export const RANGE_START = Date.parse('2026-05-01T00:00:00')
export const RANGE_END = Date.parse('2026-11-01T00:00:00')
/** width of the window picked up from the timeline */
export const DEFAULT_SPAN = 30 * DAY

/** null means the full date range */
export type TimeWindow = { start: number; end: number } | null

export interface Month {
  start: number
  end: number
  label: string
  long: string
}

const short = new Intl.DateTimeFormat('en', { month: 'short' })
const long = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })
const day = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })

export const months: Month[] = (() => {
  const out: Month[] = []
  const d = new Date(RANGE_START)
  while (d.getTime() < RANGE_END) {
    const start = d.getTime()
    d.setMonth(d.getMonth() + 1)
    out.push({ start, end: d.getTime(), label: short.format(start), long: long.format(start) })
  }
  return out
})()

/** a window of `span` centred on `center`, kept inside the archive */
export function windowAround(center: number, span = DEFAULT_SPAN): { start: number; end: number } {
  const half = span / 2
  const c = Math.min(RANGE_END - half, Math.max(RANGE_START + half, center))
  return { start: c - half, end: c + half }
}

export const inWindow = (t: number, w: TimeWindow) => !w || (t >= w.start && t < w.end)

export function describeWindow(w: TimeWindow) {
  if (!w) return 'All time'
  const m = months.find((m) => m.start === w.start && m.end === w.end)
  if (m) return m.long
  return `${day.format(w.start)} – ${day.format(w.end - 1)}`
}
