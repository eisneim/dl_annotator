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
        mainSecWidth: 0,
        mainSecHeight: 0,
        imgInfo: {
          src: "http://7xownv.com2.z0.glb.qiniucdn.com/photos_office_5.JPG?imageView2/2/w/1000",
          width: 0,
          height: 0,
          fullWidth: 0,
          fullHeight: 0,
        },
        selectedTool: "RECT",
        selectedNode: null,
        createdNode: [],
        disabledTools: ["CROP", "SCALE"],
      }
    }

    getMainSecbounding() {
      if (!this.$mainSec) return { width: 0, height: 0 }
      return this.$mainSec.getBoundingClientRect()
    }

    setImage() {
      let { imgInfo, mainSecWidth, mainSecHeight } = this.state
      // should firstly remove the old image in main section

      getImgFromSrc(imgInfo.src).then($img => {
        let newInfo = Object.assign({}, imgInfo)
        newInfo.fullWidth = $img.width
        newInfo.fullHeight = $img.height
        let imgRatio = $img.width / $img.height
        let avRatio = mainSecWidth / mainSecHeight
        // image is wider than wraper, landscape
        if (imgRatio > avRatio && $img.width > mainSecWidth) {
          newInfo.width = mainSecWidth
          newInfo.height = mainSecWidth / imgRatio
        } else if ($img.height > mainSecHeight && $img.height > mainSecHeight){
          // portrait
          newInfo.height = mainSecHeight
          newInfo.width = mainSecHeight * imgRatio
        } else {
          newInfo.width = $img.width
          newInfo.height = $img.height
        }
        log("newImgInfo", newInfo)
        this.setState({ imgInfo: newInfo })
      })
    }

    componentDidMount() {
      this.$dom = findDOMNode(this)
      this.$mainSec = findDOMNode(this.refs.mianSec)
      let { width, height } = this.getMainSecbounding()
      log("getMainSecbounding: ", width, height)
      // set state withou rerender
      this.state.mainSecWidth = width
      this.state.mainSecHeight = height
      if (this.state.imgInfo.src) this.setImage()
    }

    _dragMove = (ee, se) => {
      if (!this.dragStart) {
        log("drag start")
        this.dragStart = {}
      }
    }

    _dragUp = (ee, se) => {
      log("drag up")
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

    render() {
      const { imgInfo, disabledTools, selectedTool } = this.state

      const wraperStyle = {
        width: imgInfo.width,
        height: imgInfo.height,
      }

      return (
        <div className="dla__wraper" onClick={this._onOverlayClick}>
          <main ref="mianSec" className="dla__modal" data-layout="row">
            <section className="dla__main" data-flex>
              <Dragable cascade className="dla_imgWraper" style={wraperStyle}
                onMove={this._dragMove} onUp={this._dragUp}>
              { imgInfo.src && imgInfo.width ?
                <img src={imgInfo.src}/>
                : null
              }
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
