const {buildSync}=require('esbuild')
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const output=buildSync({stdin:{contents:"export {fitProductModel} from './src/domain/productModel';export * as THREE from 'three'",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'cjs',write:false})
const moduleResult={exports:{}};new Function('require','module','exports',output.outputFiles[0].text)(require,moduleResult,moduleResult.exports)
const {fitProductModel,THREE}=moduleResult.exports
const source=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(2,5,3),new THREE.MeshStandardMaterial());mesh.position.set(8,3,-7);source.add(mesh)
for(const dimensions of [[60,60,100],[80,30,120]]){
 const fitted=fitProductModel(source,...dimensions),bounds=new THREE.Box3().setFromObject(fitted),size=bounds.getSize(new THREE.Vector3())
 assert(Math.abs(size.x-dimensions[0])<1e-6);assert(Math.abs(size.z-dimensions[1])<1e-6);assert(Math.abs(size.y-dimensions[2])<1e-6);assert(Math.abs(bounds.min.y)<1e-6);assert(Math.abs(bounds.min.x+bounds.max.x)<1e-6);assert(Math.abs(bounds.min.z+bounds.max.z)<1e-6)
 const copied=fitted.children[0].children[0];assert.notEqual(copied.geometry,mesh.geometry);assert.notEqual(copied.material,mesh.material)
}
assert.deepEqual(mesh.position.toArray(),[8,3,-7]);assert.throws(()=>fitProductModel(source,0,1,1))
for(const filename of fs.readdirSync('public/models/products').filter(f=>f.endsWith('.glb'))){const buffer=fs.readFileSync(path.join('public/models/products',filename));assert.equal(buffer.readUInt32LE(0),0x46546c67);assert.equal(buffer.readUInt32LE(8),buffer.length);const data=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());for(const image of data.images??[])if(image.uri)assert(fs.existsSync(path.join('public/models/products',image.uri)))}
console.log('Product bounds fit exact L/W/H, copies own geometry/material, all GLB texture references exist')
