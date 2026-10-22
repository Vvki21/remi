// REMI's single dataset: every saved item in the archive. Categories,
// platforms, dates and relationships are hand-authored sample data, not
// inferred: nothing here is classified, synced or analysed by software.

export type Category = 'Climbing' | 'Fashion' | 'Design' | 'Fitness'
export const CATEGORIES: Category[] = ['Climbing', 'Fashion', 'Design', 'Fitness']

export type Platform = 'Pinterest' | 'Instagram' | 'Are.na' | 'Behance' | 'Web'

export type Connection =
  | 'Similar form'
  | 'Shared texture'
  | 'Same palette'
  | 'Echoed structure'
  | 'Shared setting'

export interface Related {
  id: string
  /** why the two belong together, stated by hand */
  reason: Connection
}

export interface SavedItem {
  id: string
  title: string
  /** Unsplash photo id */
  photo: string
  platform: Platform
  /** ISO date the item was saved */
  savedAt: string
  category: Category
  /** width / height the image is framed at, everywhere it appears */
  aspect: number
  /** object-position for the crop */
  focus?: string
  related: Related[]
}

type Draft = Omit<SavedItem, 'related'>

const drafts: Draft[] = [
  // ── Design
  { id: 'undulation', title: 'Undulation', photo: '1558591710-4b4a1ae0f04d', platform: 'Are.na', savedAt: '2026-05-06', category: 'Design', aspect: 0.74 },
  { id: 'fanned-ribbon', title: 'Fanned Ribbon', photo: '1617791160505-6f00504e3519', platform: 'Behance', savedAt: '2026-05-08', category: 'Design', aspect: 0.8, focus: '60% 50%' },
  { id: 'folded-light', title: 'Folded Light', photo: '1487958449943-2429e8be8625', platform: 'Pinterest', savedAt: '2026-05-19', category: 'Design', aspect: 1.48, focus: '60% 40%' },
  { id: 'stacked-white', title: 'Stacked White', photo: '1479839672679-a46483c0e7c8', platform: 'Are.na', savedAt: '2026-05-21', category: 'Design', aspect: 0.8 },
  { id: 'three-gables', title: 'Three Gables', photo: '1511452885600-a3d2c9148a31', platform: 'Instagram', savedAt: '2026-06-02', category: 'Design', aspect: 0.8, focus: '40% 70%' },
  { id: 'sage-room', title: 'Sage Room', photo: '1494438639946-1ebd1d20bf85', platform: 'Instagram', savedAt: '2026-06-14', category: 'Design', aspect: 0.74, focus: '70% 50%' },
  { id: 'lamp-dresser', title: 'Lamp, Dresser', photo: '1513694203232-719a280e022f', platform: 'Pinterest', savedAt: '2026-06-16', category: 'Design', aspect: 0.8, focus: '80% 50%' },
  { id: 'yellow-corner', title: 'Yellow Corner', photo: '1586023492125-27b2c045efd7', platform: 'Pinterest', savedAt: '2026-06-20', category: 'Design', aspect: 0.8, focus: '35% 60%' },
  { id: 'arc-lamps', title: 'Arc Lamps', photo: '1524758631624-e2822e304c36', platform: 'Are.na', savedAt: '2026-06-27', category: 'Design', aspect: 0.8, focus: '65% 40%' },
  { id: 'shell-chair', title: 'Shell Chair', photo: '1505843490538-5133c6c7d0e1', platform: 'Pinterest', savedAt: '2026-07-08', category: 'Design', aspect: 1.4, focus: '50% 30%' },
  { id: 'black-shell', title: 'Black Shell', photo: '1592078615290-033ee584e267', platform: 'Pinterest', savedAt: '2026-07-09', category: 'Design', aspect: 0.8 },
  { id: 'shell-lounge', title: 'Shell Lounge', photo: '1519947486511-46149fa0a254', platform: 'Pinterest', savedAt: '2026-07-10', category: 'Design', aspect: 0.8 },
  { id: 'swivel-seat', title: 'Swivel Seat', photo: '1580480055273-228ff5388ef8', platform: 'Web', savedAt: '2026-07-15', category: 'Design', aspect: 0.8 },
  { id: 'pale-stool', title: 'Pale Stool', photo: '1503602642458-232111445657', platform: 'Instagram', savedAt: '2026-07-18', category: 'Design', aspect: 0.8 },
  { id: 'vertical', title: 'Vertical', photo: '1511818966892-d7d671e672a2', platform: 'Are.na', savedAt: '2026-08-22', category: 'Design', aspect: 0.71 },
  { id: 'glass-canyon', title: 'Glass Canyon', photo: '1431576901776-e539bd916ba2', platform: 'Instagram', savedAt: '2026-08-24', category: 'Design', aspect: 0.8 },
  { id: 'night-grid', title: 'Night Grid', photo: '1486325212027-8081e485255e', platform: 'Behance', savedAt: '2026-08-30', category: 'Design', aspect: 0.8, focus: '30% 50%' },
  { id: 'green-velvet', title: 'Green Velvet', photo: '1555041469-a586c61ea9bc', platform: 'Pinterest', savedAt: '2026-09-05', category: 'Design', aspect: 1.3, focus: '50% 60%' },
  { id: 'orange-sofa', title: 'Orange Sofa', photo: '1567016432779-094069958ea5', platform: 'Instagram', savedAt: '2026-10-03', category: 'Design', aspect: 0.8, focus: '60% 50%' },

  // ── Fashion
  { id: 'white-ruffle', title: 'White Ruffle', photo: '1515372039744-b8f02a3ae446', platform: 'Instagram', savedAt: '2026-05-27', category: 'Fashion', aspect: 0.8, focus: '50% 40%' },
  { id: 'cotton-drape', title: 'Cotton Drape', photo: '1496217590455-aa63a8350eea', platform: 'Pinterest', savedAt: '2026-06-06', category: 'Fashion', aspect: 0.8, focus: '50% 40%' },
  { id: 'grey-suit', title: 'Grey Suit', photo: '1507679799987-c73779587ccf', platform: 'Pinterest', savedAt: '2026-08-27', category: 'Fashion', aspect: 0.8, focus: '50% 30%' },
  { id: 'open-knit', title: 'Open Knit', photo: '1434389677669-e08b4cac3105', platform: 'Instagram', savedAt: '2026-09-14', category: 'Fashion', aspect: 0.74 },
  { id: 'wool-rail', title: 'Wool Rail', photo: '1558769132-cb1aea458c5e', platform: 'Pinterest', savedAt: '2026-09-18', category: 'Fashion', aspect: 1.45 },
  { id: 'open-rail', title: 'Open Rail', photo: '1551232864-3f0890e580d9', platform: 'Pinterest', savedAt: '2026-09-21', category: 'Fashion', aspect: 0.8 },
  { id: 'coat-denim', title: 'Coat & Denim', photo: '1495121605193-b116b5b9c5fe', platform: 'Web', savedAt: '2026-09-24', category: 'Fashion', aspect: 0.8 },
  { id: 'red-isolated', title: 'Red, Isolated', photo: '1485230895905-ec40ba36b9bc', platform: 'Instagram', savedAt: '2026-10-08', category: 'Fashion', aspect: 0.79, focus: '52% 50%' },
  { id: 'blue-wall', title: 'Blue Wall', photo: '1517841905240-472988babdf9', platform: 'Instagram', savedAt: '2026-10-11', category: 'Fashion', aspect: 0.8, focus: '50% 30%' },

  // ── Climbing
  { id: 'granite-scramble', title: 'Granite Scramble', photo: '1502126324834-38f8e02d7160', platform: 'Instagram', savedAt: '2026-06-09', category: 'Climbing', aspect: 1.0, focus: '45% 50%' },
  { id: 'color-problems', title: 'Colour Problems', photo: '1564769662533-4f00a87b4056', platform: 'Instagram', savedAt: '2026-06-23', category: 'Climbing', aspect: 1.5 },
  { id: 'rope-sandstone', title: 'Rope, Sandstone', photo: '1516592673884-4a382d1124c2', platform: 'Instagram', savedAt: '2026-07-02', category: 'Climbing', aspect: 1.5 },
  { id: 'tonsai-overhang', title: 'Tonsai Overhang', photo: '1522163182402-834f871fd851', platform: 'Pinterest', savedAt: '2026-07-24', category: 'Climbing', aspect: 0.8, focus: '55% 40%' },
  { id: 'red-wall-lead', title: 'Red Wall Lead', photo: '1601224748193-d24f166b5c77', platform: 'Pinterest', savedAt: '2026-08-05', category: 'Climbing', aspect: 0.75 },
  { id: 'ridge-line', title: 'Ridge Line', photo: '1519904981063-b0cf448d479e', platform: 'Instagram', savedAt: '2026-08-14', category: 'Climbing', aspect: 1.5 },

  // ── Fitness
  { id: 'clean-pull', title: 'Clean Pull', photo: '1517836357463-d25dfeac3438', platform: 'Instagram', savedAt: '2026-05-12', category: 'Fitness', aspect: 1.0, focus: '50% 60%' },
  { id: 'tempo-run', title: 'Tempo Run', photo: '1571008887538-b36bb32f4571', platform: 'Web', savedAt: '2026-05-15', category: 'Fitness', aspect: 1.33 },
  { id: 'dead-hang', title: 'Dead Hang', photo: '1526506118085-60ce8714f8c5', platform: 'Instagram', savedAt: '2026-06-25', category: 'Fitness', aspect: 0.75 },
  { id: 'hill-repeats', title: 'Hill Repeats', photo: '1530143311094-34d807799e8f', platform: 'Instagram', savedAt: '2026-08-17', category: 'Fitness', aspect: 1.5 },
  { id: 'dumbbell-rack', title: 'Dumbbell Rack', photo: '1534438327276-14e5300c3a48', platform: 'Pinterest', savedAt: '2026-09-09', category: 'Fitness', aspect: 1.5 },
  { id: 'iron-stacked', title: 'Iron, Stacked', photo: '1576678927484-cc907957088c', platform: 'Pinterest', savedAt: '2026-09-11', category: 'Fitness', aspect: 0.7 },
  { id: 'back-squat', title: 'Back Squat', photo: '1541534741688-6078c6bfb5c5', platform: 'Instagram', savedAt: '2026-09-29', category: 'Fitness', aspect: 0.8 },
  { id: 'overhead', title: 'Overhead', photo: '1574680096145-d05b474e2155', platform: 'Instagram', savedAt: '2026-10-02', category: 'Fitness', aspect: 1.33 },
  { id: 'band-bells', title: 'Band & Bells', photo: '1584735935682-2f2b69dff9d2', platform: 'Pinterest', savedAt: '2026-10-14', category: 'Fitness', aspect: 1.0 },
]

// Curated relationships, both directions, each with the reason it exists.
const pairs: [string, string, Connection][] = [
  // carried over from the original curation
  ['undulation', 'shell-lounge', 'Similar form'],
  ['undulation', 'fanned-ribbon', 'Similar form'],
  ['shell-lounge', 'fanned-ribbon', 'Similar form'],
  ['folded-light', 'stacked-white', 'Echoed structure'],
  ['folded-light', 'three-gables', 'Echoed structure'],
  ['stacked-white', 'three-gables', 'Echoed structure'],
  ['open-knit', 'white-ruffle', 'Same palette'],
  ['open-knit', 'cotton-drape', 'Shared texture'],
  ['white-ruffle', 'cotton-drape', 'Same palette'],
  ['shell-chair', 'black-shell', 'Similar form'],
  ['shell-chair', 'swivel-seat', 'Similar form'],
  ['shell-chair', 'pale-stool', 'Shared setting'],
  ['black-shell', 'swivel-seat', 'Similar form'],
  ['black-shell', 'pale-stool', 'Shared setting'],
  ['swivel-seat', 'pale-stool', 'Shared setting'],
  ['wool-rail', 'open-rail', 'Shared setting'],
  ['wool-rail', 'coat-denim', 'Shared setting'],
  ['wool-rail', 'green-velvet', 'Shared texture'],
  ['open-rail', 'coat-denim', 'Shared setting'],
  ['sage-room', 'lamp-dresser', 'Shared setting'],
  ['sage-room', 'yellow-corner', 'Shared setting'],
  ['sage-room', 'arc-lamps', 'Echoed structure'],
  ['lamp-dresser', 'yellow-corner', 'Shared setting'],
  ['vertical', 'glass-canyon', 'Echoed structure'],
  ['vertical', 'night-grid', 'Echoed structure'],
  ['vertical', 'grey-suit', 'Same palette'],
  ['glass-canyon', 'night-grid', 'Echoed structure'],
  ['red-isolated', 'orange-sofa', 'Same palette'],
  ['red-isolated', 'blue-wall', 'Similar form'],
  // added with the new items, chosen by eye
  ['shell-chair', 'shell-lounge', 'Similar form'],
  ['open-knit', 'wool-rail', 'Shared texture'],
  ['folded-light', 'vertical', 'Echoed structure'],
  ['tonsai-overhang', 'red-wall-lead', 'Similar form'],
  ['tonsai-overhang', 'color-problems', 'Similar form'],
  ['rope-sandstone', 'red-wall-lead', 'Shared texture'],
  ['granite-scramble', 'ridge-line', 'Shared setting'],
  ['color-problems', 'dead-hang', 'Similar form'],
  ['ridge-line', 'hill-repeats', 'Shared setting'],
  ['tempo-run', 'hill-repeats', 'Shared setting'],
  ['clean-pull', 'back-squat', 'Shared setting'],
  ['clean-pull', 'band-bells', 'Shared setting'],
  ['back-squat', 'overhead', 'Similar form'],
  ['dead-hang', 'overhead', 'Same palette'],
  ['dumbbell-rack', 'iron-stacked', 'Echoed structure'],
  ['dumbbell-rack', 'band-bells', 'Shared setting'],
  ['iron-stacked', 'glass-canyon', 'Echoed structure'],
]

const relatedBy = new Map<string, Related[]>()
for (const [a, b, reason] of pairs) {
  relatedBy.set(a, [...(relatedBy.get(a) ?? []), { id: b, reason }])
  relatedBy.set(b, [...(relatedBy.get(b) ?? []), { id: a, reason }])
}

/** every saved item, oldest first */
export const items: SavedItem[] = drafts
  .map((d) => ({ ...d, related: relatedBy.get(d.id) ?? [] }))
  .sort((a, b) => a.savedAt.localeCompare(b.savedAt))

export const itemById = new Map(items.map((i) => [i.id, i]))

export const imageSrc = (item: SavedItem, w = 900) =>
  `https://images.unsplash.com/photo-${item.photo}?w=${w}&q=80&auto=format&fit=crop`

export const savedTime = (item: SavedItem) => Date.parse(`${item.savedAt}T12:00:00`)
