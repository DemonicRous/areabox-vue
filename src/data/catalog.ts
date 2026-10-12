import type { CardboardProfile, DesignId, ProfileId } from '../domain/types'

export const cardboardProfiles: CardboardProfile[] = [
  { id: 'F', actualThicknessMm: 1, drawingThicknessMm: 1, creaseDistanceMm: 1 },
  { id: 'E', actualThicknessMm: 1.5, drawingThicknessMm: 2, creaseDistanceMm: 1.5 },
  { id: 'D', actualThicknessMm: 2.5, drawingThicknessMm: 3, creaseDistanceMm: 2 },
  { id: 'B', actualThicknessMm: 3, drawingThicknessMm: 3, creaseDistanceMm: 2.5 },
  { id: 'C', actualThicknessMm: 4, drawingThicknessMm: 4, creaseDistanceMm: 3.5 },
  { id: 'BF', actualThicknessMm: 4, drawingThicknessMm: 4, creaseDistanceMm: 3.5 },
  { id: 'BE', actualThicknessMm: 5, drawingThicknessMm: 5, creaseDistanceMm: 4.5 },
  { id: 'BD', actualThicknessMm: 5.5, drawingThicknessMm: 5, creaseDistanceMm: 5 },
  { id: 'BC', actualThicknessMm: 7, drawingThicknessMm: 7, creaseDistanceMm: 6.5 },
]
export const profiles: ProfileId[] = cardboardProfiles.map(profile => profile.id)
export const designs: { id: DesignId; title: string }[] = [
  { id: '0200', title: '0200 · без верхних клапанов' },
  { id: '0201', title: '0201 · четырёхклапанный' },
  { id: '0203', title: '0203 · полное перекрытие' },
  { id: '0201-2', title: '0201 · две половины' },
  { id: '0201-4', title: '0201 · четыре четверти' },
  { id: '0203-2', title: '0203 · две половины' },
  { id: '0203-4', title: '0203 · четыре четверти' },
  { id: 'grid', title: 'Решётка · разделители' },
  { id: 'grid-0201', title: 'Решётка + FEFCO 201 · короб с разделителями' },
]
