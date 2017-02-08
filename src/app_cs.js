import React from "react/dist/react"
import ReactDOM from "react-dom/dist/react-dom"
import createApp from './components/App'

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
  }

  render() {
    let App = createApp(this)
    ReactDOM.render(<App/>, this.$wraper)
  }

  destroy() {
    this.$wraper.removeChild(this.$wraper.firstChild)
  }
}

var annotator = new DLAnnotator()
annotator.render()


