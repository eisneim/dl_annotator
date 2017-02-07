import React from "react"
import Toolbar from './Toolbar'

export default class App extends React.Component {

  render() {
    return (
      <div className="dla__wraper">
        <main className="dla__modal" data-layout="row">
          <section className="dla__main" data-flex>
            <Toolbar />
          </section>
          <section className="dla__options">
            <h3>some options</h3>
          </section>
        </main>
      </div>
    )
  }

}