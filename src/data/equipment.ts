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

export const asahiTemplate: EquipmentParameterGroup[] = [
  { id: 'general', title: 'Общие сведения', parameters: [
    { id: 'name', label: 'Название', format: 'text', value: 'Asahi' },
    { id: 'model', label: 'Модель', format: 'text' },
    { id: 'profiles', label: 'Доступные профили картона', format: 'text', value: 'F · E · D · B' },
    { id: 'designs', label: 'Доступные конструкции', format: 'text', value: 'Любая конструкция' },
  ] },
  { id: 'feed', title: 'Формат подачи', parameters: [
    { id: 'sheetX', label: 'Заготовка · X', format: 'range', unit: 'мм', value: '600 / 1580' },
    { id: 'sheetY', label: 'Заготовка · Y', format: 'range', unit: 'мм', value: '450 / 1080' },
    { id: 'fluteDirection', label: 'Направление гофры относительно X / Y', format: 'text', value: 'X — поперёк гофры, Y — вдоль гофры' },
  ] },
  { id: 'cutting', title: 'Рабочее поле и раскладка', parameters: [
    { id: 'workingX', label: 'Рабочее поле · X (расчётное)', format: 'number', unit: 'мм', value: String(1580 - 10 - 10) },
    { id: 'workingY', label: 'Рабочее поле · Y (расчётное)', format: 'number', unit: 'мм', value: String(1080 - 8 - 17) },
    { id: 'marginLeft', label: 'Поле слева', format: 'number', unit: 'мм', value: '10' },
    { id: 'marginRight', label: 'Поле справа', format: 'number', unit: 'мм', value: '10' },
    { id: 'marginTop', label: 'Поле сверху', format: 'number', unit: 'мм', value: '8' },
    { id: 'marginBottom', label: 'Поле снизу', format: 'number', unit: 'мм', value: '17' },
  ] },
  { id: 'operations', title: 'Операции и ограничения', parameters: [
    { id: 'printColors', label: 'Количество цветов печати', format: 'number', value: '2' },
    { id: 'printSide', label: 'Сторона печати', format: 'text', value: 'Внешняя сторона короба' },
    { id: 'dieCutting', label: 'Высечка', format: 'text', value: 'Плоская высечка' },
    { id: 'folderGluer', label: 'Фальцесклейка', format: 'text', value: 'Нет' },
    { id: 'specialModes', label: 'Особые режимы и ограничения', format: 'text' },
  ] },
]

export const wardTemplate: EquipmentParameterGroup[] = [
  { id: 'general', title: 'Общие сведения', parameters: [
    { id: 'name', label: 'Название', format: 'text', value: 'WARD' },
    { id: 'model', label: 'Модель', format: 'text' },
    { id: 'profiles', label: 'Доступные профили картона', format: 'text', value: 'E (Ламинация) · D · B · C · BF · BE · BD · BC' },
    { id: 'designs', label: 'Доступные конструкции', format: 'text', value: 'Любая конструкция' },
  ] },
  { id: 'feed', title: 'Формат подачи', parameters: [
    { id: 'sheetX', label: 'Заготовка · X', format: 'range', unit: 'мм', value: '560 / 2460' },
    { id: 'sheetY', label: 'Заготовка · Y', format: 'range', unit: 'мм', value: '560 / 1549' },
    { id: 'fluteDirection', label: 'Направление гофры относительно X / Y', format: 'text', value: 'X — поперёк гофры, Y — вдоль гофры' },
  ] },
  { id: 'cutting', title: 'Рабочее поле и раскладка', parameters: [
    { id: 'workingX', label: 'Рабочее поле · X (расчётное)', format: 'number', unit: 'мм', value: String(2460 - 10 - 10) },
    { id: 'workingY', label: 'Рабочее поле · Y (расчётное)', format: 'number', unit: 'мм', value: String(1549 - 10 - 10) },
    { id: 'marginLeft', label: 'Поле слева', format: 'number', unit: 'мм', value: '10' },
    { id: 'marginRight', label: 'Поле справа', format: 'number', unit: 'мм', value: '10' },
    { id: 'marginTop', label: 'Поле сверху', format: 'number', unit: 'мм', value: '10' },
    { id: 'marginBottom', label: 'Поле снизу', format: 'number', unit: 'мм', value: '10' },
  ] },
  { id: 'operations', title: 'Операции и ограничения', parameters: [
    { id: 'printColors', label: 'Количество цветов печати', format: 'number', value: '3' },
    { id: 'printSide', label: 'Сторона печати', format: 'text', value: 'Внешняя сторона короба' },
    { id: 'dieCutting', label: 'Высечка', format: 'text', value: 'Ротационная высечка' },
    { id: 'folderGluer', label: 'Фальцесклейка', format: 'text', value: 'Нет' },
    { id: 'breakWidth', label: 'Рабочая ширина разламывателя', format: 'number', unit: 'мм', value: '1600' },
    { id: 'specialModes', label: 'Особые режимы и ограничения', format: 'text' },
  ] },
]

export function createInlineTemplate(model: string): EquipmentParameterGroup[] {
  const groups: EquipmentParameterGroup[] = [
    { id: 'general', title: 'Общие сведения', parameters: [
      { id: 'name', label: 'Производитель', format: 'text', value: 'TCY' },
      { id: 'model', label: 'Модель', format: 'text', value: model },
      { id: 'profiles', label: 'Доступные профили картона', format: 'text' },
      { id: 'designs', label: 'Доступные конструкции', format: 'text' },
    ] },
    { id: 'feed', title: 'Формат подачи', parameters: [
      { id: 'sheetX', label: 'Заготовка · X', format: 'range', unit: 'мм' },
      { id: 'sheetY', label: 'Заготовка · Y', format: 'range', unit: 'мм' },
      { id: 'fluteDirection', label: 'Направление гофры относительно X / Y', format: 'text' },
      { id: 'feedExtraX', label: 'Припуск подачи · X', format: 'number', unit: 'мм' },
      { id: 'feedExtraY', label: 'Припуск подачи · Y', format: 'number', unit: 'мм' },
    ] },
    { id: 'box', title: 'Панели и клапаны', parameters: [
      { id: 'panelL', label: 'Панель L между биговками', format: 'range', unit: 'мм' },
      { id: 'panelW', label: 'Панель W между биговками', format: 'range', unit: 'мм' },
      { id: 'bodyH', label: 'Корпус H между биговками', format: 'range', unit: 'мм' },
      { id: 'glue', label: 'Соединительный клапан', format: 'range', unit: 'мм' },
      { id: 'slot', label: 'Ширина просечки', format: 'range', unit: 'мм' },
    ] },
    { id: 'operations', title: 'Операции и ограничения', parameters: [
      { id: 'printColors', label: 'Количество цветов печати', format: 'number' },
      { id: 'printSide', label: 'Сторона печати', format: 'text' },
      { id: 'slotter', label: 'Слоттер', format: 'text' },
      { id: 'dieCutting', label: 'Высечка', format: 'text' },
      { id: 'folderGluer', label: 'Фальцесклейка', format: 'text' },
      { id: 'specialModes', label: 'Особые режимы и ограничения', format: 'text' },
    ] },
  ]
  if (model === '5PA' || model === '9PA-2') {
    const values: Record<string, string> = {
      profiles: 'D · B · C · BF · BD · BE · BC',
      designs: '4-клапанные короба с биговками на одном уровне',
      sheetX: '915 / 2500',
      sheetY: '350 / 1200',
      fluteDirection: 'X — поперёк гофры, Y — вдоль гофры',
      panelL: '240 / 950',
      panelW: '150 / 950',
      bodyH: '90 / 1200',
      glue: '35 / 40',
      slot: '8 / 10',
      printColors: '2',
      printSide: 'Внешняя сторона короба',
      dieCutting: 'Слоттер',
      folderGluer: 'Да',
    }
    if (model === '9PA-2') {
      Object.assign(values, {
        profiles: 'E · D · B · C · BF · BD · BE · BC',
        sheetX: '530 / 1800',
        sheetY: '200 / 645',
        panelL: '125 / 771',
        panelW: '120 / 821',
        bodyH: '55 / 633',
        dieCutting: 'Слоттер, Ротационная высечка',
      })
    }
    for (const group of groups) {
      group.parameters = group.parameters.filter(parameter => !['feedExtraX', 'feedExtraY', 'slotter'].includes(parameter.id))
      for (const parameter of group.parameters) {
        if (values[parameter.id] !== undefined) parameter.value = values[parameter.id]
      }
    }
  }
  return groups
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
