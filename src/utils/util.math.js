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
  // 2 points rect to 4 points rect, i know the 2 point are topleft and bottom right
  if (points.length === 2) {
    points.push({ y: points[0].y, x: points[1].x })
    points.push({ x: points[0].x, y: points[1].y })
    // re-arrange order: tl - tr - br - bl
    let fourth = points.splice(1, 1)[0]
    points.splice(2, 0, fourth)
  }

  return isInPolygon([point.x, point.y], points.map(p => [p.x, p.y]))
}