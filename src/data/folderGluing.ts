import type { EquipmentParameterGroup } from './equipment'

type Dimensions = [string, string][]
function dimensions(id: string, title: string, values: Dimensions): EquipmentParameterGroup {
  return { id, title, parameters: values.map(([label, value], index) => ({
    id: `${id}-${index}`, label: `${label} (по схеме)`, format: 'text', unit: 'мм', value,
  })) }
}

export function createFolderGluingTemplate(name: string): EquipmentParameterGroup[] {
  const groups: EquipmentParameterGroup[] = [
    { id: 'general', title: 'Общие сведения', parameters: [
      { id: 'name', label: 'Название линии', format: 'text', value: name },
      { id: 'profiles', label: 'Доступные профили картона', format: 'text' },
      { id: 'feeding', label: 'Подача заготовки', format: 'text', value: 'Ручная' },
    ] },
  ]
  if (name === 'SIGNATURE ELITE-135') {
    groups.push(
      dimensions('straight', 'Одноточечная склейка', [['B', '150–1350'], ['L', '70–1000']]),
      dimensions('lock-bottom', 'Самоскладывающееся дно', [['B', '180–1325'], ['L', '150–1000'], ['D', 'макс. 150'], ['h1', 'мин. 65'], ['a', 'мин. 50'], ['b', 'мин. 30']]),
      dimensions('four-corner', '4-точечная склейка', [['B', '185–1300'], ['L', '185–900'], ['b', '30–150']]),
      dimensions('six-corner', '6-точечная склейка', [['B', '250–1300'], ['L', '185–900'], ['b', '30–150']]),
      { id: 'production', title: 'Производительность', parameters: [
        { id: 'beltSpeed', label: 'Скорость ленты по заводской карте', format: 'number', unit: 'м/мин', value: '350' },
      ] },
    )
  } else if (name === 'ROLAM-1100') {
    groups.push(
      dimensions('lock-bottom', 'Самоскладывающееся дно', [['B+C+D+E', '130/280–1100'], ['C+D', '65/140'], ['F', '70–800'], ['G', 'макс. 800'], ['H', 'мин. 25'], ['L', '30–100']]),
      dimensions('straight', 'Одноточечная склейка', [['B+C+D+E', '130/280–1100'], ['C+D', '65/140'], ['C+D+E', '70'], ['F', '70–800'], ['G', 'макс. 800'], ['D+E (предфальцовка)', 'макс. 300'], ['G (предфальцовка)', 'макс. 500']]),
      dimensions('four-corner', '4-точечная склейка', [['A+B+C', '160–1100'], ['B', 'мин. 90'], ['F', '70–800'], ['G', 'макс. 800'], ['H', 'мин. 25'], ['L', '30–100']]),
      dimensions('six-corner', '6-точечная склейка', [['A+B+C+D+E', '260/310–1100'], ['B+C', 'мин. 80/140'], ['B', 'мин. 80'], ['C', 'мин. 30'], ['D', 'мин. 70'], ['F', '70–800'], ['G', 'макс. 800'], ['H', 'мин. 25'], ['L', '30–100']]),
      { id: 'notes', title: 'Уточнения по схеме', parameters: [
        { id: 'specialModes', label: 'Двойные значения через «/»', format: 'text', value: 'Сохранены как на заводской карте; условия выбора требуют уточнения' },
        { id: 'folding', label: 'Способ складывания', format: 'text', value: 'По двум / трём бигам' },
      ] },
    )
  } else if (name === 'RITO JH-1700') {
    groups.push(
      dimensions('straight', 'Одноточечная склейка', [['A', '420–1700'], ['B', '180–1300'], ['C', '210–850'], ['D', 'мин. 50']]),
      dimensions('lock-bottom', 'Склейка дна', [['A', '420–1700'], ['B', '210–850'], ['C', '100–840'], ['D', '35–200'], ['E', 'мин. 50']]),
      dimensions('four-corner', '4-точечная склейка', [['A', '120–1100'], ['B', '50–180'], ['C', '50–180'], ['D', '210–1300']]),
    )
  }
  return groups
}
