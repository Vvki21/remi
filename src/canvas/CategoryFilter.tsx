import { motion } from 'motion/react'
import { CATEGORIES, savedTime, type Category, type SavedItem } from '../data/items'
import { inWindow, type TimeWindow } from './time'

export type Filter = 'All' | Category
const FILTERS: Filter[] = ['All', ...CATEGORIES]

interface CategoryFilterProps {
  all: SavedItem[]
  value: Filter
  window: TimeWindow
  onChange: (f: Filter) => void
}

/** All / Climbing / Fashion / Design / Fitness, each counted within the current time window. */
export function CategoryFilter({ all, value, window, onChange }: CategoryFilterProps) {
  const timely = all.filter((it) => inWindow(savedTime(it), window))
  const count = (f: Filter) => (f === 'All' ? timely.length : timely.filter((it) => it.category === f).length)

  return (
    <nav className="filters" aria-label="Category">
      {FILTERS.map((f) => {
        const active = f === value
        return (
          <button
            key={f}
            type="button"
            className={`filter${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(f)}
          >
            {f}
            <sup className="filter__count">{count(f)}</sup>
            {active && <motion.span layoutId="filter-mark" className="filter__mark" transition={{ type: 'spring', bounce: 0, visualDuration: 0.4 }} />}
          </button>
        )
      })}
    </nav>
  )
}
