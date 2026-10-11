export const productModels = [
  { id: 'box', label: 'Коробочка', asset: '', preview: '' },
  { id: 'bottle', label: 'Бутылка', asset: 'soda-bottle.glb', preview: 'soda-bottle.png' },
  { id: 'oil', label: 'Масло', asset: 'bottle-oil.glb', preview: 'bottle-oil.png' },
  { id: 'sauce', label: 'Соус', asset: 'bottle-ketchup.glb', preview: 'bottle-ketchup.png' },
  { id: 'can', label: 'Банка', asset: 'soda-can.glb', preview: 'soda-can.png' },
  { id: 'carton', label: 'Пакет', asset: 'carton.glb', preview: 'carton.png' },
  { id: 'wine-glass', label: 'Бокал', asset: 'glass-wine.glb', preview: 'glass-wine.png' },
] as const
export type ProductModelId = typeof productModels[number]['id']
