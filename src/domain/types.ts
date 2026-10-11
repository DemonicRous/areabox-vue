export type ProfileId = 'F' | 'E' | 'D' | 'B' | 'C' | 'BE' | 'BD' | 'BC'
export type DesignId = '0200' | '0201' | '0202' | '0201-2' | '0201-4'
export type Suitability = 'fit' | 'review' | 'blocked'
export interface BoxInput {
  design: DesignId
  profile: ProfileId
  lengthMm: number
  widthMm: number
  heightMm: number
}
