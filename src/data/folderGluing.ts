import type { EquipmentParameterGroup } from './equipment'

export function createFolderGluingTemplate(name: string): EquipmentParameterGroup[] {
  const values: Record<string, string> = name === 'SIGNATURE ELITE-135'
    ? { sheetX: '150 / 1350', sheetY: '120 / 1000', panelL: '50 / —', panelW: '30 / —', bodyH: '65 / —', profiles: 'F · E · D · B · C' }
    : name === 'RITO JH-1700'
      ? { sheetX: '420 / 1700', sheetY: '180 / 1300' }
      : { sheetX: '130 или 280 / 1100', sheetY: '— / 800', bodyH: '70 / 800' }

  return [
    { id: 'general', title: 'Одноточечная склейка · 4-клапанный короб', parameters: [
      { id: 'profiles', label: 'Доступные профили картона', format: 'text', value: values.profiles },
    ] },
    { id: 'format', title: 'Размеры и ограничения', parameters: [
      { id: 'panelL', label: 'Панель L между биговками', format: 'range', unit: 'мм', value: values.panelL },
      { id: 'panelW', label: 'Панель W между биговками', format: 'range', unit: 'мм', value: values.panelW },
      { id: 'bodyH', label: 'Корпус H между биговками', format: 'range', unit: 'мм', value: values.bodyH },
      { id: 'sheetX', label: name === 'ROLAM-1100' ? 'Длина заготовки · X без соединительного клапана (минимум требует уточнения)' : 'Длина заготовки · X', format: 'range', unit: 'мм', value: values.sheetX },
      { id: 'sheetY', label: 'Ширина заготовки · Y', format: 'range', unit: 'мм', value: values.sheetY },
      { id: 'jointFlap', label: 'Соединительный клапан', format: 'range', unit: 'мм', value: '30 / 35' },
    ] },
  ]
}
