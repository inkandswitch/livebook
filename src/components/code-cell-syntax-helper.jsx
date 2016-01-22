const React     = require("react");
const ReactDOM  = require("react-dom");
const { VelocityTransitionGroup } = require('velocity-react');

const getTypeMetaData = () => {};

const Text = () => ({
  parseDescription(local) {
    const { desc } = local;
    if (!desc) return null;

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

  docLink({ name, type }) {
    if (name && type) {
      return <a className="notebook-syntax-helper-docs">{ type } docs &rarr;</a>;
    }
    return "";
  },

  spacer() {
    return (
      <span className="notebook-syntax-helper-spacer">
        &nbsp; &bull; &nbsp;
      </span>
    );
  },

  render() {
    const { local } = this.props;
    let { name } = local;
    const type = this.parseDescription(local);
    let inspect = "inspection";
    if (type === null) inspect = "";
    if (type === null) name = "";
    return (
      <div style={this.props.style} className="notebook-syntax-helper">
        <span className="notebook-syntax-helper-code">{ name }</span>
        <span className="notebook-syntax-helper-blue">{ type }</span>
        { name && type ? this.spacer() : "" }
        <span className="notebook-syntax-helper-orange"><i>{ inspect }</i></span>
        {this.docLink({ name, type })}
      </div>
    );
  }
})

const SyntaxPopup = () => ({

  styles() {
    const style = {
      background: "rgba(225,225,225,.98)",
      border: "solid 1px rgba(167,167,167,1)",
      borderRadius: 5,
      boxShadow: "white 0 -1px 1px",
      boxSizing: "border-box",
      fontSize: "95%",
      height: 50,
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
        translateY: -35,
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