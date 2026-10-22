import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react'
import { buildDisplacementMap } from '../glass/displacementMap'
import { infoOf, type ItemInfo, type Link } from '../data/graph'
import { relatedOf, type FocusState } from './useFocus'

export const FOCUS_SPRING = { type: 'spring', bounce: 0, visualDuration: 0.62 } as const
const EASE = [0.22, 1, 0.36, 1] as const
/** below this the related row sits under the focus instead of beside it */
const STACK_MAX = 900
const MAX_PER_PAGE = 5
const GAP = 18
/** below this a card stops reading as an image; show fewer per page instead */
const MIN_CARD_H = 140
const REFRACT_ID = 'remi-focus-refraction'
/** radius the glass starts from: the carried lens */
const LENS_R = 100
const PEARL = 'rgba(245, 245, 242, 0.955)'

type Box = { x: number; y: number; w: number; h: number }
type Card = { link: Link; info: ItemInfo; box: Box }

interface Layout {
  focus: { id: string; info: ItemInfo; box: Box }
  /** top-left of the related panel header, and its width */
  header: { x: number; y: number; w: number }
  cards: Card[]
  total: number
  page: number
  pages: number
  /** range shown, 1-based for display */
  from: number
  to: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const fit = (maxW: number, maxH: number, aspect: number) => {
  const w = Math.min(maxW, maxH * aspect)
  return { w, h: w / aspect }
}

/**
 * Size the row so as many related images as possible share it, up to five,
 * without any card dropping below a legible height.
 */
function cardHeight(aspects: number[], room: number, maxH: number) {
  for (let k = Math.min(aspects.length, MAX_PER_PAGE); k > 0; k--) {
    const sum = aspects.slice(0, k).reduce((a, b) => a + b, 0)
    const h = (room - GAP * (k - 1)) / sum
    if (h >= MIN_CARD_H) return Math.min(h, maxH)
  }
  return MIN_CARD_H
}

/** Greedy pages: as many cards as fit the row, never more than five. */
function paginate(widths: number[], room: number) {
  const pages: number[][] = []
  let cur: number[] = []
  let used = 0
  widths.forEach((w, i) => {
    const need = cur.length ? used + GAP + w : w
    if (cur.length && (need > room || cur.length === MAX_PER_PAGE)) {
      pages.push(cur)
      cur = [i]
      used = w
    } else {
      cur.push(i)
      used = need
    }
  })
  if (cur.length) pages.push(cur)
  return pages
}

/**
 * Wide: the focus holds the left of the stage. The related row holds the
 * right, standing on the focus's baseline with its count just above. Narrow: the focus on top, the related row beneath it.
 */
function arrange(f: FocusState, vw: number, vh: number): Layout | null {
  const center = infoOf(f.center)
  if (!center) return null
  const stacked = vw <= STACK_MAX

  const related = relatedOf(f)
    .map((link) => ({ link, info: infoOf(link.id) }))
    .filter((r): r is { link: Link; info: ItemInfo } => !!r.info)

  let fBox: Box
  let header: Layout['header']
  let maxCardH: number
  let rowX: number
  let rowW: number
  let rowTop: number
  if (!stacked) {
    const s = fit(vw * 0.34, vh * 0.6, center.aspect)
    const x = Math.max(vw * 0.06, vw * 0.27 - s.w / 2)
    const y = vh * 0.48 - s.h / 2
    fBox = { x, y, ...s }
    rowX = Math.max(x + s.w + vw * 0.06, vw * 0.46)
    rowW = vw * 0.94 - rowX
    header = { x: rowX, y, w: rowW }
    // the row always reads as secondary to the focus
    maxCardH = Math.min(vh * 0.32, s.h * 0.62)
    rowTop = y + s.h
  } else {
    const s = fit(vw - 32, vh * 0.4, center.aspect)
    const y = Math.max(64, vh * 0.09)
    fBox = { x: (vw - s.w) / 2, y, ...s }
    rowX = 16
    rowW = vw - 32
    header = { x: rowX, y: y + s.h + 52, w: rowW }
    maxCardH = clamp(vh * 0.22, MIN_CARD_H, 200)
    rowTop = header.y + 40
  }

  const cardH = cardHeight(related.map((r) => r.info.aspect), rowW, maxCardH)
  // wide: cards stand on the focus's baseline, the header right above them;
  // stacked: they hang under the header
  const cardY = stacked ? rowTop : rowTop - cardH
  if (!stacked) header = { ...header, y: cardY - 48 }
  const widths = related.map((r) => cardH * r.info.aspect)
  const pages = paginate(widths, rowW)
  const page = clamp(f.page, 0, Math.max(0, pages.length - 1))
  const shown = pages[page] ?? []
  let x = rowX
  const cards = shown.map((i) => {
    const w = widths[i]
    const card = { ...related[i], box: { x, y: cardY, w, h: cardH } }
    x += w + GAP
    return card
  })

  return {
    focus: { id: f.center, info: center, box: fBox },
    header,
    cards,
    total: related.length,
    page,
    pages: pages.length,
    from: shown.length ? shown[0] + 1 : 0,
    to: shown.length ? shown[shown.length - 1] + 1 : 0,
  }
}

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return vp
}

/**
 * The lens swelling into the backdrop: a viewport-sized pearl field whose
 * radius springs outward from the click, ending in a thin glass lip (a bright
 * inner band and a faint dark edge). It costs one gradient repaint per frame
 * and never creates an oversized layer.
 */
function Veil({ origin, vp, reduced }: { origin: { x: number; y: number }; vp: { w: number; h: number }; reduced: boolean }) {
  const present = useIsPresent()
  const r = useMotionValue(LENS_R)
  const reach = Math.hypot(Math.max(origin.x, vp.w - origin.x), Math.max(origin.y, vp.h - origin.y)) + 40

  useEffect(() => {
    const target = present ? reach : LENS_R
    const c = animate(r, target, reduced ? { duration: 0 } : { ...FOCUS_SPRING, visualDuration: present ? 0.75 : 0.6 })
    return () => c.stop()
  }, [present, reach, reduced, r])

  const background = useTransform(r, (v) => {
    const at = `circle at ${origin.x}px ${origin.y}px`
    return `radial-gradient(${at}, ${PEARL} 0, ${PEARL} ${v - 26}px, rgba(255, 255, 255, 0.97) ${v - 8}px, rgba(30, 36, 46, 0.07) ${v - 1.5}px, rgba(245, 245, 242, 0) ${v}px)`
  })

  return (
    <motion.div
      className="focus__veil"
      style={{ background }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
    />
  )
}

interface FocusStageProps {
  focus: FocusState | null
  /** items currently on the canvas: they fly in from their tile, the rest emerge */
  onCanvas: ReadonlySet<string>
  reduced: boolean
  onChoose: (id: string) => void
  onPage: (page: number) => void
  onClose: () => void
}

export function FocusStage({ focus, onCanvas, reduced, onChoose, onPage, onClose }: FocusStageProps) {
  const vp = useViewport()
  const layout = focus ? arrange(focus, vp.w, vp.h) : null
  const stageRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const isOpen = !!focus

  // Each time the focus changes hands, the focal image passes briefly through
  // glass: the lens's radial map bends its edges, then lets go.
  const lensMap = useMemo(() => buildDisplacementMap(128), [])
  const displaceRef = useRef<SVGFEDisplacementMapElement>(null)
  const ripple = useMotionValue(0)
  const [refracting, setRefracting] = useState(false)
  useMotionValueEvent(ripple, 'change', (v) => {
    displaceRef.current?.setAttribute('scale', v.toFixed(2))
  })
  const centerKey = focus?.center ?? null
  useEffect(() => {
    if (!centerKey || reduced) return
    setRefracting(true)
    const controls = animate(ripple, [0, -18, 0], {
      duration: 0.95,
      ease: 'easeInOut',
      onComplete: () => setRefracting(false),
    })
    return () => controls.stop()
  }, [centerKey, reduced, ripple])

  // Keyboard: Back on open; after choosing, the first related card.
  const firstOpen = useRef(true)
  useEffect(() => {
    if (!centerKey) {
      firstOpen.current = true
      return
    }
    const id = requestAnimationFrame(() => {
      const target = firstOpen.current
        ? backRef.current
        : (stageRef.current?.querySelector<HTMLElement>('.focus__card') ?? backRef.current)
      target?.focus({ preventScroll: true })
      firstOpen.current = false
    })
    return () => cancelAnimationFrame(id)
  }, [centerKey])

  // ← → browse when the related row runs over more than one page.
  const pages = layout?.pages ?? 0
  const page = layout?.page ?? 0
  useEffect(() => {
    if (!isOpen || pages < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && page < pages - 1) onPage(page + 1)
      if (e.key === 'ArrowLeft' && page > 0) onPage(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, pages, page, onPage])

  const origin = focus?.origin ?? { x: vp.w / 2, y: vp.h / 2 }
  const fBox = layout?.focus.box

  type Tile = { id: string; info: ItemInfo; box: Box; isFocus: boolean; index: number }
  const tiles: Tile[] = layout
    ? [
        { id: layout.focus.id, info: layout.focus.info, box: layout.focus.box, isFocus: true, index: 0 },
        ...layout.cards.map((c, i) => ({ id: c.link.id, info: c.info, box: c.box, isFocus: false, index: i })),
      ]
    : []

  const tile = ({ id, info, box, isFocus, index }: Tile) => {
    const fresh = !onCanvas.has(id)
    const delay = 0.14 + index * 0.05
    return (
      <motion.button
        key={info.id}
        type="button"
        layoutId={info.layoutId}
        className={`focus__tile ${isFocus ? 'focus__focus' : 'focus__card'}`}
        style={{
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          zIndex: isFocus ? 3 : 2,
          filter: isFocus && refracting ? `url(#${REFRACT_ID})` : undefined,
        }}
        // items not on the canvas right now have nowhere to fly from: they rise in turn
        initial={fresh ? { opacity: 0, y: 14 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
        transition={{
          default: FOCUS_SPRING,
          opacity: { duration: 0.5, ease: EASE, delay: fresh ? delay : 0 },
          y: { duration: 0.6, ease: EASE, delay },
        }}
        tabIndex={isFocus ? -1 : 0}
        aria-label={isFocus ? info.alt : `Explore ${info.alt}`}
        onClick={isFocus ? undefined : () => onChoose(id)}
      >
        <img
          src={info.src}
          alt=""
          draggable={false}
          decoding="async"
          style={info.focus ? { objectPosition: info.focus } : undefined}
        />
      </motion.button>
    )
  }

  const fade = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE, delay: 0.38 } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  }

  return (
    <div
      ref={stageRef}
      className="focus"
      data-open={isOpen || undefined}
      role={isOpen ? 'dialog' : undefined}
      aria-modal={isOpen || undefined}
      aria-label={layout ? `${layout.focus.info.alt}, ${layout.total} related memories` : undefined}
    >
      <svg className="focus__defs" width="0" height="0" aria-hidden focusable="false">
        <filter
          id={REFRACT_ID}
          x="0"
          y="0"
          width={fBox?.w ?? 0}
          height={fBox?.h ?? 0}
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feImage href={lensMap} x="0" y="0" width={fBox?.w ?? 0} height={fBox?.h ?? 0} preserveAspectRatio="none" result="map" />
          <feDisplacementMap ref={displaceRef} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <AnimatePresence>
        {isOpen && <Veil key="veil" origin={origin} vp={vp} reduced={reduced} />}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.button
            key="back"
            ref={backRef}
            type="button"
            className="focus__back"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <span aria-hidden>←</span> Back to canvas
            <kbd className="focus__esc">Esc</kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tiles that live on the canvas are not wrapped in presence: when they
          leave the stage they unmount at once and their canvas tile takes over
          the shared layout transition, flying home. */}
      {tiles.filter((t) => onCanvas.has(t.id)).map(tile)}
      <AnimatePresence>{tiles.filter((t) => !onCanvas.has(t.id)).map(tile)}</AnimatePresence>

      <AnimatePresence>
        {layout && (
          <motion.p
            key={`cap:${layout.focus.info.id}`}
            className="focus__caption"
            style={{ left: layout.focus.box.x, top: layout.focus.box.y + layout.focus.box.h + 14 }}
            {...fade}
          >
            <span className="focus__title">{layout.focus.info.title}</span>
            <span className="label">{layout.focus.info.kind}</span>
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {layout && (
          <motion.div
            key="header"
            className="focus__header"
            style={{ left: layout.header.x, top: layout.header.y, width: layout.header.w }}
            // the row's header travels with the row when the focus changes
            layout="position"
            {...fade}
            transition={{ layout: FOCUS_SPRING }}
          >
            <p className="focus__count" aria-live="polite">
              {layout.total} related {layout.total === 1 ? 'memory' : 'memories'}
            </p>
            {layout.pages > 1 && (
              <div className="focus__pager">
                <span className="label">
                  {layout.from}–{layout.to} of {layout.total}
                </span>
                <button
                  type="button"
                  className="focus__page"
                  aria-label="Previous related memories"
                  aria-disabled={layout.page === 0}
                  onClick={() => layout.page > 0 && onPage(layout.page - 1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="focus__page"
                  aria-label="Next related memories"
                  aria-disabled={layout.page >= layout.pages - 1}
                  onClick={() => layout.page < layout.pages - 1 && onPage(layout.page + 1)}
                >
                  →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {layout?.cards.map((c) => (
          <motion.span
            key={`conn:${layout.focus.info.id}:${c.info.id}`}
            className="focus__connection"
            style={{ left: c.box.x, top: c.box.y + c.box.h + 12 }}
            {...fade}
          >
            {c.link.connection}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
