import React from "react/dist/react"
import { IconButton } from "./Button"

const TOOLS = [
  ["CROP", "crop"],
  ["SCALE", "filter_none"],
  ["RECT", "crop_square"],
  ["POLYGON", "format_shapes"],
  ["CONTOUR", "timeline"],
  ["PENTOOL", "create"],
]

export default class Toolbar extends React.Component {

  render() {
    let { onToolClick, activeTool } = this.props
    return (
      <ul className="dla__ulblock dla__toolbar">
      {
        TOOLS.map(m => (
          <li className={activeTool === m[1] ? "dla__Active" : ""} key={m[0]}>
            <IconButton onClick={() => onToolClick(m[0])} name={m[1]}/>
          </li>
        ))
      }
      </ul>
    )
  }

}
