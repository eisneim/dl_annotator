import React, { PropTypes } from "react/dist/react"
import Dragable from "./ui/Dragable"

export default class Polygon extends React.Component {

  static defaultProps = {
    maxPoints: 4
  };

  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    maxPoints: PropTypes.number,
    node: PropTypes.object,
    onUpdate: PropTypes.func,
  };

  getOffset(ee, se) {
    return {
      offsetX: ee.clientX - se.clientX,
      offsetY: ee.clientY - se.clientY,
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

  $getHandle() {
    const {points} = this.props.node
    return points.map((p, idx) => {
      let styleObj = {
        top: p.y - 5,
        left: p.x - 5,
      }

      return (
        <Dragable key={p.id} noPoro
          className="dla__path_handle"
          style={styleObj}
          onMove={(ee, se) => this._dragMove(idx, ee, se)}
          onUp={(ee, se) => this._dragUp(idx, ee, se)}
          />
      )
    })
  }

  render() {
    const { width, height, maxPoints, node } = this.props
    let { points } = node
    let path = ""
    points.forEach((p, idx) => {
      path += idx === 0 ? "M" : "L"
      path += ` ${p.x} ${p.y} `
      if (idx === maxPoints - 1) path += "z"
    })

    return (
      <div className="dla__polygon">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
          <path strokeWidth="2" d={path}/>
        </svg>
        { this.$getHandle() }
      </div>
    )
  }
}
