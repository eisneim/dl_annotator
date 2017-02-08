import React from "react/dist/react"

export class Button extends React.Component {

  _handleClick(e) {
    // do nothing if it's disabled
    if (this.props.disabled) return
    // show ripple animation
    // invoke click handler
    if (typeof this.props.onClick === 'function')
      this.props.onClick(e)
  }

  getClassName() {
    const { colored, raised, accent, rounded, disabled, size } = this.props
    var name = this.props.className + ' dla__button ' + 'dla__size_' + size
    if (colored) name += ' ' + "dla__colored"
    if (raised) name += ' ' + "dla__raised"
    if (accent) name += ' ' + "dla__accent"
    if (rounded) name += ' ' + "dla__rounded"
    if (disabled) name += ' ' + "dla__disabled"

    return name
  }

  render() {

    return (
      <button className={this.getClassName()}
        style={this.props.style}
        onClick={this._handleClick.bind(this)}>
        {this.props.children}
      </button>
    )
  }
}

Button.propTypes = {
  colored: React.PropTypes.bool,
  raised: React.PropTypes.bool,
  accent: React.PropTypes.bool,
  rounded: React.PropTypes.bool,
  isBlock: React.PropTypes.bool,
  size: React.PropTypes.oneOf([ 'sm', 'xs', 'md', 'lg', 'xlg' ]),
}

Button.defaultProps = {
  size: 'sm',
}

export default Button


// import PureRenderMixin from "react-addons-pure-render-mixin"
// import reactMixin from "react-mixin"
// reactMixin.onClass(Button, PureRenderMixin )

export class IconButton extends React.Component {

  render() {
    if (React.Children.count(this.props.children) === 0) {
      return (
        <Button {...this.props} rounded={true}>
          <i style={this.props.iconStyle} className="material-icons">{this.props.name}</i>
        </Button>
      )
    }

    return (
      <Button {...this.props}>
        <i className="material-icons">{this.props.name}</i>
        { this.props.children }
      </Button>
    )
  }
}

export class Icon extends React.Component {

  render() {
    const { size, name, className } = this.props
    const iconStyle = {
      fontSize: (size || 14) + 'px',
    }

    return (
      <i
        {...this.props}
        className={'material-icons ' + className}
        style={iconStyle}>
        {name}
      </i>
    )
  }
}
