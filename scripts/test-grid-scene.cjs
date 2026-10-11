const {buildSync}=require('esbuild')
const assert=require('node:assert/strict')
const output=buildSync({stdin:{contents:"export {gridStripMeshGeometry,gridCameraTransition,gridCameraPose} from './src/domain/gridScene'; export {calculateGrid} from './src/domain/grid'; export * as THREE from 'three'",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false})
const result={exports:{}}
new Function('require','module','exports',output.outputFiles[0].text)(require,result,result.exports)
const {gridStripMeshGeometry,gridCameraTransition,gridCameraPose,calculateGrid,THREE}=result.exports
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

const target=new THREE.Vector3(0,2,0)
const poses=[new THREE.Vector3(1,.85,1),new THREE.Vector3(0,1,.001),new THREE.Vector3(0,.12,1),new THREE.Vector3(1,.12,0)].map(direction=>direction.normalize().multiplyScalar(12).add(target))
for(const from of poses)for(const to of poses){
  const transition=gridCameraTransition(from,to,target,target)
  assert(gridCameraPose(transition,0).position.distanceTo(from)<1e-8)
  assert(gridCameraPose(transition,1).position.distanceTo(to)<1e-8)
  let previous=from
  for(let i=0;i<=60;i++){
    const pose=gridCameraPose(transition,i/60)
    assert(Math.abs(pose.position.distanceTo(target)-12)<1e-8,'View changes must keep orbit distance instead of cutting through the object')
    assert(pose.position.distanceTo(previous)<1,'No single-frame jump during view transitions')
    const camera=new THREE.PerspectiveCamera(38,1.8,.05,200);camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld()
    const screen=target.clone().project(camera)
    assert(Math.abs(screen.x)<1e-8&&Math.abs(screen.y)<1e-8,'The grid center must stay centered throughout the transition')
    previous=pose.position
  }
}
const westA=new THREE.Vector3().setFromSpherical(new THREE.Spherical(12,1,Math.PI-.01))
const westB=new THREE.Vector3().setFromSpherical(new THREE.Spherical(12,1,-Math.PI+.01))
const wrap=gridCameraTransition(westA,westB,new THREE.Vector3(),new THREE.Vector3())
assert(Math.abs(wrap.end.theta-wrap.start.theta)<.021,'Yaw must cross the boundary along the short path')
const inFlight=gridCameraPose(gridCameraTransition(poses[0],poses[1],target,target),.4)
assert(gridCameraPose(gridCameraTransition(inFlight.position,poses[2],inFlight.target,target),0).position.distanceTo(inFlight.position)<1e-8,'Changing presets mid-flight must start at the current pose')
console.log('Camera preset paths remain centered, smooth, constant-distance and continuous when interrupted')
