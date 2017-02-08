import React from "react/dist/react"
import cx from 'classnames'
import { Scrollbars } from 'react-custom-scrollbars'
import theme from '../../theme'
import csjs from 'CSJS'

const styles = csjs`
  .scrollable {
    position: relative;
  }
  .scrollbarWraper {
    height: 100%;
  }
  .scrollbarTrack {
    height: 100%;
    width:6px;
  }
  .scrollbarBlock {
    width: 10px;
  }
  .scrollbarHorizontal{
    background-color: ${theme.bgDarker};
    bottom:0;
    width:100%;
  }
  .thumbHorizontal{
    cursor: pointer;
    background-color: ${theme.bgMainDarker};
  }
  .scrollbarVertical{
    background-color: ${theme.bgDarker};
    border-left: solid 1px ${theme.bgMainBorder};
    height:100%;
    right: -1px;
  }
  .thumbVertical{
    cursor: pointer;
    background-color: ${theme.bgMain};
  }
  .view{
    position:relative;
  }

`

export default class Scrollable extends React.Component {
  render() {
    return (
      <Scrollbars className={cx(styles.scrollable, this.props.className)}
        scrollbarHorizontal={props => <div {...props} className={styles.scrollbarHorizontal}/>}
        scrollbarVertical={props => <div {...props} className={styles.scrollbarVertical}/>}
        thumbHorizontal={props => <div {...props} className={styles.thumbHorizontal}/>}
        thumbVertical={props => <div {...props} className={styles.thumbVertical}/>}
        view={props => <div {...props} className={styles.view}/>} >
        {this.props.children}
      </Scrollbars>
    )
  }
}

// import PureRenderMixin from "react-addons-pure-render-mixin"
// import reactMixin from "react-mixin"

// reactMixin.onClass(Scrollable, PureRenderMixin )
