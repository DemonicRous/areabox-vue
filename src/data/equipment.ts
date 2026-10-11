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

// Structure only: passport values must be supplied before any production checks.
export const fosberTemplate: EquipmentParameterGroup[] = [
  {
    id: 'general', title: 'Общие сведения', parameters: [
      { id: 'name', label: 'Название', format: 'text', value: 'Fosber' },
      { id: 'model', label: 'Модель', format: 'text' },
      { id: 'profiles', label: 'Доступные профили картона', format: 'text' },
    ],
  },
  {
    id: 'sheet', title: 'Формат листа', parameters: [
      { id: 'sheetX', label: 'РЕЗ · X · поперёк гофры', format: 'range', unit: 'мм' },
      { id: 'sheetY', label: 'РУБ · Y · вдоль гофры', format: 'range', unit: 'мм' },
      { id: 'cutTolerance', label: 'Точность реза', format: 'number', unit: '± мм' },
    ],
  },
  {
    id: 'slitting', title: 'Продольная резка и рилёвка', parameters: [
      { id: 'slittingKnives', label: 'Количество ножей', format: 'number', unit: 'шт.' },
      { id: 'scorers', label: 'Количество рилёвок', format: 'number', unit: 'шт.' },
      { id: 'minCutDistance', label: 'Минимальное расстояние между резами', format: 'number', unit: 'мм' },
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
