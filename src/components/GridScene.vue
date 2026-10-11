<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ArrowPathIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, MinusIcon, PlusIcon, PauseIcon, PlayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import type { GridStrip } from '../domain/grid'
import { gridStripMeshGeometry } from '../domain/gridScene'
const props=defineProps<{length:number;width:number;height:number;gridHeight:number;rows:number;cols:number;cellL:number;cellW:number;board:number;edgeTrim:number;strips:GridStrip[]}>()
type View='perspective'|'top'|'front'|'side'
type Product={mesh:THREE.Mesh<THREE.BoxGeometry,THREE.MeshStandardMaterial>;progress:number;delay:number;baseY:number}
const host=ref<HTMLDivElement|null>(null),error=ref(''),ready=ref(false)
const occupied=ref(new Set<number>()),selected=ref(0),hovered=ref<number|null>(null)
const expanded=ref(false),exploded=ref(false),rotating=ref(false),view=ref<View|null>('perspective')
const count=computed(()=>props.rows*props.cols)
const active=computed(()=>hovered.value??selected.value)
const cellDescription=computed(()=>`Ряд ${Math.floor(active.value/props.cols)+1} · колонка ${active.value%props.cols+1}`)
const views: {id:View;label:string}[]=[{id:'perspective',label:'Перспектива'},{id:'top',label:'Сверху'},{id:'front',label:'Спереди'},{id:'side',label:'Сбоку'}]
const fmt=(n:number)=>n.toLocaleString('ru-RU',{maximumFractionDigits:2})
let renderer:THREE.WebGLRenderer|undefined,scene:THREE.Scene|undefined,camera:THREE.PerspectiveCamera|undefined,controls:OrbitControls|undefined,group:THREE.Group|undefined
let resizeObserver:ResizeObserver|undefined,themeObserver:MutationObserver|undefined,intersection:IntersectionObserver|undefined
let frame=0,lastTime=0,visible=true,disposed=false,unit=1,totalX=1,totalZ=1,assembly=0,fitDistance=12
let pointerStart:{x:number;y:number;id:number}|null=null
const pointers=new Set<number>(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2()
let targets:THREE.Mesh[]=[],products=new Map<number,Product>(),strips:THREE.Group[]=[],highlight:THREE.Mesh|undefined
let productGeometry:THREE.BoxGeometry|undefined
let tween:{from:THREE.Vector3;to:THREE.Vector3;targetFrom:THREE.Vector3;targetTo:THREE.Vector3;start:number}|null=null
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
function invalidate() { if(!frame&&!disposed&&visible&&!document.hidden&&renderer) frame=requestAnimationFrame(renderFrame) }
function disposeGroup() {
  const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
  group?.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.LineSegments){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material))}})
  targets.forEach(target=>{geometries.add(target.geometry);(Array.isArray(target.material)?target.material:[target.material]).forEach(material=>materials.add(material))})
  if(productGeometry)geometries.add(productGeometry)
  geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose())
  if(group)scene?.remove(group)
  group=undefined;targets=[];products.clear();strips=[];highlight=undefined
}
function applyTheme() {
  if(!scene||!renderer)return
  const dark=document.documentElement.classList.contains('dark')
  scene.background=new THREE.Color(dark?0x151c20:0xf2f4f1)
  const floor=group?.getObjectByName('floor') as THREE.Mesh<THREE.PlaneGeometry,THREE.MeshStandardMaterial>|undefined
  if(floor)floor.material.color.setHex(dark?0x202a2c:0xe3e8e1)
  invalidate()
}
function moveCamera(position:THREE.Vector3,target:THREE.Vector3) {
  if(!camera||!controls)return
  rotating.value=false;controls.autoRotate=false
  if(reduced.matches||!ready.value){camera.position.copy(position);controls.target.copy(target);controls.update();tween=null}
  else tween={from:camera.position.clone(),to:position,targetFrom:controls.target.clone(),targetTo:target,start:performance.now()}
  invalidate()
}
function setView(next:View) {
  if(!camera||!controls)return
  view.value=next
  const height=Math.max(props.height,props.gridHeight)*unit+(exploded.value?props.gridHeight*unit+1.2:0)
  const target=new THREE.Vector3(0,height*.45,0)
  const radius=Math.sqrt((totalX*unit)**2+(totalZ*unit)**2+height**2)/2
  const vfov=THREE.MathUtils.degToRad(camera.fov),hfov=2*Math.atan(Math.tan(vfov/2)*camera.aspect)
  fitDistance=radius/Math.sin(Math.min(vfov,hfov)/2)*1.12
  controls.minDistance=Math.max(.8,radius*.35);controls.maxDistance=fitDistance*3
  const direction=next==='top'?new THREE.Vector3(0,1,.001):next==='front'?new THREE.Vector3(0,.12,1):next==='side'?new THREE.Vector3(1,.12,0):new THREE.Vector3(1,.85,1)
  moveCamera(target.clone().add(direction.normalize().multiplyScalar(fitDistance)),target)
}
function zoom(factor:number) {
  if(!camera||!controls)return
  view.value=null
  const offset=camera.position.clone().sub(controls.target)
  const distance=THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance)
  moveCamera(controls.target.clone().add(offset.normalize().multiplyScalar(distance)),controls.target.clone())
}
function addProduct(index:number,delay=0) {
  if(products.has(index)||!group||!productGeometry)return
  const row=Math.floor(index/props.cols),col=index%props.cols
  const material=new THREE.MeshStandardMaterial({color:0x699f97,roughness:.5,transparent:true,opacity:0,depthWrite:false})
  const mesh=new THREE.Mesh(productGeometry,material)
  mesh.position.set((-totalX/2+col*(props.cellL+props.board)+props.cellL/2)*unit,props.height*unit/2,(-totalZ/2+row*(props.cellW+props.board)+props.cellW/2)*unit)
  mesh.castShadow=count.value<=144;mesh.receiveShadow=true;mesh.visible=false;group.add(mesh)
  products.set(index,{mesh,progress:0,delay:performance.now()+delay,baseY:props.height*unit/2})
}
function toggle(index:number) {
  if(exploded.value)return
  selected.value=index
  const next=new Set(occupied.value)
  if(next.has(index))next.delete(index);else{next.add(index);addProduct(index)}
  occupied.value=next;invalidate()
}
function fill() {
  if(exploded.value)return
  const next=new Set<number>()
  for(let i=0;i<count.value;i++){next.add(i);addProduct(i,reduced.matches?0:Math.min(450,i*22))}
  occupied.value=next;invalidate()
}
function clear() {occupied.value=new Set();invalidate()}
function updateHighlight() {
  if(!highlight)return
  const index=active.value,row=Math.floor(index/props.cols),col=index%props.cols
  highlight.position.set((-totalX/2+col*(props.cellL+props.board)+props.cellL/2)*unit,.015,(-totalZ/2+row*(props.cellW+props.board)+props.cellW/2)*unit)
  highlight.visible=!exploded.value;invalidate()
}
function hit(event:PointerEvent):number|null {
  if(!renderer||!camera||exploded.value)return null
  const bounds=renderer.domElement.getBoundingClientRect()
  pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1)
  raycaster.setFromCamera(pointer,camera)
  const result=raycaster.intersectObjects(targets,false)[0]
  return result ? result.object.userData.index as number : null
}
function onDown(event:PointerEvent) {
  pointers.add(event.pointerId)
  if(pointers.size>1){pointerStart=null;return}
  if(event.button!==0)return
  pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId}
}
function onMove(event:PointerEvent) {
  if(pointers.size||event.pointerType==='touch')return
  hovered.value=hit(event)
  if(renderer)renderer.domElement.style.cursor=hovered.value!==null?'pointer':'grab'
}
function onUp(event:PointerEvent) {
  pointers.delete(event.pointerId)
  const start=pointerStart;pointerStart=null
  if(!start||start.id!==event.pointerId||Math.hypot(event.clientX-start.x,event.clientY-start.y)>5)return
  const index=hit(event);if(index!==null)toggle(index)
}
function onCancel(event:PointerEvent){pointers.delete(event.pointerId);pointerStart=null}
function onLeave(){hovered.value=null}
function onKey(event:KeyboardEvent) {
  if(event.target!==host.value||exploded.value)return
  let next=selected.value
  if(event.key==='ArrowLeft')next--
  else if(event.key==='ArrowRight')next++
  else if(event.key==='ArrowUp')next-=props.cols
  else if(event.key==='ArrowDown')next+=props.cols
  else if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle(next);return}
  else return
  event.preventDefault();hovered.value=null;selected.value=THREE.MathUtils.clamp(next,0,count.value-1)
}
function rebuild() {
  if(!scene||!controls||!camera)return
  disposeGroup();group=new THREE.Group();scene.add(group)
  totalX=props.cellL*props.cols+props.board*(props.cols-1);totalZ=props.cellW*props.rows+props.board*(props.rows-1)
  unit=7/Math.max(totalX,totalZ,props.gridHeight,props.height)
  const h=props.gridHeight*unit
  for(const strip of props.strips){
    const geometry=gridStripMeshGeometry(strip,props.board,unit)
    const material=new THREE.MeshStandardMaterial({color:0xc9ae83,roughness:.9})
    const edgeGeometry=new THREE.EdgesGeometry(geometry)
    for(let i=0;i<strip.quantity;i++){
      const part=new THREE.Group(),mesh=new THREE.Mesh(geometry,material)
      mesh.castShadow=true;mesh.receiveShadow=true;part.add(mesh)
      part.add(new THREE.LineSegments(edgeGeometry,new THREE.LineBasicMaterial({color:0x806c4d,transparent:true,opacity:.55})))
      if(strip.fromTop){part.rotation.y=-Math.PI/2;part.position.x=(-totalX/2+(i+1)*props.cellL+(i+.5)*props.board)*unit}
      else part.position.z=(-totalZ/2+(i+1)*props.cellW+(i+.5)*props.board)*unit
      part.userData.lift=strip.fromTop ? .5 : h+1.2;group.add(part);strips.push(part)
    }
  }
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({roughness:1}));floor.name='floor';floor.rotation.x=-Math.PI/2;floor.position.y=-.035;floor.receiveShadow=true;group.add(floor)
  const baseGeometry=new THREE.BoxGeometry(totalX*unit,.012,totalZ*unit)
  const base=new THREE.LineSegments(new THREE.EdgesGeometry(baseGeometry),new THREE.LineBasicMaterial({color:0x788a83,transparent:true,opacity:.4}));baseGeometry.dispose();group.add(base)
  highlight=new THREE.Mesh(new THREE.PlaneGeometry(props.cellL*unit,props.cellW*unit),new THREE.MeshBasicMaterial({color:0x76b5a0,transparent:true,opacity:.22,depthWrite:false}));highlight.rotation.x=-Math.PI/2;group.add(highlight)
  const targetGeometry=new THREE.BoxGeometry(props.cellL*unit,Math.max(props.height,props.gridHeight)*unit,props.cellW*unit),targetMaterial=new THREE.MeshBasicMaterial()
  for(let i=0;i<count.value;i++){
    const row=Math.floor(i/props.cols),col=i%props.cols
    const target=new THREE.Mesh(targetGeometry,targetMaterial)
    target.position.set((-totalX/2+col*(props.cellL+props.board)+props.cellL/2)*unit,Math.max(props.height,props.gridHeight)*unit/2,(-totalZ/2+row*(props.cellW+props.board)+props.cellW/2)*unit)
    target.userData.index=i;target.updateMatrixWorld(true);targets.push(target)
  }
  occupied.value=new Set([...occupied.value].filter(index=>index<count.value));selected.value=Math.min(selected.value,count.value-1);hovered.value=null
  productGeometry=new THREE.BoxGeometry(props.length*unit,props.height*unit,props.width*unit)
  occupied.value.forEach(index=>addProduct(index))
  assembly=exploded.value?1:0;strips.forEach(part=>{part.position.y=part.userData.lift*assembly})
  updateHighlight();applyTheme();setView(view.value??'perspective');invalidate()
}
function renderFrame(time:number) {
  frame=0
  if(disposed||!visible||document.hidden||!renderer||!scene||!camera||!controls)return
  const dt=Math.min(.05,(time-lastTime)/1000||.016);lastTime=time
  let moving=false
  if(tween){
    const progress=reduced.matches?1:Math.min(1,(time-tween.start)/360),ease=1-(1-progress)**3
    camera.position.lerpVectors(tween.from,tween.to,ease);controls.target.lerpVectors(tween.targetFrom,tween.targetTo,ease)
    if(progress===1)tween=null;else moving=true
  }
  const goal=exploded.value?1:0
  if(Math.abs(assembly-goal)>.001){assembly=reduced.matches?goal:THREE.MathUtils.lerp(assembly,goal,1-Math.exp(-dt*9));if(Math.abs(assembly-goal)<.001)assembly=goal;strips.forEach(part=>{part.position.y=part.userData.lift*assembly});moving=true}
  products.forEach((product,index)=>{
    const target=!exploded.value&&occupied.value.has(index)?1:0
    if(time<product.delay&&target){moving=true;return}
    if(Math.abs(product.progress-target)>.001){
      product.progress=reduced.matches?target:THREE.MathUtils.lerp(product.progress,target,1-Math.exp(-dt*10))
      if(Math.abs(product.progress-target)<.001)product.progress=target
      product.mesh.visible=product.progress>0
      product.mesh.material.opacity=product.progress*.85
      product.mesh.position.y=product.baseY+(1-product.progress)*(props.gridHeight*unit+.6)
      moving=true
    }
  })
  const changed=controls.update();renderer.render(scene,camera)
  if(moving||changed||controls.autoRotate)invalidate()
}
function resize(){
  if(!host.value||!renderer||!camera)return
  const bounds=host.value.getBoundingClientRect();if(!bounds.width||!bounds.height)return
  renderer.setSize(bounds.width,bounds.height,false);camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix()
  if(ready.value&&view.value)setView(view.value)
  invalidate()
}
function onVisibility(){lastTime=performance.now();invalidate()}
function onReduced(){if(reduced.matches)rotating.value=false;invalidate()}
function onControlStart(){tween=null;view.value=null;hovered.value=null;rotating.value=false;invalidate()}
watch(active,updateHighlight)
watch(exploded,()=>{hovered.value=null;updateHighlight();setView(view.value??'perspective');invalidate()})
watch(rotating,value=>{if(controls){controls.autoRotate=value;controls.autoRotateSpeed=.8;if(value)view.value=null;invalidate()}})
watch(()=>[props.length,props.width,props.height,props.gridHeight,props.rows,props.cols,props.cellL,props.cellW,props.board,props.edgeTrim,props.strips],rebuild)
onMounted(()=>{
  try{
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.05,200)
    renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace
    host.value!.appendChild(renderer.domElement)
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.12;controls.maxPolarAngle=Math.PI/2-.015;controls.screenSpacePanning=true
    controls.addEventListener('change',invalidate);controls.addEventListener('start',onControlStart)
    scene.add(new THREE.HemisphereLight(0xffffff,0x687975,2.8))
    const sun=new THREE.DirectionalLight(0xfff4de,3);sun.position.set(5,10,6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.bias=-.0002;sun.shadow.normalBias=.03;scene.add(sun)
    const fillLight=new THREE.DirectionalLight(0xdceafa,1);fillLight.position.set(-6,3,-5);scene.add(fillLight)
    const canvas=renderer.domElement
    canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onCancel);canvas.addEventListener('pointerleave',onLeave)
    resize();rebuild();ready.value=true
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host.value!)
    themeObserver=new MutationObserver(applyTheme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']})
    intersection=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;lastTime=performance.now();invalidate()});intersection.observe(host.value!)
    document.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',onReduced)
    invalidate()
  }catch{error.value='3D недоступно в этом браузере. Чертежи и расчёты доступны во вкладках «Вид сверху» и «Полосы».'}
})
onBeforeUnmount(()=>{
  disposed=true;cancelAnimationFrame(frame);resizeObserver?.disconnect();themeObserver?.disconnect();intersection?.disconnect();document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onReduced)
  if(renderer){const canvas=renderer.domElement;canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onCancel);canvas.removeEventListener('pointerleave',onLeave)}
  controls?.dispose();disposeGroup();scene?.traverse(object=>{if(object instanceof THREE.DirectionalLight)object.shadow.dispose()});renderer?.dispose();renderer?.domElement.remove()
})
</script>
<template>
  <section class="overflow-hidden rounded-xl border border-line bg-canvas" aria-label="Интерактивная 3D решётки">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface p-2">
      <div class="flex flex-wrap gap-1" role="group" aria-label="Ракурс"><button v-for="item in views" :key="item.id" type="button" class="scene-button" :class="view===item.id?'bg-accent-soft text-accent':'text-muted'" :aria-pressed="view===item.id" :disabled="!ready||!!error" @click="setView(item.id)">{{ item.label }}</button></div>
      <div class="flex gap-1" role="group" aria-label="Камера">
        <button type="button" class="scene-button scene-icon" title="Отдалить" aria-label="Отдалить" :disabled="!ready||!!error" @click="zoom(1.2)"><MinusIcon /></button>
        <button type="button" class="scene-button scene-icon" title="Приблизить" aria-label="Приблизить" :disabled="!ready||!!error" @click="zoom(1/1.2)"><PlusIcon /></button>
        <button type="button" class="scene-button scene-icon" title="Вернуть весь объект в кадр" aria-label="Вернуть весь объект в кадр" :disabled="!ready||!!error" @click="setView('perspective')"><ArrowPathIcon /></button>
        <button type="button" class="scene-button scene-icon" :title="expanded?'Уменьшить сцену':'Увеличить сцену'" :aria-label="expanded?'Уменьшить сцену':'Увеличить сцену'" :aria-expanded="expanded" @click="expanded=!expanded"><ArrowsPointingInIcon v-if="expanded" /><ArrowsPointingOutIcon v-else /></button>
      </div>
    </div>
    <div class="relative" :class="expanded?'h-[650px]':'h-[420px] sm:h-[480px]'">
      <div ref="host" tabindex="0" class="h-full w-full outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-accent" aria-label="3D: стрелки выбирают ячейку, Enter добавляет продукт" aria-describedby="grid-scene-help" @keydown="onKey" />
      <p v-if="error" role="status" class="absolute inset-0 grid place-items-center bg-canvas p-6 text-center text-sm text-muted">{{ error }}</p>
      <div v-else class="pointer-events-none absolute left-3 top-3 rounded-md bg-surface px-3 py-2 text-xs text-muted"><span class="font-medium text-ink">{{ exploded?'Решётка разобрана':cellDescription }}</span><span v-if="!exploded" class="ml-2">{{ occupied.has(active)?'С продуктом':'Пустая' }}</span></div>
      <div v-if="!error" class="absolute right-3 bottom-3 flex gap-1 rounded-md bg-surface p-1">
        <button type="button" class="scene-button" :disabled="!ready" :aria-pressed="exploded" @click="exploded=!exploded">{{ exploded?'Собрать решётку':'Разобрать решётку' }}</button>
        <button type="button" class="scene-button scene-icon" :title="rotating?'Остановить вращение':'Вращать сцену'" :aria-label="rotating?'Остановить вращение':'Вращать сцену'" :aria-pressed="rotating" :disabled="!ready" @click="rotating=!rotating"><PauseIcon v-if="rotating" /><PlayIcon v-else /></button>
      </div>
    </div>
    <div class="space-y-3 border-t border-line bg-surface p-3 sm:p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-xs"><p class="font-medium tabular-nums">Заполнено {{ occupied.size }} из {{ count }} ячеек</p><p class="mt-1 text-muted">Продукт {{ fmt(length) }} × {{ fmt(width) }} × {{ fmt(height) }} мм</p></div>
        <div class="flex gap-2"><button type="button" class="scene-button bg-accent-soft text-accent" :disabled="!ready||!!error||exploded||occupied.size===count" @click="fill">Заполнить всё</button><button type="button" class="scene-button text-muted" :disabled="!occupied.size||!!error" @click="clear">Очистить</button></div>
      </div>
      <div v-if="!error" class="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs">
        <button type="button" class="scene-button scene-icon" aria-label="Предыдущая ячейка" :disabled="selected===0||exploded" @click="hovered=null;selected--"><ChevronLeftIcon /></button>
        <label class="flex items-center gap-2 text-muted">Ячейка<select v-model.number="selected" class="min-h-11 rounded-md border border-line bg-canvas px-2 text-ink" :disabled="exploded" @change="hovered=null"><option v-for="n in count" :key="n" :value="n-1">{{ Math.floor((n-1)/cols)+1 }} : {{ (n-1)%cols+1 }}</option></select></label>
        <button type="button" class="scene-button scene-icon" aria-label="Следующая ячейка" :disabled="selected===count-1||exploded" @click="hovered=null;selected++"><ChevronRightIcon /></button>
        <button type="button" class="scene-button text-accent" :disabled="!ready||exploded" @click="toggle(selected)">{{ occupied.has(selected)?'Убрать продукт':'Добавить продукт' }}</button>
      </div>
      <p id="grid-scene-help" class="text-[11px] leading-relaxed text-muted">Нажатие на ячейку — продукт. Перетаскивание — вращение; правая кнопка — перемещение; колесо — масштаб. На телефоне — вращение одним пальцем, масштаб и перемещение двумя.</p>
    </div>
  </section>
</template>
<style scoped>
.scene-button{display:inline-flex;min-height:44px;align-items:center;justify-content:center;gap:6px;padding:0 12px;border-radius:6px;font-size:12px;cursor:pointer;transition:background-color .15s,color .15s}
.scene-button:hover:not(:disabled){background:var(--accent-soft);color:var(--accent)}
.scene-button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.scene-button:disabled{opacity:.4;cursor:not-allowed}
.scene-icon{width:44px;padding:0}
.scene-icon svg{width:18px;height:18px}
</style>
