const { buildSync } = require('esbuild')
const { strict: assert } = require('node:assert')
const vm = require('node:vm')
function bundle(file) {
  const output=buildSync({entryPoints:[file],bundle:true,platform:'node',format:'cjs',write:false})
  const context={module:{exports:{}},exports:{}}
  vm.runInNewContext(output.outputFiles[0].text,context)
  return context.module.exports
}
const {geometry}=bundle('src/domain/production.ts')
const {evaluateLayout,layoutVariants,layoutLimits}=bundle('src/domain/layout.ts')
const box={design:'0201',profile:'B',lengthMm:300,widthMm:200,heightMm:150,hasPrinting:false,creaseLevel:'same',printType:'digital',printColors:1}
const selection={printing:'',cutting:'ward',finishing:'signature-elite-135'}
const geo=geometry(box,'rotary',selection.finishing)
const variants=layoutVariants(box,selection,geo)
assert(variants.length>0)
assert(variants.some(plan=>plan.rows>1))
for(let i=1;i<variants.length;i++) assert(variants[i-1].sheetX*variants[i-1].sheetY/variants[i-1].count<=variants[i].sheetX*variants[i].sheetY/variants[i].count+1e-6)
assert(evaluateLayout(box,selection,geo,1,2,geo.width,geo.height*2).errors.length>0,'Margins must be reserved')
assert(evaluateLayout(box,selection,geo,1,2,3000,1000).errors.some(reason=>reason.includes('Лист X')))
assert(evaluateLayout(box,selection,geo,0,2).errors.length>0)
assert(evaluateLayout(box,selection,geo,1.5,2).errors.length>0)
assert(evaluateLayout(box,selection,geo,1,2,NaN,1000).errors.length>0)
const digital={...box,hasPrinting:true,printType:'digital'}
const plotter={printing:'digital',cutting:'kongsberg',finishing:'manual-gluing'}
assert.equal(layoutLimits(plotter).left,50)
assert.equal(layoutLimits(plotter).top,50)
assert(layoutVariants(digital,plotter,geometry(digital,'plotter',plotter.finishing)).length>0)
const digitalPlans=layoutVariants(digital,plotter,geometry(digital,'plotter',plotter.finishing))
assert(digitalPlans.some(plan=>plan.sheetX<2500 || plan.sheetY<1600))
for(const plan of digitalPlans) {
  const blank=geometry(digital,'plotter',plotter.finishing)
  assert(plan.sheetX>=plan.cols*blank.width+100)
  assert(plan.sheetY>=plan.rows*blank.height+100)
}
const standardPlotter=layoutVariants(box,{...plotter,printing:''},geometry(box,'plotter',plotter.finishing))
assert.equal(standardPlotter.length,1)
assert.equal(standardPlotter[0].sheetX,2500)
assert.equal(standardPlotter[0].sheetY,1600)
assert.equal(standardPlotter[0].sheetX*standardPlotter[0].sheetY/1e6,4)
const inline={printing:'',cutting:'tcy-5pa',finishing:''}
const inlineGeo=geometry(box,'inline','')
const inlineVariants=layoutVariants(box,inline,inlineGeo)
assert.equal(inlineVariants.length,1)
assert.equal(inlineVariants[0].sheetX,inlineGeo.width+8)
assert(evaluateLayout(box,inline,inlineGeo,2,1,2500,355).errors.length>0)
const pinlong={printing:'pinlong',cutting:'ward',finishing:'signature-elite-135'}
assert(layoutVariants({...box,hasPrinting:true,printType:'pinlong'},pinlong,geo).every(plan=>plan.sheetY<=840))
const overlap={...box,design:'0203',creaseLevel:'different'}
const overlapGeometry=geometry(overlap,'rotary',selection.finishing)
assert(layoutVariants(overlap,selection,overlapGeometry).length>0,'FEFCO 203 must support die layout')
assert(layoutVariants({...overlap,hasPrinting:true},plotter,geometry(overlap,'plotter',plotter.finishing)).length>0,'FEFCO 203 must support digital print and plotter layout')
const four={...box,design:'0201-4',lengthMm:500,widthMm:300,heightMm:250,creaseLevel:'different'}
const stitch={printing:'',cutting:'ward',finishing:'godswill-gts-3000'}
const pair=geometry(four,'rotary',stitch.finishing)
assert(layoutVariants(four,stitch,pair).length>0)
for(const plan of layoutVariants(four,stitch,pair)) assert(plan.sheetX>=plan.cols*(pair.parts[0].geometry.width+pair.parts[1].geometry.width)+20)
console.log('Layout variants, margins, complete route limits and manual input checks passed')
