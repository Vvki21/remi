import { useCallback, useEffect, useRef, useState } from 'react'
import { linksOf, type Link } from '../data/graph'

export interface FocusState {
  center: string
  /** the item we came from; it leads the related row so it stays close at hand */
  previous: string | null
  page: number
  /** viewport point the glass expanded from, and contracts back to */
  origin: { x: number; y: number }
}

/** Every curated link of the focus, previous focus first, otherwise in data order. */
export function relatedOf(f: FocusState): Link[] {
  const links = linksOf(f.center)
  const i = f.previous ? links.findIndex((l) => l.id === f.previous) : -1
  return i > 0 ? [links[i], ...links.slice(0, i), ...links.slice(i + 1)] : links
}

/**
 * Focus → Expand. Opening an item focuses it and lists every related memory.
 * Choosing one of those makes it the focus. Its own related memories replace
 * the list, with the image we came from placed first.
 */
export function useFocus() {
  const [focus, setFocus] = useState<FocusState | null>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  const open = useCallback((id: string, origin: { x: number; y: number }, from?: HTMLElement) => {
    returnTo.current = from ?? null
    setFocus({ center: id, previous: null, page: 0, origin })
  }, [])

  const choose = useCallback((id: string) => {
    setFocus((f) => (f && f.center !== id ? { ...f, center: id, previous: f.center, page: 0 } : f))
  }, [])

  const setPage = useCallback((page: number) => {
    setFocus((f) => (f && f.page !== page ? { ...f, page } : f))
  }, [])

  const close = useCallback(() => {
    setFocus(null)
    const id = returnTo.current?.dataset.id
    returnTo.current = null
    // the tile re-mounts when it flies home, so find it again by id
    if (id)
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`.tile[data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }),
      )
  }, [])

  const isOpen = !!focus
  // Escape returns; the page holds still while focused.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  return { focus, open, choose, setPage, close }
}
