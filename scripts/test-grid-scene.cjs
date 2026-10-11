const {buildSync}=require('esbuild')
const assert=require('node:assert/strict')
const output=buildSync({stdin:{contents:"export {gridStripMeshGeometry} from './src/domain/gridScene'; export {calculateGrid} from './src/domain/grid'; export * as THREE from 'three'",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false})
const result={exports:{}}
new Function('require','module','exports',output.outputFiles[0].text)(require,result,result.exports)
const {gridStripMeshGeometry,calculateGrid,THREE}=result.exports
const settings={rows:3,cols:5,heightMm:0,profile:'B',clearanceMm:5,productLengthMm:50,productWidthMm:60,productHeightMm:100,cellGapMm:1,slotMm:7,assembly:'auto'}
for(const slot of [6,7]){
  const model=calculateGrid({}, {...settings,slotMm:slot})
  assert.equal(model.errors.length,0)
  for(const scale of [1,.01])for(const strip of model.strips){
    const geometry=gridStripMeshGeometry(strip,model.thickness,scale)
    geometry.computeBoundingBox()
    const bounds=geometry.boundingBox
    assert(Math.abs(bounds.max.x-bounds.min.x-strip.length*scale)<1e-5)
    assert(Math.abs(bounds.max.y-strip.height*scale)<1e-5)
    assert(Math.abs(bounds.max.z-bounds.min.z-model.thickness*scale)<1e-5)
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide})
    const mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true)
    function hits(x,y){
      const ray=new THREE.Raycaster(new THREE.Vector3((x-strip.length/2)*scale,y*scale,-10),new THREE.Vector3(0,0,1))
      return ray.intersectObject(mesh).length
    }
    for(const center of strip.slots){
      const openY=strip.fromTop?strip.height-model.depth/2:model.depth/2
      const closedY=strip.fromTop?(strip.height-model.depth)/2:(strip.height+model.depth)/2
      assert.equal(hits(center,openY),0,'Each production slot must be open in the 3D mesh')
      assert(hits(center,closedY)>0,'The remaining bridge must stay solid')
      assert(hits(center-slot/2-1,openY)>0,'Material beside the slot must stay solid')
      assert(hits(center+slot/2+1,openY)>0)
    }
    geometry.dispose();material.dispose()
  }
}
console.log('3D strip bounds and actual top/bottom openings match 6/7 mm production geometry')
