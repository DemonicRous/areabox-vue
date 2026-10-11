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
    { id: 'model', label: 'Модель', format: 'text' },
    { id: 'profiles', label: 'Доступные профили картона', format: 'text' },
  ] },
  { id: 'format', title: 'Формат и рабочее поле', parameters: [
    { id: 'sheetX', label: 'Размер листа · X', format: 'range', unit: 'мм' },
    { id: 'sheetY', label: 'Размер листа · Y', format: 'range', unit: 'мм' },
    { id: 'workingX', label: 'Рабочее поле · X', format: 'number', unit: 'мм' },
    { id: 'workingY', label: 'Рабочее поле · Y', format: 'number', unit: 'мм' },
    { id: 'fluteDirection', label: 'Направление гофры относительно X / Y', format: 'text' },
  ] },
  { id: 'processing', title: 'Резка и биговка', parameters: [
    { id: 'thickness', label: 'Толщина материала', format: 'range', unit: 'мм' },
    { id: 'cuttingTool', label: 'Инструмент резки', format: 'text' },
    { id: 'creasingTool', label: 'Инструмент биговки', format: 'text' },
    { id: 'cutTolerance', label: 'Точность реза', format: 'number', unit: '± мм' },
    { id: 'creaseTolerance', label: 'Точность биговки', format: 'number', unit: '± мм' },
  ] },
  { id: 'layout', title: 'Поля и раскладка', parameters: [
    { id: 'marginLeft', label: 'Поле слева', format: 'number', unit: 'мм' },
    { id: 'marginRight', label: 'Поле справа', format: 'number', unit: 'мм' },
    { id: 'marginTop', label: 'Поле сверху', format: 'number', unit: 'мм' },
    { id: 'marginBottom', label: 'Поле снизу', format: 'number', unit: 'мм' },
    { id: 'gap', label: 'Минимальный зазор между деталями', format: 'number', unit: 'мм' },
    { id: 'rotation', label: 'Допустимый поворот заготовки', format: 'text' },
    { id: 'specialModes', label: 'Особые режимы и ограничения', format: 'text' },
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
