export type ProfileId = 'F' | 'E' | 'D' | 'B' | 'C' | 'BF' | 'BE' | 'BD' | 'BC'
export interface CardboardProfile {
  id: ProfileId
  actualThicknessMm: number
  drawingThicknessMm: number
  creaseDistanceMm: number
}
export type DesignId = '0200' | '0201' | '0202' | '0201-2' | '0201-4'
export type Suitability = 'fit' | 'review' | 'blocked'
export type PrintType = 'digital' | 'flexo' | 'pinlong'
export interface BoxInput {
  design: DesignId
  profile: ProfileId
  lengthMm: number
  widthMm: number
  heightMm: number
  hasPrinting: boolean
  printType: PrintType
  printColors: number
}
