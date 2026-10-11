import { machines } from '../data/machines'
import { checkMachine, findMachine, parameter, technology, type Geometry, type RouteSelection, type SheetPlan } from './production'
import type { BoxInput } from './types'

export function layoutLimits(selection: RouteSelection) {
  const line = findMachine(selection.cutting)!
  const lines = [machines.corrugator![0]!, line, ...(selection.printing && selection.printing !== line.id ? [findMachine(selection.printing)!] : [])]
  const bound = (id: string, index: number, fallback: number) => lines.map(machine => {
    const raw = parameter(machine,id)?.split('/')[index]?.trim()
    return raw && Number.isFinite(Number(raw)) ? Number(raw) : fallback
  })
  const tech = technology(line.id)
  const margin = (id: string) => Math.max(tech === 'plotter' ? 20 : 0, ...lines.map(machine => Number(parameter(machine,id) ?? 0)))
  const left = tech === 'inline' ? 8 : margin('marginLeft'), right = tech === 'inline' ? 0 : margin('marginRight')
  const top = tech === 'inline' ? 0 : margin('marginTop'), bottom = tech === 'inline' ? 0 : margin('marginBottom')
  return { minX: Math.max(...bound('sheetX',0,0)), maxX: Math.min(...bound('sheetX',1,Infinity)),
    minY: Math.max(...bound('sheetY',0,0)), maxY: Math.min(...bound('sheetY',1,Infinity)),
    workingX: Math.min(...lines.map(machine => Number(parameter(machine,'workingX') ?? Infinity))),
    workingY: Math.min(...lines.map(machine => Number(parameter(machine,'workingY') ?? Infinity))), left, right, top, bottom, tech }
}
export function evaluateLayout(input: BoxInput, selection: RouteSelection, geo: Geometry, cols: number, rows: number, x?: number, y?: number) {
  const limits = layoutLimits(selection)
  const sheetX = x ?? Math.max(limits.minX, cols*geo.width+limits.left+limits.right)
  const sheetY = y ?? Math.max(limits.minY, rows*geo.height+limits.top+limits.bottom)
  const errors: string[] = []
  if (![cols,rows].every(value => Number.isInteger(value) && value>=1 && value<=100)) errors.push('Количество столбцов и рядов: целое число от 1 до 100')
  if (![sheetX,sheetY].every(value => Number.isFinite(value) && value>0)) errors.push('Укажите положительные размеры листа')
  if (sheetX<limits.minX || sheetX>limits.maxX) errors.push(`Лист X: допустимо ${limits.minX}–${limits.maxX} мм`)
  if (sheetY<limits.minY || sheetY>limits.maxY) errors.push(`Лист Y: допустимо ${limits.minY}–${limits.maxY} мм`)
  if (cols*geo.width>Math.min(sheetX-limits.left-limits.right,limits.workingX) || rows*geo.height>Math.min(sheetY-limits.top-limits.bottom,limits.workingY)) errors.push('Развёртки не помещаются в рабочее поле с учётом полей')
  if (limits.tech==='inline' && (cols!==1 || rows!==1 || sheetX!==geo.width+8 || sheetY!==geo.height)) errors.push('Инлайн: одна заготовка, припуск слева 8 мм')
  const plan: SheetPlan = { sheetX,sheetY,cols,rows,count:cols*rows,utilization:cols*rows*geo.width*geo.height/(sheetX*sheetY) }
  const review: string[] = []
  const ids = [...new Set(['fosber',selection.printing,selection.cutting,selection.finishing].filter(Boolean))]
  if (!errors.length) for (const id of ids) {
    const machine = findMachine(id)!
    const category = Object.keys(machines).find(key=>machines[key]!.some(item=>item.id===id))!
    const check = checkMachine(machine,input,geo,category,plan)
    errors.push(...check.blocked.map(reason=>`${machine.name}: ${reason}`))
    review.push(...check.review.map(reason=>`${machine.name}: ${reason}`))
  }
  return { plan, errors: [...new Set(errors)], review: [...new Set(review)], limits }
}
export function layoutVariants(input: BoxInput, selection: RouteSelection, geo: Geometry) {
  const limits = layoutLimits(selection)
  const cols = limits.tech==='inline' ? 1 : Math.min(100,Math.floor(Math.min(limits.maxX-limits.left-limits.right,limits.workingX)/geo.width))
  const rows = limits.tech==='inline' ? 1 : Math.min(100,Math.floor(Math.min(limits.maxY-limits.top-limits.bottom,limits.workingY)/geo.height))
  const variants: SheetPlan[] = []
  if (limits.tech==='plotter') {
    const result = evaluateLayout(input,selection,geo,cols,rows,2500,1600)
    return result.errors.length ? [] : [result.plan]
  }
  for(let c=1;c<=cols;c++) for(let r=1;r<=rows;r++) {
    const result = evaluateLayout(input,selection,geo,c,r)
    if (!result.errors.length) variants.push(result.plan)
  }
  return variants.sort((a,b)=>a.sheetX*a.sheetY/a.count-b.sheetX*b.sheetY/b.count || a.sheetX*a.sheetY-b.sheetX*b.sheetY)
}
