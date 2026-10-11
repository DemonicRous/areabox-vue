<script setup lang="ts">
import { SunIcon, MoonIcon, CubeIcon, ServerStackIcon, Square3Stack3DIcon, Squares2X2Icon, ArrowPathIcon, DocumentIcon } from '@heroicons/vue/24/outline'
defineProps<{ name: 'sun' | 'moon' | 'box' | 'equipment' | 'material' | 'drawing' | 'layout' | 'route' }>()
const icons = { sun: SunIcon, moon: MoonIcon, box: CubeIcon, equipment: ServerStackIcon, material: DocumentIcon, drawing: Square3Stack3DIcon, layout: Squares2X2Icon, route: ArrowPathIcon }
</script>
<template><component :is="icons[name]" aria-hidden="true" class="size-5 shrink-0" /></template>
