import React, { PropTypes } from 'react/dist/react'
import { findDOMNode } from "react-dom/dist/react-dom"

class Dragable extends React.Component {

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
    let { noPoro, onDown } = this.props
    // ignore right click && middle click
    // -1: No button pressed
    // 0: Main button pressed, usually the left button
    // 1: Auxiliary button pressed, usually the wheel button or themiddle button (if present)
    // 2: Secondary button pressed, usually the right button
    // 3: Fourth button, typically the Browser Back button
    // 4: Fifth button, typically the Browser Forward button
    if (e.button !== 0) return

    if (!this.isDragable(e.target)) return
    let shouldContinue = true

    if (noPoro)
      e.stopPropagation()

    if (typeof onDown === 'function')
      shouldContinue = onDown(e)
    if (!shouldContinue) return

    document.addEventListener('mousemove', this._mouseMove)
    document.addEventListener('mouseup', this._mouseUp)
    this.startEvent = e.nativeEvent
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
      onClick: this.props.onClick,
      onMouseDown: this._mouseDown,
      className: this.props.className,
      style: this.props.style,
    }), this.props.children)
  }

}

Dragable.propTypes = {
  element: PropTypes.string,
  cascade: PropTypes.bool,
  noPoro: PropTypes.bool,
  handle: PropTypes.string,
  onMove: PropTypes.func,
  onDown: PropTypes.func,
  onUp: PropTypes.func,
}

Dragable.defaultProps = {
  element: 'div',
  cascade: false,
  noPoro: false,
  handle: 'dla_dg_handle',
}

export default Dragable
