import React from "react/dist/react"
import { findDOMNode } from "react-dom/dist/react-dom"
import Toolbar from './Toolbar'
import Button, { Icon, IconButton } from "./Button"
import AnnoDataBox from "./AnnoDataBox"

export default class App extends React.Component {

  constructor() {
    super()
    this.state = {
      mainSecWidth: 0,
      mainSecHeight: 0,
      imgInfo: {
        src: null,
        width: 0,
        height: 0,
        fullWidth: 0,
        fullHeight: 0,
      },
      selectedTool: null,
      createdRect: [],
      createdPolygon: [],
      createdShape: [],
    }
  }

  getMainSecbounding() {
    if (!this.$mainSec) return { width: 0, height: 0 }
    return this.$mainSec.getBoundingClientRect()
  }

  componentDidMount() {
    this.$mainSec = findDOMNode(this.refs.mianSec)
    let { width, height } = this.getMainSecbounding()
    // set state withou rerender
    this.state.mainSecWidth = width
    this.state.mainSecHeight = height
  }

  render() {
    return (
      <div className="dla__wraper">
        <main ref="mianSec" className="dla__modal" data-layout="row">
          <section className="dla__main" data-flex>

          </section>
          <section className="dla__options">
            <Toolbar />
            <AnnoDataBox title="Reactangles" data={{content: "34, 88, 203, 20"}}/>
            <div className="dla__option--actions" data-layout="row">
              <span data-flex/>
              <Button size="md" raised>Upload</Button>
              <Button size="md" raised colored>Local Save</Button>
            </div>
          </section>
        </main>
      </div>
    )
  }

}