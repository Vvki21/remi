import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { savedTime, type SavedItem } from '../data/items'
import {
  DAY,
  DEFAULT_SPAN,
  RANGE_END,
  RANGE_START,
  describeWindow,
  inWindow,
  months,
  windowAround,
  type TimeWindow,
} from './time'

const SPRING = { type: 'spring', bounce: 0, visualDuration: 0.45 } as const
const WEEK = 7 * DAY
const BAR_MAX = 22
/** half-width of the invisible grab zone around each boundary line, px */
const EDGE_HIT = 12
/** the narrowest range a boundary can be dragged to */
const MIN_RANGE = 2 * DAY

type Zone = 'start' | 'end' | 'body' | null

interface TimelineProps {
  /** every item, for the faint full-archive distribution */
  all: SavedItem[]
  /** items in the selected category */
  visible: SavedItem[]
  window: TimeWindow
  onWindow: (w: TimeWindow) => void
  onScrub: (active: boolean) => void
  reduced: boolean
}

/**
 * The archive's time axis. Weekly ticks show when things were saved, in the
 * selected category, over a faint trace of everything else. The selected
 * range is two thin bracket lines: ticks between them are charcoal, ticks
 * outside are light grey. Drag between the lines to move the range, or drag
 * a line to resize it. Press outside the range to pick up about a month
 * there. The wheel scrubs, and the month labels jump.
 */
export function Timeline({ all, visible, window, onWindow, onScrub, reduced }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [drag, setDrag] = useState<Zone>(null)
  const [hover, setHover] = useState<Zone>(null)
  const dragging = drag !== null
  const grab = useRef(0)

  useEffect(() => onScrub(dragging), [dragging, onScrub])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const px = (t: number) => ((t - RANGE_START) / (RANGE_END - RANGE_START)) * width
  const timeAt = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect()
    return RANGE_START + ((clientX - r.left) / r.width) * (RANGE_END - RANGE_START)
  }

  const bins = useMemo(() => {
    const n = Math.ceil((RANGE_END - RANGE_START) / WEEK)
    const count = (list: SavedItem[]) => {
      const c = new Array(n).fill(0)
      for (const it of list) c[Math.floor((savedTime(it) - RANGE_START) / WEEK)]++
      return c
    }
    return { all: count(all), visible: count(visible), n }
  }, [all, visible])
  const peak = Math.max(1, ...bins.all)

  // The range's position and width live in motion values: the lines follow
  // the pointer exactly while dragged, and spring when the range jumps.
  const left = useMotionValue(0)
  const span = useMotionValue(0)
  const targetLeft = window ? px(window.start) : 0
  const targetWidth = window ? px(window.end) - px(window.start) : width
  useEffect(() => {
    if (!width) return
    if (reduced || dragging) left.jump(targetLeft)
    else animate(left, targetLeft, SPRING)
    if (reduced) span.jump(targetWidth)
    else animate(span, targetWidth, SPRING)
  }, [targetLeft, targetWidth, width, dragging, reduced, left, span])
  const endX = useTransform([left, span], ([l, s]: number[]) => l + s)
  // the charcoal copy of the ticks, clipped exactly to the range
  const inRangeClip = useTransform([left, span], ([l, s]: number[]) =>
    `inset(-2px ${Math.max(0, width - l - s)}px 0 ${Math.max(0, l)}px)`,
  )
  // the readout rides above the range, kept clear of the edges and of "All time"
  const edges = useRef({ lo: 0, hi: 0 })
  edges.current = { lo: 90, hi: width - (window ? 170 : 90) }
  const readoutX = useTransform([left, span], ([l, s]: number[]) =>
    Math.min(edges.current.hi, Math.max(edges.current.lo, l + s / 2)),
  )

  const count = visible.filter((it) => inWindow(savedTime(it), window)).length
  const center = window ? (window.start + window.end) / 2 : null
  const winSpan = window ? window.end - window.start : DEFAULT_SPAN

  const moveTo = (c: number) => onWindow(windowAround(c, winSpan))
  const lo = window?.start ?? RANGE_START
  const hi = window?.end ?? RANGE_END
  const clampT = (t: number) => Math.min(RANGE_END, Math.max(RANGE_START, t))
  const setStart = (t: number) => onWindow({ start: Math.min(clampT(t), hi - MIN_RANGE), end: hi })
  const setEnd = (t: number) => onWindow({ start: lo, end: Math.max(clampT(t), lo + MIN_RANGE) })

  /** what a press at this x would grab: a boundary, the range, or nothing */
  const zoneAt = (clientX: number): Zone => {
    const r = trackRef.current!.getBoundingClientRect()
    const x = clientX - r.left
    const a = px(lo)
    const b = px(hi)
    const da = Math.abs(x - a)
    const db = Math.abs(x - b)
    if (Math.min(da, db) <= EDGE_HIT) return da < db || (da === db && x < a) ? 'start' : 'end'
    if (window && x > a && x < b) return 'body'
    return null
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const t = timeAt(e.clientX)
    const zone = zoneAt(e.clientX)
    if (zone === 'body') {
      grab.current = t - (lo + hi) / 2
      setDrag('body')
    } else if (zone === 'start' || zone === 'end') {
      setDrag(zone)
    } else {
      // pick up about a month here and keep dragging it
      grab.current = 0
      onWindow(windowAround(t, winSpan))
      setDrag('body')
    }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag === 'body') moveTo(timeAt(e.clientX) - grab.current)
    else if (drag === 'start') setStart(timeAt(e.clientX))
    else if (drag === 'end') setEnd(timeAt(e.clientX))
    else {
      const z = zoneAt(e.clientX)
      if (z !== hover) setHover(z)
    }
  }
  const endDrag = () => setDrag(null)

  // the wheel scrubs too, one pixel of wheel per pixel of track
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!window || !width) return
      e.preventDefault()
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      moveTo((window.start + window.end) / 2 + (d / width) * (RANGE_END - RANGE_START))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  const monthIndex = center == null ? -1 : months.findIndex((m) => center >= m.start && center < m.end)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? DAY : WEEK
    const c = center ?? (e.key === 'ArrowLeft' || e.key === 'End' ? RANGE_END : RANGE_START)
    const toMonth = (i: number) => {
      const m = months[Math.max(0, Math.min(months.length - 1, i))]
      onWindow({ start: m.start, end: m.end })
    }
    switch (e.key) {
      case 'ArrowRight': moveTo(c + (center == null ? 0 : step)); break
      case 'ArrowLeft': moveTo(c - (center == null ? 0 : step)); break
      case 'PageDown': toMonth(monthIndex + 1); break
      case 'PageUp': toMonth(monthIndex < 0 ? months.length - 1 : monthIndex - 1); break
      case 'Home': toMonth(0); break
      case 'End': toMonth(months.length - 1); break
      case 'Escape': if (!window) return; onWindow(null); break
      default: return
    }
    e.preventDefault()
  }

  const onEdgeKey = (edge: 'start' | 'end') => (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? DAY : WEEK
    const at = edge === 'start' ? lo : hi
    const set = edge === 'start' ? setStart : setEnd
    if (e.key === 'ArrowLeft') set(at - step)
    else if (e.key === 'ArrowRight') set(at + step)
    else if (e.key === 'Escape' && window) onWindow(null)
    else return
    e.preventDefault()
    e.stopPropagation()
  }
  const edgeDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })

  const bars = (
    <div className="tl__bars" aria-hidden>
      {bins.all.map((n, i) => {
        if (!n) return null
        // a slender tick at the middle of its week
        const week = px(RANGE_START + WEEK)
        const w = Math.max(2, Math.min(10, week * 0.28))
        const x = px(RANGE_START + i * WEEK) + (week - w) / 2
        const v = bins.visible[i]
        return (
          <span key={i} className="tl__bin" style={{ left: x, width: w }}>
            <span className="tl__bar tl__bar--all" style={{ height: (n / peak) * BAR_MAX }} />
            <motion.span
              className="tl__bar"
              initial={false}
              animate={{ height: (v / peak) * BAR_MAX }}
              transition={reduced ? { duration: 0 } : SPRING}
            />
          </span>
        )
      })}
    </div>
  )

  return (
    <div className="tl" data-drag={drag ?? undefined} data-hover={(!drag && hover) || undefined}>
      <div className="tl__head">
        <motion.p className="tl__readout" style={{ x: readoutX }} aria-hidden>
          <span>{describeWindow(window)}</span>
          <span className="tl__count">{count} saved</span>
        </motion.p>
        {window && (
          <button type="button" className="tl__all" onClick={() => onWindow(null)}>
            All time
          </button>
        )}
      </div>

      <div
        ref={trackRef}
        className="tl__track"
        role="slider"
        tabIndex={0}
        aria-label="Saved date"
        aria-valuemin={RANGE_START}
        aria-valuemax={RANGE_END}
        aria-valuenow={center ?? RANGE_START}
        aria-valuetext={`${describeWindow(window)}, ${count} saved`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => !drag && setHover(null)}
        onKeyDown={onKeyDown}
      >
        {/* ticks outside the range, light grey… */}
        <div className="tl__ticks">{bars}</div>
        {/* …and the same ticks in charcoal, revealed only between the lines */}
        <motion.div className="tl__ticks tl__ticks--in" style={{ clipPath: inRangeClip }}>
          {bars}
        </motion.div>

        {(['start', 'end'] as const).map((edge) => (
          <motion.div
            key={edge}
            className={`tl__edge tl__edge--${edge}`}
            style={{ x: edge === 'start' ? left : endX }}
            data-full={!window || undefined}
            role="slider"
            tabIndex={0}
            aria-label={edge === 'start' ? 'Range start' : 'Range end'}
            aria-valuemin={RANGE_START}
            aria-valuemax={RANGE_END}
            aria-valuenow={edge === 'start' ? lo : hi}
            aria-valuetext={edgeDate.format(edge === 'start' ? lo : hi - 1)}
            onKeyDown={onEdgeKey(edge)}
          />
        ))}
      </div>

      <div className="tl__months">
        {months.map((m, i) => (
          <button
            key={m.start}
            type="button"
            className={`tl__month${i === monthIndex ? ' is-current' : ''}`}
            style={{ left: px(m.start) }}
            onClick={() => onWindow({ start: m.start, end: m.end })}
            aria-label={`Show ${m.long}`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
