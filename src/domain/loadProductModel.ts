import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Mesh, MeshStandardMaterial, type Group } from 'three'
const cache=new Map<string,Promise<Group>>()
export function loadProductModel(url:string) {
  let request=cache.get(url)
  if(!request){
    request=new GLTFLoader().loadAsync(url).then(gltf=>{
      if(url.endsWith('/glass-wine.glb')){
        gltf.scene.traverse(object=>{if(object instanceof Mesh){
          const original=Array.isArray(object.material)?object.material:[object.material]
          object.material=new MeshStandardMaterial({color:0xd5e7e4,roughness:.3,metalness:0,flatShading:true})
          original.forEach(material=>material.dispose())
        }})
      }
      return gltf.scene
    }).catch(error=>{cache.delete(url);throw error})
    cache.set(url,request)
  }
  return request
}
