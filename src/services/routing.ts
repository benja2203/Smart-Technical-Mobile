export type Point = { id: number; lat: number; lon: number; label?: string }
const R = 6371e3
function hav(p1: Point, p2: Point) {
  const φ1 = p1.lat * Math.PI/180, φ2 = p2.lat * Math.PI/180
  const Δφ = (p2.lat - p1.lat) * Math.PI/180
  const Δλ = (p2.lon - p1.lon) * Math.PI/180
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
  return 2 * R * Math.asin(Math.sqrt(a))
}
export function nearestNeighbor(points: Point[], start?: Point): Point[] {
  if (points.length <= 1) return points.slice()
  const remaining = points.slice()
  const route: Point[] = []
  let current = start ?? remaining.shift()!
  if (!start) route.push(current)
  while (remaining.length) {
    let bestIdx = 0, bestD = Infinity
    for (let i=0;i<remaining.length;i++) {
      const d = hav(current, remaining[i])
      if (d < bestD) { bestD = d; bestIdx = i }
    }
    current = remaining.splice(bestIdx,1)[0]
    route.push(current)
  }
  return route
}
export function googleMapsUrl(points: Point[]) {
  if (!points.length) return ''
  const origin = `${points[0].lat},${points[0].lon}`
  const destination = `${points[points.length-1].lat},${points[points.length-1].lon}`
  const waypoints = points.slice(1,-1).map(p => `${p.lat},${p.lon}`).join('|')
  const base = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
  return waypoints ? `${base}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving` : `${base}&travelmode=driving`
}
