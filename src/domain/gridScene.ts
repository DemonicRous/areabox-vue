import { ExtrudeGeometry, Shape, Spherical, Vector3, MathUtils } from 'three'
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

export function gridCameraTransition(from: Vector3, to: Vector3, targetFrom: Vector3, targetTo: Vector3) {
  const start = new Spherical().setFromVector3(from.clone().sub(targetFrom))
  const end = new Spherical().setFromVector3(to.clone().sub(targetTo))
  // Keep azimuth continuous and take the shortest path across the ±π boundary.
  end.theta = start.theta + Math.atan2(Math.sin(end.theta - start.theta), Math.cos(end.theta - start.theta))
  return { start, end, targetFrom: targetFrom.clone(), targetTo: targetTo.clone() }
}

export function gridCameraPose(transition: ReturnType<typeof gridCameraTransition>, progress: number) {
  const p = MathUtils.clamp(progress, 0, 1)
  const ease = p * p * p * (p * (p * 6 - 15) + 10)
  const target = transition.targetFrom.clone().lerp(transition.targetTo, ease)
  const orbit = new Spherical(
    MathUtils.lerp(transition.start.radius, transition.end.radius, ease),
    MathUtils.lerp(transition.start.phi, transition.end.phi, ease),
    MathUtils.lerp(transition.start.theta, transition.end.theta, ease),
  ).makeSafe()
  return { position: new Vector3().setFromSpherical(orbit).add(target), target }
}
