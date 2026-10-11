import { ExtrudeGeometry, Shape } from 'three'
import type { GridStrip } from './grid'

/** Use the production outline so the preview has the same open slots as the drawing. */
export function gridStripMeshGeometry(strip: GridStrip, thickness: number, scale: number) {
  const shape = new Shape()
  strip.points.forEach(([x, y], index) => {
    const px = (x! - strip.length / 2) * scale
    const py = (strip.height - y!) * scale
    if (index === 0) shape.moveTo(px, py)
    else shape.lineTo(px, py)
  })
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, { depth: thickness * scale, bevelEnabled: false, curveSegments: 1 })
  geometry.translate(0, 0, -thickness * scale / 2)
  return geometry
}
