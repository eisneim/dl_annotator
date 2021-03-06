
import React from "react/dist/react"
import ReactDOM from "react-dom/dist/react-dom"
import createApp from './components/App'
import { isInPolygonObj } from './utils/util.math.js'
import { remoteToBlob } from "./utils/util.image.js"

import path from "path"
const log = require("./utils/util.log.js")("Index")
log('chrome', chrome)
function addFontFace() {
  var styleTag = document.createElement('style')
      styleTag.type = 'text/css'

  let baseUrl = window.chrome.runtime.getURL("fonts/")
  let url = `
@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: url("${ baseUrl }MaterialIcons-Regular.eot"); /* For IE6-8 */
  src: local('Material Icons');
  src: local('MaterialIcons-Regular');
  src: url("${ baseUrl }MaterialIcons-Regular.woff2") format('woff2');
  src: url("${ baseUrl }MaterialIcons-Regular.woff") format('woff');
  src: url("${ baseUrl }MaterialIcons-Regular.ttf") format('truetype');
}
`
  styleTag.textContent = url
  document.head.appendChild(styleTag)
}
// delimiter
const NODE_DEL = "__"
const POINT_DEL = "--"
const NODETYPES = {
  RECT: 0,
  POLYGON: 1,
  CONTOUR: 2,
  PENTOOL: 3,
}
const CONF_KEYS = ["localSaveMethod", "classes", "defaultClass", "server", "idCount"]

class DLAnnotator {
  constructor() {
    this.$wraper = document.createElement("div")
    this.$wraper.classname = "_dla_"
    document.body.appendChild(this.$wraper)
    addFontFace()
    // id counter
    this.__id = 0
    // this dict will be set in App component
    this.commands = {}
  }

  render(imgSrc) {
    // make sure every render, config object is new
    chrome.storage.sync.get(CONF_KEYS, config => {
      let App = createApp(this, imgSrc, config)
      ReactDOM.render(<App/>, this.$wraper)
    })
  }

  destroy() {
    this.$wraper.removeChild(this.$wraper.firstChild)
  }

  id() {
    return this.__id++
  }

  parseUrl(url) {
    let aa = document.createElement("a")
    aa.href = url
    // now u have protocol, host, hostname, port, pathname, hash, search
    return aa.pathname
  }

  dataToStr(createdNodes) {
    let name = ""
    let ns = createdNodes.map(node => {
      let s = `_c${ node.class }_t${ NODETYPES[node.type] }_`
      let points = node.points.map(p => {
        return `x${ p.x.toFixed(2) }_y${ p.y.toFixed(2) }`
      })
      return s + points.join(POINT_DEL)
    })
    // each node is separated by "--"
    name += ns.join(NODE_DEL)
    //max name length: 255, should check this
    if (name.length > 255)
      alert(`name length(${name.length}) is largar than 255, this file might not be able to save to disk
        in some file system, you should reduce the amount of annotations or change "save annotation" option`)

    return name
  }
  // if a rect contains another rect or polygon, set it's parent child relationship
  parentChildCheck(nodes) {
    nodes.forEach(node => {
      for (let ii = 0; ii < nodes.length; ii++) {
        let points = node.points
        // 2 points rect to 4 points rect,
        //i know the 2 point are topleft and bottom right
        if (points.length === 2) {
          points.push({ y: points[0].y, x: points[1].x })
          points.push({ x: points[0].x, y: points[1].y })
          // re-arrange order: tl - tr - br - bl
          let fourth = points.splice(1, 1)[0]
          points.splice(2, 0, fourth)
        }

        let target = nodes[ii]
        if (target === node) continue
        let pp = target.points
        let isInTarget = true
        for (let jj = 0; jj < points.length; jj++) {
          // --------------------
          let result = isInPolygonObj(points[jj], pp)
          if (!result) {
            isInTarget = false
            break
          }
        }
        if (isInTarget) {
          target.child = node.id
          node.parent = target.id
          // constrain it to "one to one" relationship
          break
        }
      }
    })
    return nodes
  }

  saveFile(imgInfo, createdNodes ) {
    let url = imgInfo.src
    if (!createdNodes || createdNodes.length === 0)
      return alert("No Annotation created")

    // remove query stirng or other symbol: aa.jpg?size=l&color=1
    let cleanUrl = this.parseUrl(url)
    let ext = cleanUrl.substring(cleanUrl.lastIndexOf("."), cleanUrl.length) || "jpg"
    ext = ext.split(/\!|\?|\=/)[0]
    if ([".php", ".asp", ".aspx", ".jsp", ".html"].indexOf(ext)) {
      ext = ".jpg"
    }

    chrome.storage.sync.get(["localSaveMethod", "idCount", "defaultClass", "classes"], config => {
      let filename = config.idCount // Date.now().toString()
      let jsonFilename = filename + ".json"
      let method = config.localSaveMethod
      if (method === "FILENAME") {
        filename += this.dataToStr(createdNodes) + ext
      } else {
        filename += ext
        this.parentChildCheck(createdNodes)
        // class check
        createdNodes.forEach(n => {
          if (!n.class) n.class = config.classes[config.defaultClass]
        })
      }
      let msg = {
        type: "SAVE_FILE", url, method, filename,
        jsonString: JSON.stringify(Object.assign({}, imgInfo, {
          nodes: createdNodes,
        })),
        jsonFilename,
      }
      log("saveFile msg:", msg)
      chrome.runtime.sendMessage(msg, response => {
        log("saveFile res:", response)
        if (response) {
          this.destroy()
        }
      }) // end of sendMessage
      // increase idCount
      chrome.storage.sync.set({ idCount: parseInt(config.idCount) + 1})
    }) // end of get
  }

  upload(imgInfo, createdNodes ) {
    let url = imgInfo.src
    if (!createdNodes || createdNodes.length === 0)
      return alert("No Annotation created")

    // remove query stirng or other symbol: aa.jpg?size=l&color=1
    let cleanUrl = this.parseUrl(url)
    let ext = cleanUrl.substring(cleanUrl.lastIndexOf("."), cleanUrl.length)

    chrome.storage.sync.get(["idCount", "defaultClass", "classes", "server"], config => {
      let filename = config.idCount // Date.now().toString()
      let jsonFilename = filename + ".json"
      filename += ext
      this.parentChildCheck(createdNodes)
      // class check
      createdNodes.forEach(n => {
        if (!n.class) n.class = config.classes[config.defaultClass]
      })
      let jsonString = JSON.stringify(Object.assign({}, imgInfo, { nodes: createdNodes }))
      var jsonBlob = new Blob([jsonString], {type: "application/json"})
      remoteToBlob(url, (err, imgBlob) => {
        if (err) {
          log("err", err)
          return alert("image download failed")
        }
        // ---------- test code ------------

        // return

        var formData = new FormData()
        formData.append("json", jsonBlob, jsonFilename)
        formData.append("image", imgBlob, filename)

        log("upload imgblob")
        let oReq = new XMLHttpRequest()
        oReq.open("POST", config.server, true)
        oReq.onload = evt => {
          let response = JSON.parse(oReq.responseText)
          log("upload res:", response)
          if (response.success) {
            this.destroy()
          } else {
            alert(response.err)
          }
        }
        oReq.send(formData)
      }) // img blob
      chrome.storage.sync.set({ idCount: parseInt(config.idCount) + 1})
    }) // storage get
  }

} // end of class

var annotator = new DLAnnotator()
// annotator.render()

let msgHandlers = {
  OPEN_MODAL: (msg, sender, reply) => {
    log("should openModal")
    annotator.render(msg.srcUrl)
  },
  COMMAND: msg => {
    annotator.commands[msg.command]()
  }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  // request is the message
  // sender has id property, that's extension id
  log("msg", msg)
  // log("sender", sender)
  let fn = msgHandlers[msg.type]
  if (fn) {
    fn(msg, sender, reply)
  } else {
    log("unhandled message:", msg)
  }
})

