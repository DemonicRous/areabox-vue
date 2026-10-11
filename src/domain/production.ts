import { cardboardProfiles } from '../data/catalog'
import { machines, type Passport } from '../data/machines'
import type { BoxInput } from './types'

export type Technology = 'inline' | 'flatbed' | 'rotary' | 'plotter'
export interface RouteSelection { printing: string; cutting: string; finishing: string }
export interface Geometry {
  width: number; height: number; slot: number; flap: number; body: number
  panels: number[]; points: number[][]; folds: number[][]; count: number
}
export function parameter(machine: Passport, id: string) {
  return machine.groups.flatMap(group => group.parameters).find(item => item.id === id)?.value
}
export function findMachine(id: string) { return Object.values(machines).flat().find(machine => machine.id === id) }
export function technology(id: string): Technology {
  return (['inline', 'flatbed', 'rotary', 'plotter'] as const).find(category => machines[category]?.some(machine => machine.id === id)) ?? 'plotter'
}
export function geometry(input: BoxInput, tech: Technology, finishing: string): Geometry | null {
  if (['0203', '0201-4'].includes(input.design) || ![input.lengthMm, input.widthMm, input.heightMm].every(value => Number.isFinite(value) && value > 0) || input.widthMm > input.lengthMm) return null
  const material = cardboardProfiles.find(profile => profile.id === input.profile)!
  const t = material.drawingThicknessMm, half = Math.floor(t / 2)
  const compound = input.design === '0201-2' || input.design === '0201-4'
  const stitch = finishing.startsWith('godswill') || finishing.startsWith('gofrotime')
  const slot = tech === 'inline' ? (['BF', 'BE', 'BD', 'BC'].includes(input.profile) ? 10 : 8) : 6
  let panels = [input.widthMm + half, input.lengthMm + t, input.widthMm + t, input.lengthMm + half]
  let firstIsLength = false
  if (input.design === '0201-2') {
    firstIsLength = finishing.startsWith('gofrotime')
    panels = firstIsLength ? [input.lengthMm + half, input.widthMm + t] : [input.widthMm + t, input.lengthMm + half]
  }
  if (input.design === '0201-4') panels = [Math.max(input.lengthMm, input.widthMm) + t]
  const panelWidth = panels.reduce((sum, panel) => sum + panel, 0)
  const fiveLayer = ['BF', 'BE', 'BD', 'BC'].includes(input.profile)
  const flap = compound || stitch ? 45 : tech === 'inline' ? (panelWidth > 1600 ? 40 : 35)
    : (tech === 'rotary' || tech === 'plotter') && fiveLayer ? 40
    : material.drawingThicknessMm > 2 ? 35 : 30
  const body = input.heightMm + t
  const staggered = input.creaseLevel === 'different' && tech !== 'inline'
  const offset = staggered ? material.creaseDistanceMm : 0
  const bottom = Math.floor((input.widthMm + t) / 2) + offset
  const top = input.design === '0200' ? 0 : bottom
  const height = top + body + bottom
  const xs = [flap]
  for (const panel of panels) xs.push(xs[xs.length - 1]! + panel)
  const levels = panels.map((_, index) => {
    const isLength = input.design === '0201-4' || (index % 2 === 0 ? firstIsLength : !firstIsLength)
    const shift = isLength ? offset : 0
    return [top === 0 ? 0 : top - shift, top + body + shift]
  })
  const points: number[][] = [[0, levels[0]![0]! + 10], [flap, levels[0]![0]!]]
  if (top > 0) {
    points.push([flap, 0])
    for (let index = 1; index < xs.length - 1; index++) {
      const x = xs[index]!, y = Math.max(levels[index - 1]![0]!, levels[index]![0]!)
      points.push([x-slot/2, 0], [x-slot/2, y], [x+slot/2, y], [x+slot/2, 0])
    }
  }
  const width = xs[xs.length - 1]!
  points.push([width, 0], [width, height])
  for (let index = xs.length - 2; index > 0; index--) {
    const x = xs[index]!, y = Math.min(levels[index - 1]![1]!, levels[index]![1]!)
    points.push([x+slot/2, height], [x+slot/2, y], [x-slot/2, y], [x-slot/2, height])
  }
  points.push([flap, height], [flap, levels[0]![1]!], [0, levels[0]![1]! - 10])
  const folds = panels.flatMap((_, index) => {
    const x = xs[index]!, end = xs[index+1]!, [y1, y2] = levels[index]!
    const lines = [[x,y1!,x,y2!]]
    if (top > 0) lines.push([x+(index ? slot/2 : 0),y1!,end-(index<panels.length-1 ? slot/2 : 0),y1!])
    lines.push([x+(index ? slot/2 : 0),y2!,end-(index<panels.length-1 ? slot/2 : 0),y2!])
    return lines
  })
  return { width, height, slot, flap, body, panels, points, folds, count: input.design === '0201-4' ? 4 : input.design === '0201-2' ? 2 : 1 }
}

export interface Check { blocked: string[]; review: string[] }
export interface ProductionRoute extends Check {
  selection: RouteSelection; line: Passport; names: string[]
  geometry: Geometry | null; sheet: SheetPlan | null
}
export function finishingLines(input: BoxInput, cutting: string): Passport[] {
  if (technology(cutting) === 'inline') return []
  if (['0201-2', '0201-4'].includes(input.design)) return machines.stitching!
  return [...machines.folderGluer!, ...(technology(cutting) === 'plotter' ? machines.manualGluer! : [])]
}
export function evaluateRoute(input: BoxInput, cutting: string, finishing: string): ProductionRoute {
  const line = findMachine(cutting)!
  const printing = !input.hasPrinting ? '' : input.printType === 'flexo' ? cutting : input.printType === 'digital' ? 'digital' : 'pinlong'
  const geo = geometry(input, technology(cutting), finishing)
  const sheet = geo ? planSheet(geo, line, printing ? findMachine(printing) : undefined) : null
  const chain = [machines.corrugator![0]!, ...(printing ? [findMachine(printing)!] : []), line, ...(finishing ? [findMachine(finishing)!] : [])]
    .filter((machine, index, all) => all.findIndex(item => item.id === machine.id) === index)
  const checks = chain.map(machine => {
    const category = Object.keys(machines).find(key => machines[key]!.some(item => item.id === machine.id))!
    const result = checkMachine(machine, input, geo, category, sheet)
    return { blocked: result.blocked.map(reason => `${machine.name}: ${reason}`), review: result.review.map(reason => `${machine.name}: ${reason}`) }
  })
  const blocked = checks.flatMap(check => check.blocked)
  if (input.hasPrinting && input.printType === 'digital' && technology(cutting) !== 'plotter') blocked.push('После цифровой печати Hanway вырезка доступна только на плоттере')
  if (technology(cutting) !== 'inline' && !finishing) blocked.push('Нет подходящей линии соединения')
  if (finishing && !finishingLines(input, cutting).some(machine => machine.id === finishing)) blocked.push('Способ соединения недоступен для этой конструкции')
  return { selection: { printing, cutting, finishing }, line, names: chain.map(machine => machine.name), geometry: geo, sheet, blocked: [...new Set(blocked)], review: [...new Set(checks.flatMap(check => check.review))] }
}
export function productionRoutes(input: BoxInput): ProductionRoute[] {
  const compound = ['0201-2', '0201-4'].includes(input.design)
  const lines = input.hasPrinting && input.printType === 'digital' ? [...machines.flatbed!, ...machines.rotary!, ...machines.plotter!]
    : input.hasPrinting && input.printType === 'flexo' ? [...(compound ? [] : machines.inline!), ...machines.flatbed!, ...machines.rotary!]
    : [...(!input.hasPrinting && !compound ? machines.inline! : []), ...machines.flatbed!, ...machines.rotary!, ...machines.plotter!]
  return lines.map(line => {
    const options = finishingLines(input, line.id)
    if (!options.length) return evaluateRoute(input, line.id, '')
    const routes = options.map(finishing => evaluateRoute(input, line.id, finishing.id))
    return routes.find(route => !route.blocked.length) ?? routes[0]!
  }).sort((a, b) => Number(!!a.blocked.length) - Number(!!b.blocked.length))
}
export interface SheetPlan { sheetX: number; sheetY: number; cols: number; rows: number; count: number; utilization: number }
function bounds(machine: Passport, id: string): [number, number] {
  const parts = parameter(machine,id)?.split('/') ?? []
  const value = (part: string | undefined, fallback: number) => part !== undefined && part.trim() !== '' && Number.isFinite(Number(part.trim())) ? Number(part.trim()) : fallback
  return [value(parts[0],0),value(parts[1],Infinity)]
}
// Same orientation as the source HTML: X across flute, Y along flute. No rotation.
export function planSheet(geo: Geometry, line: Passport, printer?: Passport): SheetPlan | null {
  const source = machines.corrugator![0]!
  const tech = technology(line.id)
  const lines = [line,source,...(printer && printer.id!==line.id ? [printer] : [])]
  const minX = Math.max(...lines.map(machine=>bounds(machine,'sheetX')[0]))
  const minY = Math.max(...lines.map(machine=>bounds(machine,'sheetY')[0]))
  const maxX = Math.min(...lines.map(machine=>bounds(machine,'sheetX')[1]))
  const maxY = Math.min(...lines.map(machine=>bounds(machine,'sheetY')[1]))
  if (!Number.isFinite(maxX) || !Number.isFinite(maxY)) return null
  const margins = ['marginLeft','marginRight','marginTop','marginBottom'].map(id=>Math.max(...lines.map(machine=>Number(parameter(machine,id)??0))))
  const extraX = tech==='inline' ? 8 : tech==='plotter' ? Math.max(40,margins[0]!+margins[1]!) : margins[0]!+margins[1]!
  const extraY = tech==='plotter' ? Math.max(40,margins[2]!+margins[3]!) : margins[2]!+margins[3]!
  const usableX = Math.min(maxX-extraX,...lines.map(machine=>Number(parameter(machine,'workingX')??Infinity)))
  const usableY = Math.min(maxY-extraY,...lines.map(machine=>Number(parameter(machine,'workingY')??Infinity)))
  if (tech==='inline') {
    const sheetX=geo.width+extraX, sheetY=geo.height+extraY
    return sheetX>=minX && sheetY>=minY && sheetX<=maxX && sheetY<=maxY ? {sheetX,sheetY,cols:1,rows:1,count:1,utilization:geo.width*geo.height/(sheetX*sheetY)} : null
  }
  const cols=Math.floor(usableX/geo.width), rows=Math.floor(usableY/geo.height)
  if (cols<1 || rows<1) return null
  if (tech==='plotter') return {sheetX:maxX,sheetY:maxY,cols,rows,count:cols*rows,utilization:cols*rows*geo.width*geo.height/(maxX*maxY)}
  // The original limits the optimization search to 1400 mm unless one blank needs more.
  const searchX=Math.min(maxX,Math.max(1400,geo.width+extraX)), searchY=Math.min(maxY,Math.max(1400,geo.height+extraY))
  let best: SheetPlan | null=null
  for(let c=1;c<=cols;c++) for(let r=1;r<=rows;r++) {
    const sheetX=Math.max(minX,c*geo.width+extraX), sheetY=Math.max(minY,r*geo.height+extraY)
    if (sheetX>searchX || sheetY>searchY || sheetX-extraX>usableX || sheetY-extraY>usableY) continue
    const count=c*r, area=sheetX*sheetY/count
    if (!best || area<best.sheetX*best.sheetY/best.count-1e-6 || Math.abs(area-best.sheetX*best.sheetY/best.count)<1e-6 && sheetX*sheetY<best.sheetX*best.sheetY) best={sheetX,sheetY,cols:c,rows:r,count,utilization:count*geo.width*geo.height/(sheetX*sheetY)}
  }
  return best
}
export function checkMachine(machine: Passport, input: BoxInput, geo: Geometry | null, category: string, selectedSheet?: SheetPlan | null): Check {
  const result: Check = { blocked: [], review: [] }
  if (![input.lengthMm, input.widthMm, input.heightMm].every(value => Number.isFinite(value) && value <= 2500)
    || input.lengthMm < 50 || input.widthMm < 50 || input.heightMm < 30 || input.widthMm > input.lengthMm) {
    result.blocked.push('Исправьте размеры короба'); return result
  }
  if (input.hasPrinting && (!Number.isInteger(input.printColors) || input.printColors < 1)) {
    result.blocked.push('Укажите положительное целое количество цветов'); return result
  }
  if (category === 'manualGluer') {
    if (!geo) result.review.push('Геометрия требует проверки')
    return result
  }
  const supported = parameter(machine, 'profiles')
  if (!supported) result.review.push('Профили не заданы')
  else if (!supported.split(' · ').some(value => value.split(' ')[0] === input.profile)) result.blocked.push(`Профиль ${input.profile} недоступен`)
  if (supported?.includes('E (Ламинация)') && input.profile === 'E') result.review.push('Профиль E требует ламинации')
  if (category === 'inline') {
    if (input.creaseLevel !== 'same') result.blocked.push('Биговки должны быть на одной высоте')
    if (!['0200', '0201'].includes(input.design)) result.blocked.push('Конструкция недоступна на инлайне')
  }
  if (category === 'stitching' && !['0201-2', '0201-4'].includes(input.design)) result.blocked.push('Сшивка доступна только для коробок из половинок')
  if (!geo) { result.review.push('Геометрия требует проверки'); return result }
  const minBlankHeight = parameter(machine,'minBlankHeight')
  if (minBlankHeight && geo.height < Number(minBlankHeight)) {
    result.blocked.push(`Паллетизация: высота одной развёртки ${geo.height} < ${minBlankHeight} мм`)
  }
  function range(id: string, value: number, label: string) {
    const raw = parameter(machine, id)
    if (!raw) { result.review.push(`${label}: пределы не заданы`); return }
    const limits = raw.split('/').map(part => Number(part.trim()))
    const min = limits[0], max = limits[1]
    if (Number.isFinite(min) && value < min!) result.blocked.push(`${label} ${value} < ${min} мм`)
    if (Number.isFinite(max) && value > max!) result.blocked.push(`${label} ${value} > ${max} мм`)
    if (!Number.isFinite(min) || !Number.isFinite(max)) result.review.push(`${label}: часть пределов не задана`)
  }
  if (category === 'folderGluer' || category === 'stitching' || category === 'inline') {
    range('panelL', input.lengthMm + cardboardProfiles.find(p=>p.id===input.profile)!.drawingThicknessMm, 'Панель L')
    range('panelW', input.widthMm + cardboardProfiles.find(p=>p.id===input.profile)!.drawingThicknessMm, 'Панель W')
    range('bodyH', geo.body, 'Корпус H')
    const flapId = category === 'inline' ? 'glue' : 'jointFlap'
    const raw = parameter(machine, flapId)
    if (raw?.includes('/')) range(flapId, geo.flap, 'Соединительный клапан')
    else if (raw && Number(raw) !== geo.flap) result.blocked.push(`Соединительный клапан должен быть ${raw} мм`)
  }
  let x = geo.width, y = geo.height
  if (['flatbed','rotary','plotter'].includes(category)) {
    const plan=selectedSheet===undefined ? planSheet(geo,machine) : selectedSheet
    if (!plan) { result.blocked.push('Развёртка не помещается в допустимую раскладку листа'); return result }
    x=plan.sheetX; y=plan.sheetY
  } else if (selectedSheet && ['corrugator','printing'].includes(category)) { x=selectedSheet.sheetX; y=selectedSheet.sheetY }
  if (category === 'inline') x += 8
  if (category === 'printing' && !selectedSheet) {
    x += Number(parameter(machine, 'marginLeft') ?? 0) + Number(parameter(machine, 'marginRight') ?? 0)
    y += Number(parameter(machine, 'marginTop') ?? 0) + Number(parameter(machine, 'marginBottom') ?? 0)
  }
  range('sheetX', x, 'Заготовка X'); range('sheetY', y, 'Заготовка Y')
  for (const [id, value, label] of [['workingX', geo.width, 'Рабочее поле X'], ['workingY', geo.height, 'Рабочее поле Y']] as const) {
    const limit = parameter(machine,id)
    if (limit && value > Number(limit)) result.blocked.push(`${label}: ${value} > ${limit} мм`)
  }
  if (input.hasPrinting && (category === 'printing' || input.printType === 'flexo' && ['inline','flatbed','rotary'].includes(category))) {
    const colors = parameter(machine,'printColors')
    if (colors && input.printColors > Number(colors)) result.blocked.push(`Печать: максимум ${colors} цвета`)
    if (!colors) result.review.push('Количество цветов требует проверки')
  }
  return result
}
