<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
const props=defineProps<{length:number;width:number;height:number;gridHeight:number;rows:number;cols:number;cellL:number;cellW:number;board:number}>()
const host=ref<HTMLDivElement|null>(null)
const error=ref('')
const occupied=ref(new Set<string>())
let renderer:THREE.WebGLRenderer|undefined, scene:THREE.Scene|undefined, camera:THREE.PerspectiveCamera|undefined, controls:OrbitControls|undefined, group:THREE.Group|undefined, observer:ResizeObserver|undefined, frame=0
let targets:THREE.Mesh[]=[], products=new Map<string,THREE.Mesh>(), pointerStart:{x:number;y:number}|null=null
function disposeGroup() {
  group?.traverse(object=>{ if(object instanceof THREE.Mesh || object instanceof THREE.LineSegments) { object.geometry.dispose(); const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose()) } })
  if(group) scene?.remove(group)
}
function rebuild() {
  if(!scene||!controls||!camera) return
  disposeGroup();group=new THREE.Group();scene.add(group);targets=[];products=new Map()
  const totalX=props.cellL*props.cols+props.board*(props.cols-1), totalZ=props.cellW*props.rows+props.board*(props.rows-1)
  const unit=7/Math.max(totalX,totalZ,props.gridHeight,props.height),h=props.gridHeight*unit,t=props.board*unit
  function strip(sx:number,sz:number,x:number,z:number) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,h,sz),new THREE.MeshStandardMaterial({color:0xcaa86b,roughness:.85}))
    mesh.position.set(x,h/2,z);group!.add(mesh)
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0x6d5634}));edges.position.copy(mesh.position);group!.add(edges)
  }
  for(let r=1;r<props.rows;r++) strip(totalX*unit,t,0,(-totalZ/2+r*props.cellW+(r-.5)*props.board)*unit)
  for(let c=1;c<props.cols;c++) strip(t,totalZ*unit,(-totalX/2+c*props.cellL+(c-.5)*props.board)*unit,0)
  const base=new THREE.Mesh(new THREE.BoxGeometry(totalX*unit+.1,.06,totalZ*unit+.1),new THREE.MeshStandardMaterial({color:0x303b34}));base.position.y=-.04;group.add(base)
  const valid=new Set<string>()
  for(let r=0;r<props.rows;r++) for(let c=0;c<props.cols;c++) {
    const key=`${r}:${c}`;valid.add(key)
    const x=(-totalX/2+c*(props.cellL+props.board)+props.cellL/2)*unit,z=(-totalZ/2+r*(props.cellW+props.board)+props.cellW/2)*unit
    const target=new THREE.Mesh(new THREE.BoxGeometry(props.cellL*unit,Math.max(props.height,props.gridHeight)*unit,props.cellW*unit),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));target.position.set(x,Math.max(props.height,props.gridHeight)*unit/2,z);target.userData.key=key;group.add(target);targets.push(target)
    const product=new THREE.Mesh(new THREE.BoxGeometry(props.length*unit,props.height*unit,props.width*unit),new THREE.MeshStandardMaterial({color:0x58b4c7,transparent:true,opacity:.5}));product.position.set(x,props.height*unit/2,z);product.visible=occupied.value.has(key);group.add(product);products.set(key,product)
  }
  occupied.value=new Set([...occupied.value].filter(key=>valid.has(key)))
  controls.target.set(0,h/2,0);camera.position.set(9,h/2+7,9);controls.update()
}
function toggle(key:string) { const set=new Set(occupied.value);if(set.has(key))set.delete(key);else set.add(key);occupied.value=set;const product=products.get(key);if(product)product.visible=set.has(key) }
function clear() { occupied.value=new Set();products.forEach(product=>{product.visible=false}) }
onMounted(()=>{
  try {
    scene=new THREE.Scene();scene.background=new THREE.Color(0xecebe4)
    camera=new THREE.PerspectiveCamera(38,1,.1,100)
    renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.value!.appendChild(renderer.domElement)
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=30
    scene.add(new THREE.HemisphereLight(0xffffff,0x5b664f,2));const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.position.set(6,10,4);scene.add(sun)
    renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY}})
    renderer.domElement.addEventListener('pointerup',event=>{
      if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>5)return
      const bounds=renderer!.domElement.getBoundingClientRect(),pointer=new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1)
      const ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera!);const hit=ray.intersectObjects(targets,false)[0];if(hit)toggle(hit.object.userData.key as string)
    })
    rebuild()
    observer=new ResizeObserver(()=>{const bounds=host.value!.getBoundingClientRect();if(!bounds.width||!bounds.height)return;renderer!.setSize(bounds.width,bounds.height,false);camera!.aspect=bounds.width/bounds.height;camera!.updateProjectionMatrix()});observer.observe(host.value!)
    function animate() { frame=requestAnimationFrame(animate);controls!.update();renderer!.render(scene!,camera!) };animate()
  } catch { error.value='3D недоступно в этом браузере. Чертежи и расчёты доступны в других видах.' }
})
watch(()=>[props.length,props.width,props.height,props.gridHeight,props.rows,props.cols,props.cellL,props.cellW,props.board],rebuild)
onBeforeUnmount(()=>{cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();disposeGroup();renderer?.dispose()})
</script>
<template>
  <div class="relative h-[400px] overflow-hidden rounded-xl bg-canvas">
    <div ref="host" class="h-full w-full cursor-grab active:cursor-grabbing" aria-label="3D решётки: перетаскивание вращает, колесо меняет масштаб, нажатие на ячейку добавляет продукцию" />
    <p v-if="error" role="status" class="absolute inset-0 grid place-items-center p-6 text-sm text-muted">{{ error }}</p>
    <p v-else class="pointer-events-none absolute bottom-3 left-3 rounded-md bg-surface px-3 py-2 text-xs text-muted">Нажатие — заполнить ячейку · перетаскивание — вращение</p>
    <button v-if="occupied.size" type="button" class="absolute right-3 top-3 min-h-11 cursor-pointer rounded-md bg-surface px-3 text-xs" @click="clear">Убрать продукцию · {{ occupied.size }}</button>
  </div>
</template>
