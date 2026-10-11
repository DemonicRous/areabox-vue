const {buildSync}=require('esbuild')
const assert=require('node:assert/strict')
const vm=require('node:vm')
const out=buildSync({entryPoints:['src/domain/grid.ts'],bundle:true,platform:'node',format:'cjs',write:false})
const context={module:{exports:{}},exports:{}}
vm.runInNewContext(out.outputFiles[0].text,context)
const {calculateGrid,gridRoute}=context.module.exports
const machineOut=buildSync({entryPoints:['src/data/machines.ts'],bundle:true,platform:'node',format:'cjs',write:false})
const machineContext={module:{exports:{}},exports:{}}
vm.runInNewContext(machineOut.outputFiles[0].text,machineContext)
const {machines}=machineContext.module.exports
const box={design:'grid',profile:'B',lengthMm:300,widthMm:200,heightMm:150,hasPrinting:false,creaseLevel:'same',printType:'digital',printColors:1}
const settings={rows:3,cols:3,heightMm:0,profile:'D',clearanceMm:5,productLengthMm:0,productWidthMm:0,cellGapMm:1,slotMm:7,assembly:'premier'}
const model=calculateGrid(box,settings)
assert.equal(model.errors.length,0)
assert.equal(model.length,295)
assert.equal(model.width,195)
assert.equal(model.height,145)
assert.equal(model.depth,77.5)
assert.equal(model.thickness,2.5)
assert.equal(model.strips.length,2)
assert.equal(model.strips[0].quantity,2)
assert.equal(model.strips[0].slots.length,2)
assert(Math.abs(model.cellL*3+model.thickness*2-model.length)<1e-8,'Equal outer and inner cells must fit within the grid')
assert.equal(model.strips[0].points[0][1],0)
assert.equal(model.strips[1].points[0][1],145,'Cross strips have top-entry slots')
assert.equal(model.pieceArea,(295*2+195*2)*145/1e6)
const roda=gridRoute(box,settings,model,machines.gridCutting[0])
assert.equal(roda.blocked.length,0)
assert.equal(roda.sheet,null)
assert.equal(roda.area,model.pieceArea)
assert(roda.review.some(reason=>reason.includes('профили')),'Unknown profiles must remain review items')
assert(calculateGrid(box,{...settings,rows:1,cols:1}).errors.length)
assert(calculateGrid(box,{...settings,rows:2.5}).errors.length)
assert(calculateGrid(box,{...settings,heightMm:4}).errors.length)
assert(calculateGrid(box,{...settings,clearanceMm:NaN}).errors.length)
assert(calculateGrid(box,{...settings,productLengthMm:100}).errors.length,'Oversize products must not be presented as fitting')
assert(calculateGrid(box,{...settings,profile:'BC',slotMm:6}).errors.length)
assert(gridRoute(box,{...settings,slotMm:6},calculateGrid(box,{...settings,slotMm:6}),machines.gridCutting[0]).blocked.some(reason=>reason.includes('7 мм')))
const tall=calculateGrid({...box,heightMm:405},{...settings,assembly:'manual'})
assert(gridRoute({...box,heightMm:405},{...settings,assembly:'manual'},tall,machines.gridCutting[0]).blocked.some(reason=>reason.includes('45–200')))
const many={...settings,rows:8}
assert(gridRoute(box,many,calculateGrid(box,many),machines.gridCutting[0]).blocked.some(reason=>reason.includes('6 продольных')))
const plotter=gridRoute(box,settings,model,machines.plotter[0])
assert.equal(plotter.blocked.length,0)
assert.equal(plotter.sheet.sheetX,2500)
assert.equal(plotter.sheet.sheetY,1600)
assert.equal(plotter.sheet.items.length,plotter.sheet.kits*4)
assert.equal(plotter.area,4/plotter.sheet.kits)
for(const strip of model.strips) assert.equal(plotter.sheet.items.filter(item=>item.name===strip.name).length,plotter.sheet.kits*strip.quantity)
for(const item of plotter.sheet.items) {
  assert(item.x+item.width<=2460+1e-7)
  assert(item.y+item.height<=1560+1e-7)
}
const die=gridRoute(box,settings,model,machines.flatbed[0])
assert.equal(die.blocked.length,0)
assert(die.sheet.sheetX>=600 && die.sheet.sheetX<=1580)
assert(die.sheet.sheetY>=450 && die.sheet.sheetY<=1080)
assert.equal(die.sheet.items.length,die.sheet.kits*4)
const ward=gridRoute(box,settings,model,machines.rotary[0])
assert(ward.blocked.some(reason=>reason.includes('300')),'WARD single-blank palletizing minimum must apply to strips')
console.log('Grid geometry, equal cells, product fit, RODA/Premier limits and complete-kit packing passed')

const largeBox={...box,lengthMm:700,widthMm:600}
const autoSettings={...settings,assembly:'auto'}
const autoManual=gridRoute(largeBox,autoSettings,calculateGrid(largeBox,autoSettings),machines.gridCutting[0])
assert.equal(autoManual.assembly,'manual')
assert.equal(autoManual.blocked.length,0,'Manual assembly must remove Premier limits while preserving cutter checks')
assert(autoManual.review.some(reason=>reason.includes('Ручная сборка решётки')))
assert.equal(gridRoute(box,autoSettings,model,machines.gridCutting[0]).assembly,'premier')
const tooLong={...box,lengthMm:1500,widthMm:600}
assert(gridRoute(tooLong,autoSettings,calculateGrid(tooLong,autoSettings),machines.gridCutting[0]).blocked.some(reason=>reason.includes('1300')))

for(let i=0;i<plotter.sheet.items.length;i++) for(let j=i+1;j<plotter.sheet.items.length;j++) {
  const a=plotter.sheet.items[i],b=plotter.sheet.items[j]
  assert(a.x+a.width<=b.x+1e-7 || b.x+b.width<=a.x+1e-7 || a.y+a.height<=b.y+1e-7 || b.y+b.height<=a.y+1e-7,'Packed strips must not overlap')
}
const stateBundle=buildSync({stdin:{contents:"export * from './src/composables/useGridDraft'; export {useBoxDraft} from './src/composables/useBoxDraft'; export {evaluateRoute, geometry} from './src/domain/production'",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false})
const stateModule={exports:{}}
new Function('require','module','exports',stateBundle.outputFiles[0].text)(require,stateModule,stateModule.exports)
const state=stateModule.exports
state.gridConfirmed.value=true
state.gridView.value='strips'
assert.equal(state.gridConfirmed.value,true,'Changing drawing view must preserve confirmation')
state.gridDraft.heightMm=100
assert.equal(state.gridConfirmed.value,false,'Changing geometry must invalidate the route')
const combo={...box,design:'grid-0201'}
const combined=state.evaluateRoute(combo,'tcy-9pa-2','')
const plain=state.evaluateRoute({...combo,design:'0201'},'tcy-9pa-2','')
assert.equal(combined.geometry.width,plain.geometry.width)
assert.equal(combined.geometry.height,plain.geometry.height)
assert.equal(combined.blocked.length,plain.blocked.length,'Combined design must retain FEFCO 201 equipment eligibility')
console.log('Grid state retention, packing overlap and combined FEFCO 201 checks passed')
