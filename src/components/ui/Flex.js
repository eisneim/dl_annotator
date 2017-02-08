import React from "react/dist/react"

export function FlexSpan() {
  return <span style={{ flex: 1 }}></span>
}

export function FlexRow({ tagType, className, style, children }) {
  const newStyle = Object.assign({}, (style || {}), {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    overflow: 'hidden',
  })
  return React.createElement(tagType || 'div', {
    className,
    style: newStyle,
  }, children)
}

export function FlexCol({ tagType, className, style, children }) {
  const newStyle = Object.assign({}, (style || {}), {
    display: 'flex',
    flexDirection: 'column',
  })
  return React.createElement(tagType || 'div', {
    className,
    style: newStyle,
  }, children)
}
