import React from "react/dist/react"
import ReactDOM from "react-dom/dist/react-dom"
import createApp from './components/App'
const log = require("./utils/util.log.js")("Index")

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

class DLAnnotator {
  constructor() {
    this.$wraper = document.createElement("div")
    this.$wraper.classname = "_dla_"
    document.body.appendChild(this.$wraper)
    addFontFace()
    // id counter
    this.__id = 0
  }

  render(imgSrc) {
    let App = createApp(this, imgSrc)
    ReactDOM.render(<App/>, this.$wraper)
  }

  destroy() {
    this.$wraper.removeChild(this.$wraper.firstChild)
  }

  id() {
    return this.__id++
  }

  saveFile(url, createdNodes) {
    let msg = {
      type: "SAVE_FILE", url,
      filename: "TODO",
    }
    log("saveFile msg:", msg)
    chrome.runtime.sendMessage(msg, response => {
      log("saveFile res:", response)
      if (response) {
        this.destroy()
      }
    })
  }
}

var annotator = new DLAnnotator()
annotator.render()

let msgHandlers = {
  OPEN_MODAL: (msg, sender, reply) => {
    log("should openModal")
    annotator.render(msg.srcUrl)
  }
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  // request is the message
  // sender has id property, that's extension id
  // log("msg", msg)
  // log("sender", sender)
  let fn = msgHandlers[msg.type]
  if (fn) {
    fn(msg, sender, reply)
  } else {
    log("unhandled message:", msg)
  }
})

