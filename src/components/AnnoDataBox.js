import React from "react/dist/react"
import { IconButton } from "./Button"

export default ({ title, data, onRemove}) => {
  let content = typeof data === "string" ? data : JSON.stringify(data.points)
  // console.log("__render annobox", data.points.length)
  return (
    <div className="dla__adBox">
      <h4>{title}</h4>
      <div data-layout="row">
        <textarea rows="1" data-flex defaultValue={content}></textarea>
        <IconButton onClick={() => onRemove(data.id)} name="delete" />
      </div>
    </div>
  )
}
