import React from "react/dist/react"
import { findDOMNode } from "react-dom/dist/react-dom"
import Toolbar, { TOOLS } from './Toolbar'
import Button, { Icon, IconButton } from "./Button"
import AnnoDataBox from "./AnnoDataBox"
import Dragable from "./ui/Dragable"

import { getImgFromSrc } from '../utils/util.image.js'

const log = require("../utils/util.log.js")("App")

export default function createApp(annotator) {
  return class App extends React.Component {

    constructor() {
      super()
      this.state = {
        msWidth: 0,
        msHeight: 0,
        imgInfo: {
          src: "http://7xownv.com2.z0.glb.qiniucdn.com/photos_office_5.JPG?imageView2/2/w/1000",
          width: 0, height: 0,
          fullWidth: 0, fullHeight: 0,
          screenX: 0, screenY: 0,
        },
        selectedTool: "RECT",
        selectedNode: null,
        createdNodes: [],
        disabledTools: ["CROP", "SCALE"],
      }
    }

    getMainSecbounding() {
      if (!this.$mainSec) return { width: 0, height: 0 }
      return this.$mainSec.getBoundingClientRect()
    }

    setImage() {
      let {
        imgInfo, msWidth, msHeight, msTop, msLeft,
      } = this.state
      // should firstly remove the old image in main section

      getImgFromSrc(imgInfo.src).then($img => {
        let newInfo = Object.assign({}, imgInfo)
        newInfo.fullWidth = $img.width
        newInfo.fullHeight = $img.height
        let imgRatio = $img.width / $img.height
        let avRatio = msWidth / msHeight
        // image is wider than wraper, landscape
        if (imgRatio > avRatio && $img.width > msWidth) {
          newInfo.width = msWidth
          newInfo.height = msWidth / imgRatio
        } else if ($img.height > msHeight && $img.height > msHeight){
          // portrait
          newInfo.height = msHeight
          newInfo.width = msHeight * imgRatio
        } else {
          newInfo.width = $img.width
          newInfo.height = $img.height
        }
        newInfo.screenX = msLeft + (msWidth - newInfo.width) / 2
        newInfo.screenY = msTop + (msHeight - newInfo.height) / 2

        log("newImgInfo", this.state, newInfo)
        this.setState({ imgInfo: newInfo })
      })
    }

    componentDidMount() {
      this.$dom = findDOMNode(this)
      this.$mainSec = findDOMNode(this.refs.mianSec)
      let { width, height, top, left } = this.getMainSecbounding()
      log("getMainSecbounding: ", width, height)
      // set state withou rerender
      this.state.msWidth = width
      this.state.msHeight = height
      this.state.msTop = top
      this.state.msLeft = left
      if (this.state.imgInfo.src) this.setImage()
    }

    screenCoordToImgCoord(xx, yy) {
      let x = xx - this.state.imgInfo.screenX
      let y = yy - this.state.imgInfo.screenY
      return { x, y }
    }

    getOffset(ee, se) {
      return {
        offsetX: ee.clientX - se.clientX,
        offsetY: ee.clientY - se.clientY,
      }
    }

    _dragMove = (ee, se) => {
      let { selectedTool, createdNodes, selectedNode } = this.state
      if (!this.dragStart) {
        let start = this.screenCoordToImgCoord(ee.clientX, ee.clientY)
        start.id = annotator.id()
        let newNode = {
          id: annotator.id(), type: selectedTool, points: [ start ],
        }
        if (selectedTool === "RECT")
          newNode.points.push(Object.assign({}, start, { id: annotator.id() }))

        this.dragStart = {
          imgX: start.x, imgY: start.y,
        }
        let ns = createdNodes.slice()
        ns.push(newNode)
        this.setState({
          createdNodes: ns, selectedNode: newNode.id,
        })
        log("drag start", ee.clientX, ee.clientY, start, newNode)
        return
      }

      let { offsetX, offsetY } = this.getOffset(ee, se)
      let x = this.dragStart.imgX + offsetX
      let y = this.dragStart.imgY + offsetY
      let targetNode = createdNodes.find(n => n.id === selectedNode)
      if (selectedTool === "RECT") {
        targetNode.points[1].x = x
        targetNode.points[1].y = y
      }
      // bad pattern, should use react.addon.update
      this.setState({
        createdNodes: createdNodes.slice()
      })
    }

    _dragUp = (ee, se) => {
      log("drag up", this.state.createdNodes)
      this.dragStart = null
    }

    _onSave = () => {
      log("_onSave")
    }

    _onUpload = () => {
      log("_onUpload!")
    }

    _wraperClick = () => {
      log("wraper clicked!")
    }

    _onSelectTool = tool => {
      this.setState({selectedTool: tool})
    }
    _onOverlayClick = e => {
      if (e.nativeEvent.target == this.$dom)
        annotator.destroy()
    }

    $createdNodes() {
      const { createdNodes } = this.state
      return createdNodes.map(node => {
        if (node.type === "RECT") {
          let p = node.points
          let width = Math.abs(p[0].x - p[1].x)
          let height = Math.abs(p[0].y - p[1].y)
          let left = Math.min(p[0].x, p[1].x), top = Math.min(p[0].y, p[1].y)
          return (
            <div className="dla__anno_rect" style={{width, height, top, left}}/>
          )
        } else {
          // @TODO: add other node
          return null
        }
      })
    }

    render() {
      const { imgInfo, disabledTools, selectedTool } = this.state

      const wraperStyle = {
        width: imgInfo.width,
        height: imgInfo.height,
      }

      return (
        <div className="dla__wraper" onClick={this._onOverlayClick}>
          <main className="dla__modal" data-layout="row">
            <section ref="mianSec" className="dla__main" data-flex>
              <Dragable cascade className="dla_imgWraper" style={wraperStyle}
                onMove={this._dragMove} onUp={this._dragUp}>
              { imgInfo.src && imgInfo.width ?
                <img src={imgInfo.src}/>
                : null
              }
              { this.$createdNodes() }
              </Dragable>
            </section>
            <section className="dla__options">
              <Toolbar onSelect={this._onSelectTool} disabled={disabledTools} selected={selectedTool}/>
              <AnnoDataBox title="Reactangles" data={{content: "34, 88, 203, 20"}}/>
              <div className="dla__option--actions" data-layout="row">
                <span data-flex/>
                <Button onClick={this._onUpload} size="md" raised>Upload</Button>
                <Button onClick={this._onSave} size="md" raised colored>Local Save</Button>
              </div>
            </section>
          </main>
          <IconButton name="close" size="lg" className="dla__exit"
            onClick={() => annotator.destroy()}/>
        </div>
      )
    }

  }
}
