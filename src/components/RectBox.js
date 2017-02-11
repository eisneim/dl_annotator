import React from "react/dist/react"
import Dragable from "./ui/Dragable"

const log = require("../utils/util.log.js")("RectBox")

export default class RectBox extends React.Component {

  getOffset(ee, se) {
    return {
      offsetX: (ee.clientX - se.clientX) * this.props.ratio,
      offsetY: (ee.clientY - se.clientY) * this.props.ratio,
    }
  }

  _dragMove(idx, ee, se) {
    let { node, onUpdate } = this.props
    if (!this.dragStart) {
      this.dragStart = {
        idx, p: node.points[idx]
      }
    }

    let { offsetX, offsetY } = this.getOffset(ee, se)
    let newPoint = {
      x: this.dragStart.p.x + offsetX,
      y: this.dragStart.p.y + offsetY,
    }
    onUpdate(node.id, idx, newPoint)
  }

  _dragUp(idx, ee, se) {
    this.dragStart = null
  }

  render() {
    let { node, ratio } = this.props
    let p = node.points
    let width = Math.abs(p[0].x - p[1].x) / ratio
    let height = Math.abs(p[0].y - p[1].y) / ratio
    let left = Math.min(p[0].x, p[1].x) / ratio,
      top = Math.min(p[0].y, p[1].y) / ratio

    return (
      <div key={node.id} className="dla__anno_rect" style={{width, height, top, left}}>
        <span>{node.id}</span>
        <Dragable key={0} noPoro className="dla__rect_handle dla__handle_0"
          onMove={(ee, se) => this._dragMove(0, ee, se)}
          onUp={(ee, se) => this._dragUp(0, ee, se)}
          />
        <Dragable key={1} noPoro className="dla__rect_handle dla__handle_1"
          onMove={(ee, se) => this._dragMove(1, ee, se)}
          onUp={(ee, se) => this._dragUp(1, ee, se)}
          />
      </div>
    )
  }
}
