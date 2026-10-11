import { profiles } from './catalog'

export interface EquipmentParameter {
  id: string
  label: string
  format: 'range' | 'number' | 'text'
  unit?: string
  value?: string
}

export interface EquipmentParameterGroup {
  id: string
  title: string
  parameters: EquipmentParameter[]
}

export const kongsbergTemplate: EquipmentParameterGroup[] = [
  { id: 'general', title: 'Общие сведения', parameters: [
    { id: 'name', label: 'Название', format: 'text', value: 'Kongsberg' },
    { id: 'model', label: 'Модель', format: 'text', value: 'X44' },
    { id: 'profiles', label: 'Доступные профили картона', format: 'text', value: profiles.join(' · ') },
  ] },
  { id: 'format', title: 'Формат и рабочее поле', parameters: [
    { id: 'sheetX', label: 'Размер листа · X', format: 'range', unit: 'мм', value: '100 / 2500' },
    { id: 'sheetY', label: 'Размер листа · Y', format: 'range', unit: 'мм', value: '100 / 1600' },
    { id: 'workingX', label: 'Рабочее поле · X', format: 'number', unit: 'мм', value: '2460' },
    { id: 'workingY', label: 'Рабочее поле · Y', format: 'number', unit: 'мм', value: '1560' },
    { id: 'fluteDirection', label: 'Направление гофры относительно X / Y', format: 'text', value: 'X — поперёк гофры, Y — вдоль гофры' },
  ] },
]

// Confirmed values supplied by the user; unspecified parameters remain empty.
export const fosberTemplate: EquipmentParameterGroup[] = [
  {
    id: 'general', title: 'Общие сведения', parameters: [
      { id: 'name', label: 'Название', format: 'text', value: 'Fosber' },
      { id: 'model', label: 'Модель', format: 'text' },
      { id: 'profiles', label: 'Доступные профили картона', format: 'text', value: profiles.join(' · ') },
    ],
  },
  {
    id: 'sheet', title: 'Формат листа', parameters: [
      { id: 'sheetX', label: 'РЕЗ · X · поперёк гофры', format: 'range', unit: 'мм', value: '550 / 2600' },
      { id: 'sheetY', label: 'РУБ · Y · вдоль гофры', format: 'range', unit: 'мм', value: '140 / 2100' },
      { id: 'cutTolerance', label: 'Точность реза', format: 'number', unit: '± мм', value: '1' },
    ],
  },
  {
    id: 'slitting', title: 'Продольная резка и рилёвка', parameters: [
      { id: 'slittingKnives', label: 'Количество ножей', format: 'number', unit: 'шт.' },
      { id: 'scorers', label: 'Количество рилёвок', format: 'number', unit: 'шт.' },
      { id: 'minCutDistance', label: 'Минимальное расстояние между резами', format: 'number', unit: 'мм', value: '40' },
      { id: 'minScoreDistance', label: 'Минимальное расстояние между рилёвками', format: 'number', unit: 'мм' },
    ],
  },
  {
    id: 'production', title: 'Производственные ограничения', parameters: [
      { id: 'lanes', label: 'Максимальное число полос', format: 'number', unit: 'шт.' },
      { id: 'trim', label: 'Обрезь слева / справа', format: 'text', unit: 'мм' },
      { id: 'speed', label: 'Максимальная скорость', format: 'number', unit: 'м/мин' },
      { id: 'specialModes', label: 'Особые режимы и ограничения', format: 'text' },
    ],
  },
]
