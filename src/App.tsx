import { useCallback, useMemo, useState } from 'react'
import { MotionConfig, useReducedMotion } from 'motion/react'
import { CategoryFilter, type Filter } from './canvas/CategoryFilter'
import { MemoryCanvas } from './canvas/MemoryCanvas'
import { Timeline } from './canvas/Timeline'
import { inWindow, type TimeWindow } from './canvas/time'
import { items, savedTime } from './data/items'
import { FocusStage } from './focus/FocusStage'
import { relatedOf, useFocus } from './focus/useFocus'

const NONE: ReadonlySet<string> = new Set()

export default function App() {
  const reduced = useReducedMotion() ?? false
  // One collection, two controls. Focus mode never touches either, so
  // returning from it restores the category and time window exactly.
  const [category, setCategory] = useState<Filter>('All')
  const [window, setWindow] = useState<TimeWindow>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const { focus, open, choose, setPage, close } = useFocus()

  const visible = useMemo(
    () => (category === 'All' ? items : items.filter((it) => it.category === category)),
    [category],
  )
  const onCanvas = useMemo(
    () => new Set(visible.filter((it) => inWindow(savedTime(it), window)).map((it) => it.id)),
    [visible, window],
  )
  // every item in the stage leaves the canvas, so no layoutId is ever doubled
  const staged = useMemo(
    () => (focus ? new Set([focus.center, ...relatedOf(focus).map((l) => l.id)]) : NONE),
    [focus],
  )
  const onWindow = useCallback((w: TimeWindow) => setWindow(w), [])

  return (
    // Reduced motion: layout and transform animations jump, opacity still fades.
    <MotionConfig reducedMotion="user">
      <main className="app">
        <header className="top">
          <span className="brand">REMI</span>
          <CategoryFilter all={items} value={category} window={window} onChange={setCategory} />
        </header>

        <h1 className="headline">
          Find what you <em>almost</em> forgot.
        </h1>

        <MemoryCanvas all={items} visible={visible} window={window} staged={staged} scrubbing={scrubbing} onOpen={open} />

        <Timeline all={items} visible={visible} window={window} onWindow={onWindow} onScrub={setScrubbing} reduced={reduced} />

        <FocusStage
          focus={focus}
          onCanvas={onCanvas}
          reduced={reduced}
          onChoose={choose}
          onPage={setPage}
          onClose={close}
        />
      </main>
    </MotionConfig>
  )
}
