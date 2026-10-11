import type { DesignId, ProfileId } from '../domain/types'

export const profiles: ProfileId[] = ['F', 'E', 'D', 'B', 'C', 'BE', 'BD', 'BC']
export const designs: { id: DesignId; title: string }[] = [
  { id: '0200', title: '0200 · без верхних клапанов' },
  { id: '0201', title: '0201 · четырёхклапанный' },
  { id: '0202', title: '0202 · с перекрытием' },
  { id: '0201-2', title: '0201 · две половины' },
  { id: '0201-4', title: '0201 · четыре четверти' },
]
