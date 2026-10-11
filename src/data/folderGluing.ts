import type { EquipmentParameterGroup } from './equipment'

export function createFolderGluingTemplate(name: string): EquipmentParameterGroup[] {
  const values: Record<string, string> = name === 'SIGNATURE ELITE-135'
    ? { sheetX: '150 / 1350', sheetY: '70 / 1000' }
    : name === 'RITO JH-1700'
      ? { sheetX: '420 / 1700', sheetY: '180 / 1300' }
      : { sheetY: '— / 800' }

  return [
    { id: 'general', title: 'Одноточечная склейка · 4-клапанный короб', parameters: [
      { id: 'profiles', label: 'Доступные профили картона', format: 'text' },
    ] },
    { id: 'format', title: 'Размеры и ограничения', parameters: [
      { id: 'panelL', label: 'Панель L между биговками', format: 'range', unit: 'мм' },
      { id: 'panelW', label: 'Панель W между биговками', format: 'range', unit: 'мм' },
      { id: 'bodyH', label: 'Корпус H между биговками', format: 'range', unit: 'мм' },
      { id: 'sheetX', label: 'Длина заготовки · X', format: 'range', unit: 'мм', value: values.sheetX },
      { id: 'sheetY', label: 'Ширина заготовки · Y', format: 'range', unit: 'мм', value: values.sheetY },
      { id: 'jointFlap', label: 'Соединительный клапан', format: 'range', unit: 'мм' },
    ] },
  ]
}