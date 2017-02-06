import React from "react"
import ReactDOM from "react-dom"

import App from './components/App'

class DLAnnotator {
  constructor() {
    this.$wraper = document.createElement("div")
    document.body.appendChild(this.$wraper)
  }

  render() {
    ReactDOM.render(<App/>, this.$wraper)
  }
}

var annotator = new DLAnnotator()
annotator.render()

