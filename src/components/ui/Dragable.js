import React, { PropTypes } from 'react/dist/react'
import { findDOMNode } from "react-dom/dist/react-dom"

class Draxtends React.Component {static defaultProps = {
  element: 'div',
  cascade: false,
  handle: 'cy_dg_handle',
}

  componentDidMount() {
    this.$dom = findDOMNode(this)
  }

  isDragable($target) {
    const { cascade } = this.props
    if (cascade) return true

    const isClickContainer = $target === this.$dom
    const isClickHandle = $target.className.indexOf(this.props.handle) > -1
    if (isClickHandle || isClickContainer)
      return true
    return false
  }

  _mouseDown = e => {
    // ignore right click && middle click
    // -1: No button pressed
    // 0: Main button pressed, usually the left button
    // 1: Auxiliary button pressed, usually the wheel button or themiddle button (if present)
    // 2: Secondary button pressed, usually the right button
    // 3: Fourth button, typically the Browser Back button
    // 4: Fifth button, typically the Browser Forward button
    if (e.button !== 0) return

    if (!this.isDragable(e.target)) return

    document.addEventListener('mousemove', this._mouseMove)
    document.addEventListener('mouseup', this._mouseUp)
    this.startEvent = e.nativeEvent
    if (typeof this.props.onDown === 'function')
      this.props.onDown(e)
  }

  _mouseMove = e => {
    if (typeof this.props.onMove === 'function')
      this.props.onMove(e, this.startEvent)
  }

  _mouseUp = e => {
    document.removeEventListener('mousemove', this._mouseMove)
    document.removeEventListener('mouseup', this._mouseUp)
    if (typeof this.props.onUp === 'function')
      this.props.onUp(e, this.startEvent)
  }

  render() {
    return React.createElement(this.props.element, Object.assign({}, {
      onMouseDown: this._mouseDown,
      className: this.props.className,
      style: this.props.style,
    }), this.props.children)
  }

}

Dragable.propTypes = {
  element: PropTypes.string,
  cascade: PropTypes.bool,
  handle: PropTypes.string,
  onMove: PropTypes.func,
  onDown: PropTypes.func,
  onUp: PropTypes.func,
}

Dragable.defaultProps = {
  element: 'div',
  cascade: false,
  handle: 'cy_dg_handle',
}

export default Dragable
