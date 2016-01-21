const React     = require("react");
const ReactDOM  = require("react-dom");
const { VelocityTransitionGroup } = require('velocity-react');

const getTypeMetaData = () => {};

const Text = () => ({
  parseDescription(local) {
    const { desc } = local;
    if (!desc) return "";

    let result;

    result = this.ifType(desc)
    if (result) return result;

    result = this.ifModule(desc)
    if (result) return result;

    result = this.ifClass(desc)
    if (result) return result;

    return null;
  },

  ifType(desc) {
    const re = /type \'(\w*)\'/;
    const match = desc.match(re);
    if (match && match[1]) {
      return match[1]
    }
    return null;
  },

  ifModule(desc) {
    const re = /module \'(\w*)\'/;
    const match = desc.match(re);
    if (match && match[1]) {
      return match[1]
    }
    return null;
  },

  ifClass(desc) {
    const re = /class \'([\w|\.]*)\'/;
    const match = desc.match(re);
    if (match && match[1]) {
      return match[1]
    }
    return null;
  },

  render() {
    const { local } = this.props;
    let { name } = local;
    const type = this.parseDescription(local);
    if (type === null) name = "";
    return (
      <div style={this.props.style} className="notebook-syntax-helper">
        <p><small><i>{ name ? "" : "Move your cursor over a variable to inspect it" }</i></small></p>
        <b>{ name }</b>
        &nbsp; &nbsp;
        <i style={{ fontWeight: 300 }}>{ type }</i>
      </div>
    );
  }
})

const SyntaxPopup = () => ({

  styles() {
    const style = {
      background: "rgba(221,221,221,.98)",
      border: "solid 1px rgba(162,162,162,1)",
      borderRadius: 4,
      boxShadow: "white 0 -1px 2px",
      boxSizing: "border-box",
      fontSize: "80%",
      height: 78,
      left: "3%",
      padding: ".4em 1em .5em",
      position: "absolute",
      visibility: "hidden",
      width: "91%",
      zIndex: 0,
    };
    return style;
  },

  render() {
    const enter = {
      animation: {
        maxHeight: 1000,
        translateY: -70,
      },
      duration: 300,
      visibility: "visible",
    };
    const leave = {
      animation: {
        maxHeight: 0,
        translateY: 0,
      },
      duration: 300,
      visibility: "hidden",
    };

    return (
      <VelocityTransitionGroup enter={enter} leave={leave}>
        { this.props.show ? <Text style={this.styles()} local={this.props.local} /> : undefined }
      </VelocityTransitionGroup>
    );
  }
});

module.exports = SyntaxPopup;