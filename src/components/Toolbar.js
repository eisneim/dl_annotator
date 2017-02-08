import React from "react/dist/react"
import { IconButton } from "./Button"

export const TOOLS = [
  ["CROP", "crop", ""],
  ["SCALE", "filter_none", ""],
  ["RECT", "crop_square", "Reactangle"],
  ["POLYGON", "format_shapes", "Polygon"],
  ["CONTOUR", "timeline", "Contour"],
  ["PENTOOL", "create", "Path"],
]

export default class Toolbar extends React.Component {

  render() {
    let { onSelect, selected, disabled } = this.props
    return (
      <ul className="dla__ulblock dla__toolbar">
      {
        TOOLS.map(m => {
          let isActive = selected === m[0]
          return (
            <li className={isActive ? "dla__Active" : ""} key={m[0]}>
              <IconButton disabled={disabled && disabled.indexOf(m[0]) > -1}
                colored={isActive}
                onClick={() => onSelect(m[0])} name={m[1]}/>
            </li>
          )
        })
      }
      </ul>
    )
  }

}
