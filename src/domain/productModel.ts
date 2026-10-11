import { Box3, Group, Mesh, Vector3 } from 'three'

/** Own the copied geometry/materials; the cached source is never mutated or disposed by a scene. */
export function fitProductModel(source: Group, length: number, width: number, height: number) {
  if (![length,width,height].every(n=>Number.isFinite(n)&&n>0)) throw new Error('Invalid product dimensions')
  const content=source.clone(true)
  content.traverse(object=>{
    if(object instanceof Mesh){
      object.geometry=object.geometry.clone()
      object.material=Array.isArray(object.material)?object.material.map(material=>material.clone()):object.material.clone()
      object.castShadow=false;object.receiveShadow=false
    }
  })
  content.updateMatrixWorld(true)
  const bounds=new Box3().setFromObject(content),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3())
  if (![size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0)) throw new Error('Empty product model')
  const normalized=new Group()
  normalized.add(content)
  content.position.sub(new Vector3(center.x,bounds.min.y,center.z))
  normalized.scale.set(length/size.x,height/size.y,width/size.z)
  normalized.updateMatrixWorld(true)
  return normalized
}
