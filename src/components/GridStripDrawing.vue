<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GridStrip } from '../domain/grid'
const props=defineProps<{strip:GridStrip;slot:number;depth:number;overcut:boolean}>()
const selected=ref(0)
watch(()=>props.strip,()=>{selected.value=0})
const scale=computed(()=>Math.min(740/props.strip.length,280/props.strip.height))
const w=computed(()=>props.strip.length*scale.value)
const h=computed(()=>props.strip.height*scale.value)
const center=computed(()=>props.strip.slots[selected.value])
const root=computed(()=>props.strip.fromTop ? props.depth*scale.value : h.value-props.depth*scale.value)
const edge=computed(()=>props.strip.fromTop ? 0 : h.value)
const segments=computed(()=>{
  const stops=[0,...props.strip.slots,props.strip.length]
  return stops.slice(1).map((end,i)=>({start:stops[i]!,end,value:end-stops[i]!}))
})
const fmt=(value:number)=>value.toLocaleString('ru-RU',{maximumFractionDigits:2})
</script>
<template>
  <div class="rounded-xl border border-line bg-canvas">
    <div class="overflow-x-auto p-3 sm:p-4">
      <svg class="block min-w-[620px] w-full" :viewBox="`-35 -100 ${w+155} ${h+140}`" role="img" :aria-label="`${strip.name}: длина ${fmt(strip.length)}, высота ${fmt(strip.height)}, просечка ${slot} на ${fmt(depth)} мм`">
        <g fill="none" stroke="var(--muted)" stroke-width="1">
          <path :d="`M0,-16 V-72 H${w} V-16`" />
          <path :d="`M-3,-66 l6,-12 M${w-3},-66 l6,-12`" />
          <path :d="`M${w+12},0 H${w+88} V${h} H${w+12} M${w+84},-3 l8,6 M${w+84},${h-3} l8,6`" />
        </g>
        <g fill="var(--ink)" font-size="14" font-weight="500" text-anchor="middle">
          <text :x="w/2" y="-82">{{ fmt(strip.length) }}</text>
          <text :transform="`translate(${w+109},${h/2}) rotate(90)`">{{ fmt(strip.height) }}</text>
        </g>
        <g v-if="strip.slots.length<=8" fill="none" stroke="var(--muted)" stroke-width="1">
          <template v-for="segment in segments" :key="segment.start">
            <path :d="`M${segment.start*scale},-4 V-34 H${segment.end*scale} V-4 M${segment.start*scale-3},-29 l6,-10 M${segment.end*scale-3},-29 l6,-10`" />
            <text :x="(segment.start+segment.end)*scale/2" y="-43" fill="var(--muted)" stroke="none" font-size="12" text-anchor="middle">{{ fmt(segment.value) }}</text>
          </template>
        </g>
        <polygon :points="strip.points.map(([x,y])=>`${x!*scale},${y!*scale}`).join(' ')" fill="var(--accent-soft)" stroke="var(--ink)" stroke-width="1.3" />
        <g v-for="(position,index) in strip.slots" :key="position">
          <line :x1="position*scale" :x2="position*scale" :y1="edge" :y2="root" stroke="var(--muted)" stroke-width=".7" stroke-dasharray="4 4" />
          <line v-if="overcut" :x1="position*scale" :x2="position*scale" :y1="root" :y2="root+(strip.fromTop?7:-7)*scale" stroke="var(--ink)" />
          <rect :x="position*scale-12" :y="Math.min(root,edge)" width="24" :height="depth*scale" fill="transparent" class="cursor-pointer" role="button" tabindex="0" :aria-label="`Просечка ${index+1}, центр ${fmt(position)} мм от края`" :aria-pressed="selected===index" @click="selected=index" @keydown.enter.prevent="selected=index" @keydown.space.prevent="selected=index" />
        </g>
        <g v-if="center!==undefined" stroke="var(--accent)" fill="none" stroke-width="1">
          <path :d="`M${center*scale},${root} H${w+40} M${w+34},${edge} H${w+46} M${w+40},${edge} V${root} M${w+34},${root} H${w+46}`" />
          <text :transform="`translate(${w+57},${(edge+root)/2}) rotate(90)`" fill="var(--accent)" stroke="none" font-size="12" text-anchor="middle">{{ fmt(depth) }}</text>
        </g>
      </svg>
    </div>
    <div class="flex flex-col gap-4 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-2 text-xs">
        <p class="font-medium">Все размеры в миллиметрах</p>
        <p class="text-muted">Размерная цепочка — от края до центров просечек.</p>
        <template v-if="center!==undefined">
          <label class="flex items-center gap-2 text-muted">Просечка<select v-model.number="selected" class="rounded-md border border-line bg-surface px-2 py-1 text-ink"><option v-for="(position,index) in strip.slots" :key="position" :value="index">{{ index+1 }} · центр {{ fmt(position) }} мм</option></select></label>
          <p class="text-muted">Глубина <strong class="font-medium text-ink">{{ fmt(depth) }} мм</strong><span v-if="overcut"> · дорез RODA 7 мм</span></p>
        </template>
      </div>
      <svg v-if="center!==undefined" class="h-36 w-52 shrink-0" viewBox="0 0 210 145" role="img" :aria-label="`Увеличенная просечка шириной ${slot} мм`">
        <path d="M20,47 H85 V114 H125 V47 H190" fill="none" stroke="var(--ink)" stroke-width="1.5" />
        <path d="M20,47 l7,-4 l7,8 l7,-8 l7,4 M162,47 l7,-4 l7,8 l7,-8 l7,4" fill="none" stroke="var(--muted)" />
        <path d="M85,39 V23 H125 V39 M82,28 l6,-10 M122,28 l6,-10" fill="none" stroke="var(--muted)" />
        <text x="105" y="15" text-anchor="middle" fill="var(--ink)" font-size="13">{{ slot }} мм</text>
        <text x="105" y="139" text-anchor="middle" fill="var(--muted)" font-size="11">Просечка · увеличенный фрагмент</text>
      </svg>
    </div>
  </div>
</template>
