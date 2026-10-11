import { cardboardProfiles } from '../data/catalog'
import { machines, type Passport } from '../data/machines'
import { layoutLimits } from './layout'
import { checkMachine, parameter, type Geometry, type SheetPlan } from './production'
import type { BoxInput, ProfileId } from './types'

export interface GridSettings { rows: number; cols: number; heightMm: number; profile: ProfileId; clearanceMm: number; productLengthMm: number; productWidthMm: number; productHeightMm: number; cellGapMm: number; slotMm: number; assembly: 'auto' | 'premier' | 'manual' }
export interface GridStrip { name: string; length: number; height: number; quantity: number; slots: number[]; fromTop: boolean; points: number[][] }
export interface GridModel { errors: string[]; width: number; length: number; height: number; cellL: number; cellW: number; thickness: number; depth: number; strips: GridStrip[]; pieceArea: number }
export function calculateGrid(_box: BoxInput, settings: GridSettings): GridModel {
  const errors: string[] = []
  const t = cardboardProfiles.find(item=>item.id===settings.profile)?.actualThicknessMm ?? NaN
  const cellL = settings.productLengthMm+settings.cellGapMm, cellW = settings.productWidthMm+settings.cellGapMm
  const length = cellL*settings.cols+t*(settings.cols-1), width = cellW*settings.rows+t*(settings.rows-1)
  const height = settings.heightMm===0 ? settings.productHeightMm : settings.heightMm
  if (![settings.rows,settings.cols].every(n=>Number.isInteger(n)&&n>=1&&n<=30) || settings.rows*settings.cols<2) errors.push('Ряды и колонки: целые числа 1–30, не менее двух ячеек.')
  if (![settings.productLengthMm,settings.productWidthMm,settings.productHeightMm].every(n=>Number.isFinite(n)&&n>0&&n<=2500)) errors.push('Габариты продукта: положительные числа до 2500 мм.')
  if (![settings.clearanceMm,settings.cellGapMm].every(n=>Number.isFinite(n)&&n>=0)) errors.push('Допуск ячейки и запас короба должны быть неотрицательными числами.')
  if (!Number.isFinite(height) || height<20 || height>2500) errors.push('Высота решётки: от 20 до 2500 мм.')
  if (!Number.isFinite(t) || !Number.isFinite(settings.slotMm) || settings.slotMm<t || settings.slotMm>20) errors.push('Просечка должна быть не уже фактической толщины картона и не более 20 мм.')
  const depth = height/2+5
  const strips: GridStrip[] = []
  if (!errors.length) {
    for (const [name,len,quantity,count,cell,fromTop] of [
      ['Продольная полоса',length,settings.rows-1,settings.cols,cellL,false],
      ['Поперечная полоса',width,settings.cols-1,settings.rows,cellW,true],
    ] as const) {
      if (!quantity) continue
      const slots = Array.from({length:count-1},(_,i)=>(i+1)*cell+(i+.5)*t)
      if (slots.some(center=>center-settings.slotMm/2<=0||center+settings.slotMm/2>=len) || slots.some((center,i)=>i>0&&center-slots[i-1]!<=settings.slotMm)) errors.push('Просечки пересекаются или выходят за край полосы.')
      const points: number[][] = [[0,0],[len,0],[len,height]]
      for (const center of [...slots].reverse()) points.push([center+settings.slotMm/2,height],[center+settings.slotMm/2,height-depth],[center-settings.slotMm/2,height-depth],[center-settings.slotMm/2,height])
      points.push([0,height])
      strips.push({name,length:len,height,quantity,slots,fromTop,points:fromTop?points.map(([x,y])=>[x!,height-y!]):points})
    }
  }
  return { errors, length,width,height,cellL,cellW,thickness:t,depth,strips,pieceArea:strips.reduce((sum,strip)=>sum+strip.length*strip.height*strip.quantity,0)/1e6 }
}
export interface GridItem { x: number; y: number; width: number; height: number; name: string; kit: number }
export interface GridSheet { sheetX: number; sheetY: number; kits: number; area: number; items: GridItem[]; left: number; top: number }
export interface GridRouteResult { line:Passport; blocked:string[]; review:string[]; sheet:GridSheet|null; area:number|null; assembly:'premier'|'manual' }
export function gridRoute(box: BoxInput, settings: GridSettings, model: GridModel, line: Passport):GridRouteResult {
  if(settings.assembly==='auto') {
    const premier=gridRoute(box,{...settings,assembly:'premier'},model,line)
    const assemblyErrors=premier.blocked.filter(reason=>reason.startsWith('Premier PCM:'))
    if(!assemblyErrors.length) return premier
    const manual=gridRoute(box,{...settings,assembly:'manual'},model,line)
    manual.review.push(`Ручная сборка решётки: ${assemblyErrors.join(' ')}`)
    return manual
  }
  const blocked = [...model.errors], review: string[] = []
  for (const machine of [line, ...(settings.assembly==='premier' ? [machines.gridAssembly![0]!] : [])]) {
    const profiles = parameter(machine,'profiles')
    if (!profiles) review.push(`${machine.name}: доступные профили требуют подтверждения.`)
    else if (!profiles.split(' · ').some(profile=>profile.split(' ')[0]===settings.profile)) blocked.push(`${machine.name}: профиль ${settings.profile} недоступен.`)
  }
  if (settings.assembly==='premier' && !model.errors.length) {
    if(settings.rows<2||settings.cols<2) blocked.push('Premier PCM: для автоматической сборки нужны продольные и поперечные полосы.')
    if (settings.rows-1>6) blocked.push('Premier PCM: максимум 6 продольных полос.')
    if (model.length<150||model.length>650) blocked.push('Premier PCM: длина продольной полосы 150–650 мм.')
    if (model.height<80||model.height>360||model.height>model.length) blocked.push('Premier PCM: высота 80–360 мм и не больше длины продольной полосы.')
    const cross=model.strips.find(strip=>strip.fromTop)
    if(cross?.slots.some((position,index)=>index>0 && position-cross.slots[index-1]!<40)) blocked.push('Premier PCM: шаг просечек поперечной полосы не меньше 40 мм.')
  }
  if (line.id==='roda') {
    if (!model.errors.length) {
      if(model.height<80||model.height>400) blocked.push('RODA: высота полосы 80–400 мм.')
      if(model.depth<45||model.depth>200) blocked.push('RODA: глубина просечки 45–200 мм.')
      if(settings.slotMm!==7) blocked.push('RODA: ширина просечки 7 мм.')
      for(const strip of model.strips) {
        if(strip.length<50||strip.length>1300) blocked.push('RODA: длина полосы 50–1300 мм.')
        if(strip.slots.length>16) blocked.push('RODA: максимум 16 просечек за проход.')
        if(strip.slots[0]!==undefined&&strip.slots[0]<40) blocked.push('RODA: от края до первой просечки не меньше 40 мм.')
      }
    }
    review.push('RODA: площадь по габаритам полос; технологический расход материала не задан.')
    return { line, blocked, review, sheet:null, area:model.pieceArea,assembly:settings.assembly }
  }
  if (blocked.length) return {line,blocked,review,sheet:null,area:null,assembly:settings.assembly}
  const selection = {printing:'',cutting:line.id,finishing:''}
  const limits = layoutLimits(selection)
  const pieces = model.strips.flatMap(strip=>Array.from({length:strip.quantity},()=>strip)).sort((a,b)=>b.length-a.length)
  const maxX = Math.min(limits.maxX-limits.left-limits.right,limits.workingX)
  const maxY = Math.min(limits.maxY-limits.top-limits.bottom,limits.workingY)
  const maxRows = Math.floor(maxY/model.height)
  function pack(kits: number, usableX: number): GridItem[]|null {
    const rows: {used:number;items:GridItem[]}[]=[]
    for (const strip of pieces) for(let kit=1;kit<=kits;kit++) {
      let row=rows.find(row=>row.used+strip.length<=usableX+1e-7)
      if (!row) { if(rows.length>=maxRows) return null; row={used:0,items:[]}; rows.push(row) }
      row.items.push({x:row.used,y:(rows.length-1)*model.height,width:strip.length,height:model.height,name:strip.name,kit})
      row.items[row.items.length-1]!.y=rows.indexOf(row)*model.height
      row.used+=strip.length
    }
    return rows.flatMap(row=>row.items)
  }
  let best: GridSheet|null=null
  const widths=line.id==='kongsberg' ? [maxX] : [...new Set([pieces[0]!.length,maxX,...Array.from({length:Math.max(0,Math.floor((maxX-pieces[0]!.length)/20))},(_,i)=>pieces[0]!.length+i*20)])]
  if (pieces[0]!.length<=maxX&&maxRows>0) for (const usableX of widths) {
    const upper=Math.min(100,Math.floor(usableX*maxRows/pieces.reduce((sum,piece)=>sum+piece.length,0)))
    for(let kits=1;kits<=upper;kits++) {
      const items=pack(kits,usableX)
      if(!items) continue
      const sheetX=line.id==='kongsberg'?2500:Math.max(limits.minX,Math.ceil(Math.max(...items.map(item=>item.x+item.width))+limits.left+limits.right))
      const sheetY=line.id==='kongsberg'?1600:Math.max(limits.minY,Math.ceil(Math.max(...items.map(item=>item.y+item.height))+limits.top+limits.bottom))
      if(sheetX>limits.maxX||sheetY>limits.maxY) continue
      const area=sheetX*sheetY/kits/1e6
      if(!best||area<best.area-1e-9||Math.abs(area-best.area)<1e-9&&sheetX*sheetY<best.sheetX*best.sheetY) best={sheetX,sheetY,kits,area,items,left:limits.left,top:limits.top}
    }
  }
  if (!best) blocked.push('Полный комплект полос не помещается в рабочее поле.')
  if(best) for(const strip of model.strips) {
    const geo:Geometry={width:strip.length,height:strip.height,body:strip.height,flap:0,slot:settings.slotMm,panels:[strip.length],points:strip.points,folds:[],count:1}
    const sheet:SheetPlan={...best,cols:1,rows:1,count:best.items.length,utilization:model.pieceArea*best.kits/(best.sheetX*best.sheetY/1e6)}
    const input={...box,profile:settings.profile,hasPrinting:false}
    for(const [machine,category] of [[line,line.id==='kongsberg'?'plotter':machines.flatbed!.some(item=>item.id===line.id)?'flatbed':'rotary'],[machines.corrugator![0]!,'corrugator']] as const) {
      const check=checkMachine(machine,input,geo,category,sheet)
      blocked.push(...check.blocked.map(reason=>`${machine.name}: ${reason}`));review.push(...check.review.map(reason=>`${machine.name}: ${reason}`))
    }
  }
  return {line,blocked:[...new Set(blocked)],review:[...new Set(review)],sheet:best,area:best?.area??null,assembly:settings.assembly}
}
