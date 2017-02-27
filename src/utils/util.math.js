export function dotPrecision(num, factor) {
  let base = Math.pow(10, factor)
  return Math.round(num * base) / base
}

export function isInPolygon(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  // https://github.com/substack/point-in-polygon/blob/master/index.js
  var x = point[0], y = point[1]
  var inside = false
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0],
      yi = vs[i][1]
    var xj = vs[j][0],
      yj = vs[j][1]

    var intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export function isInPolygonObj(point, points) {
  return isInPolygon([point.x, point.y], points.map(p => [p.x, p.y]))
}