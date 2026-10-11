import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Group } from 'three'
const cache=new Map<string,Promise<Group>>()
export function loadProductModel(url:string) {
  let request=cache.get(url)
  if(!request){
    request=new GLTFLoader().loadAsync(url).then(gltf=>gltf.scene).catch(error=>{cache.delete(url);throw error})
    cache.set(url,request)
  }
  return request
}
