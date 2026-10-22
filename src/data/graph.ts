// Focus-mode view of the dataset: what an item links to, and how to show it.

import { imageSrc, itemById, type Connection } from './items'

export interface Link {
  id: string
  connection: Connection
}

export interface ItemInfo {
  id: string
  layoutId: string
  src: string
  alt: string
  title: string
  /** short descriptor under the focus: where and when it was saved */
  kind: string
  /** width / height */
  aspect: number
  focus?: string
}

export const linksOf = (id: string): Link[] =>
  (itemById.get(id)?.related ?? []).map((r) => ({ id: r.id, connection: r.reason }))

const dateLabel = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })

export function infoOf(id: string): ItemInfo | null {
  const item = itemById.get(id)
  if (!item) return null
  return {
    id,
    layoutId: `item-${id}`,
    src: imageSrc(item),
    alt: `${item.title}, saved from ${item.platform}`,
    title: item.title,
    kind: `${item.platform} · ${dateLabel.format(new Date(`${item.savedAt}T12:00:00`))}`,
    aspect: item.aspect,
    focus: item.focus,
  }
}
