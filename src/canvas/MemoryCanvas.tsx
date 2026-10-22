import { memo, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { motion } from 'motion/react'
import { imageSrc, savedTime, type SavedItem } from '../data/items'
import { layoutCanvas, type TileBox } from './layout'
import { describeWindow, inWindow, type TimeWindow } from './time'

export const TILE_SPRING = { type: 'spring', bounce: 0, visualDuration: 0.55 } as const
/** while the timeline is being scrubbed, tiles track it closely so neighbours never cross */
const SCRUB_SPRING = { type: 'spring', bounce: 0, visualDuration: 0.22 } as const
/** a tile outside the time window stays as faint context */
const OUT_OF_TIME = 0.16

export type OpenItem = (id: string, origin: { x: number; y: number }, from: HTMLElement) => void

interface MemoryCanvasProps {
  all: SavedItem[]
  visible: SavedItem[]
  window: TimeWindow
  /** items lifted into focus: their tile hands off to the focus stage */
  staged: ReadonlySet<string>
  scrubbing: boolean
  onOpen: OpenItem
}

/**
 * Every saved item, laid out chronologically. Category and time only change
 * where tiles sit and how present they are. Every tile stays mounted, so
 * filtering, scrubbing and focus all animate the same elements.
 */
export const MemoryCanvas = memo(function MemoryCanvas({ all, visible, window, staged, scrubbing, onOpen }: MemoryCanvasProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const [field, setField] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = fieldRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setField({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rowsRef = useRef(0)
  const { boxes, rows } = layoutCanvas(visible, window, field, rowsRef.current)
  rowsRef.current = rows
  // tiles filtered out hold their last place while they fade
  const last = useRef(new Map<string, TileBox>())
  boxes.forEach((b, id) => last.current.set(id, b))

  const inTime = visible.filter((it) => inWindow(savedTime(it), window))

  const open = (id: string) => (e: MouseEvent<HTMLElement>) =>
    onOpen(id, { x: e.clientX, y: e.clientY }, e.currentTarget)
  const openByKey = (id: string) => (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    onOpen(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 }, e.currentTarget)
  }

  return (
    <div className="field" ref={fieldRef}>
      {all.map((item) => {
        if (staged.has(item.id)) return null
        const box = boxes.get(item.id) ?? last.current.get(item.id)
        if (!box) return null
        const shown = boxes.has(item.id)
        const timely = inWindow(savedTime(item), window)
        const opacity = shown ? box.opacity * (timely ? 1 : OUT_OF_TIME) : 0
        const reachable = shown && timely && box.inView
        return (
          <motion.button
            key={item.id}
            type="button"
            layoutId={`item-${item.id}`}
            data-id={item.id}
            className="tile"
            style={{ left: box.x, top: box.y, width: box.w, height: box.h, zIndex: reachable ? 2 : 1 }}
            initial={false}
            animate={{ opacity, scale: shown ? 1 : 0.94 }}
            transition={{ layout: scrubbing ? SCRUB_SPRING : TILE_SPRING, scale: TILE_SPRING, opacity: { duration: scrubbing ? 0.2 : 0.45, ease: 'easeOut' } }}
            tabIndex={reachable ? 0 : -1}
            aria-hidden={!reachable || undefined}
            data-off={!reachable || undefined}
            aria-label={`${item.title}, ${item.category}, saved from ${item.platform}`}
            onClick={reachable ? open(item.id) : undefined}
            onKeyDown={reachable ? openByKey(item.id) : undefined}
          >
            <span className="tile__frame">
              <img
                src={imageSrc(item)}
                alt=""
                draggable={false}
                decoding="async"
                style={item.focus ? { objectPosition: item.focus } : undefined}
              />
            </span>
            <span className="tile__cap" aria-hidden>
              {item.title}
              <span>{item.platform}</span>
            </span>
          </motion.button>
        )
      })}

      {!inTime.length && (
        <p className="field__empty" role="status">
          Nothing saved here in {describeWindow(window)}.
        </p>
      )}
    </div>
  )
})
