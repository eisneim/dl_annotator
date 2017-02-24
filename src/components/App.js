import React from "react/dist/react"
import { findDOMNode } from "react-dom/dist/react-dom"
import Toolbar, { TOOLS } from './Toolbar'
import Button, { Icon, IconButton } from "./Button"
import AnnoDataBox from "./AnnoDataBox"
import RectBox from "./RectBox"
import Polygon from "./Polygon"
import Dragable from "./ui/Dragable"

import { dotPrecision } from "../utils/util.math.js"
import { getImgFromSrc } from '../utils/util.image.js'

const log = require("../utils/util.log.js")("App")

export default function createApp(annotator, imgSrc, config) {
  return class App extends React.Component {

    constructor() {
      super()
      this.state = {
        msWidth: 0,
        msHeight: 0,
        imgInfo: {
          // src: "http://7xownv.com2.z0.glb.qiniucdn.com/photos_office_5.JPG?imageView2/2/w/1000",
          src: imgSrc,
          width: 0, height: 0,
          fullWidth: 0, fullHeight: 0,
          screenX: 0, screenY: 0,
        },
        selectedTool: "RECT",
        selectedNode: null,
        createdNodes: [],
        disabledTools: ["CROP", "SCALE", "CONTOUR", "PENTOOL"],
      }
      // default value, it will change when window resize
      this.zoomRatio = 1
    }

    getMainSecbounding() {
      if (!this.$mainSec) return { width: 0, height: 0 }
      return this.$mainSec.getBoundingClientRect()
    }

    calcImgWidth(fullWidth, fullHeight, msWidth, msHeight, msTop, msLeft) {
      let imgRatio = fullWidth / fullHeight
      let avRatio = msWidth / msHeight
      let width, height, screenX, screenY
      // image is wider than wraper, landscape
      if (imgRatio > avRatio && fullWidth > msWidth) {
        width = msWidth
        height = msWidth / imgRatio
      } else if (imgRatio < avRatio && fullHeight > msHeight){
        // portrait
        height = msHeight
        width = msHeight * imgRatio
      } else {
        width = fullWidth
        height = fullHeight
      }
      screenX = msLeft + (msWidth - width) / 2
      screenY = msTop + (msHeight - height) / 2
      this.zoomRatio = fullWidth / width
      return { width, height, screenY, screenX, fullWidth, fullHeight}
    }

    setImage() {
      let {
        imgInfo, msWidth, msHeight, msTop, msLeft,
      } = this.state
      // should firstly remove the old image in main section

      getImgFromSrc(imgInfo.src).then($img => {
        let calced = this.calcImgWidth($img.width, $img.height, msWidth, msHeight, msTop, msLeft)
        calced.src = imgInfo.src
        log("setImage newImgInfo", this.state, calced)
        this.setState({ imgInfo: calced })
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
      window.addEventListener("resize", this._updateDimention)

      annotator.commands["SAVE"] = this._onSave
      annotator.commands["SET_RECT"] = () => this._onSelectTool("RECT")
      annotator.commands["SET_POLYGON"] = () => this._onSelectTool("POLYGON")
    }

    componentWillUnmount() {
      window.removeEventListener("resize", this._updateDimention)
    }

    _updateDimention = () => {
      let { imgInfo } = this.state
      let { width, height, top, left } = this.getMainSecbounding()
      let calced = this.calcImgWidth(imgInfo.fullWidth, imgInfo.fullHeight, width, height, top, left)
      calced.src = imgInfo.src
      // log("newImgInfo:", calced)
      this.setState({
        msWidth: width,
        msHeight: height,
        msTop: top,
        msLeft: left,
        imgInfo: calced
      })
    }
    // this coord is based on image full width and height!
    screenCoordToImgCoord(xx, yy) {
      let { imgInfo } = this.state
      let ratio = imgInfo.fullWidth / imgInfo.width
      let x = (xx - imgInfo.screenX) * ratio
      let y = (yy - imgInfo.screenY) * ratio

      return { x: dotPrecision(x, 2), y: dotPrecision(y, 2) }
    }

    getOffset(ee, se) {
      return {
        offsetX: (ee.clientX - se.clientX) * this.zoomRatio,
        offsetY: (ee.clientY - se.clientY) * this.zoomRatio,
      }
    }

    polygonPoint(ee) {
      let { selectedTool, createdNodes } = this.state
      if (!this.polygonStart) {
        let p = this.screenCoordToImgCoord(ee.clientX, ee.clientY)
        let nodeId = annotator.id()
        p.id = annotator.id()
        let newNode = {
          id: nodeId, type: selectedTool, points: [p],
          "class": config.classes[config.defaultClass],
        }
        this.polygonStart = {
          idx: 0, nodeId,
        }
        let ns = createdNodes.slice()
        ns.push(newNode)
        this.setState({ createdNodes: ns })
        return false
      }
      if (this.polygonStart.idx >= 3) {
        this.polygonStart = null
        // create new node
        return this.polygonPoint(ee)
      }

      let newCoord = this.screenCoordToImgCoord(ee.clientX, ee.clientY)
      newCoord.id = annotator.id()
      let node = createdNodes.find(n => n.id === this.polygonStart.nodeId)
      node.points.push(newCoord)
      log("polygon new point:", node)
      // increate idex
      this.polygonStart.idx += 1
      this.setState({ createdNodes: createdNodes.slice() })
      // stop dragable behaviour
      return false
    }

    _onWraperMouseDown = (ee) => {
      let { selectedTool } = this.state
      if (selectedTool === "POLYGON") {
        return this.polygonPoint(ee)
      }
      return true
    }

    _dragMove = (ee, se) => {
      let { selectedTool, createdNodes, selectedNode } = this.state
      if (!this.dragStart) {
        let start = this.screenCoordToImgCoord(ee.clientX, ee.clientY)
        start.id = annotator.id()
        let newNode = {
          id: annotator.id(), type: selectedTool, points: [ start ],
          "class": config.classes[config.defaultClass],
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

    _removeNode = id => {
      let createdNodes = this.state.createdNodes.slice()
      let idx = createdNodes.findIndex(n => n.id === id)
      createdNodes.splice(idx, 1)
      this.setState({ createdNodes: createdNodes })
    }
    _updateRect = (id, idx, coord) => {
      let nodes = this.state.createdNodes.slice()
      let node = nodes.find(n => n.id === id)
      coord.id = node.points[idx].id
      node.points[idx] = coord
      this.setState({ createdNodes: nodes })
    }
    _updatePolygon = (id, idx, coord) => {
      let nodes = this.state.createdNodes.slice()
      let node = nodes.find(n => n.id === id)
      coord.id = node.points[idx].id
      node.points[idx] = coord
      this.setState({ createdNodes: nodes })
    }
    _updateNodeClass = (e, node) => {
      let nodes = this.state.createdNodes.slice()
      let idx = nodes.findIndex(n => n.id === node.id)
      node.class = e.target.value
      nodes[idx] = node
      log("update nodeClass:", node.class, node)
      this.setState({ createdNodes: nodes })
    }

    _onSave = () => {
      let { imgInfo, createdNodes } = this.state
      annotator.saveFile(imgInfo, createdNodes)
    }

    _onUpload = (i) => {
      let { imgInfo, createdNodes } = this.state
      annotator.upload(imgInfo, createdNodes)
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
      const { createdNodes, msWidth, msHeight } = this.state
      return createdNodes.map(node => {
        if (node.type === "RECT") {
          return <RectBox key={node.id}
            node={node} onUpdate={this._updateRect}
            ratio={this.zoomRatio}/>
        } else if (node.type === "POLYGON") {
          return <Polygon key={node.id} node={node}
            width={msWidth} height={msHeight}
            onUpdate={this._updatePolygon}
            ratio={this.zoomRatio}/>
        } else {
          // @TODO: add other node
          return null
        }
      })
    }

    $getClassList(node) {
      return (
        <select value={node.class} onChange={e => this._updateNodeClass(e, node)}>
        {
          config.classes.map((cc, idx) => <option key={idx} value={cc}>{cc}</option>)
        }
        </select>
      )
    }

    $getAnnoData() {
      const { createdNodes } = this.state
      return createdNodes.map(node => {
        let tool = TOOLS.find(t => t[0] == node.type)
        return (
          <span key={node.id}>
            <AnnoDataBox title={tool[2] + node.id} data={node} onRemove={this._removeNode}/>
            { this.$getClassList(node) }
          </span>
        )
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
              <Dragable cascade className="dla_imgWraper"
                style={wraperStyle} onDown={this._onWraperMouseDown}
                onMove={this._dragMove} onUp={this._dragUp}>
              { imgInfo.src && imgInfo.width ?
                <img ref="mainImg" src={imgInfo.src}/>
                : null
              }
              { this.$createdNodes() }
              </Dragable>
            </section>
            <section className="dla__options">
              <Toolbar onSelect={this._onSelectTool} disabled={disabledTools} selected={selectedTool}/>
              <p style={{fontSize:12}}>{imgInfo.fullWidth}x{imgInfo.fullHeight} ==> {imgInfo.width.toFixed(2)}x{imgInfo.height.toFixed(2)}</p>
              { this.$getAnnoData() }
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
