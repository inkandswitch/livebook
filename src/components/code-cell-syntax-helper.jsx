const React     = require("react");
const ReactDOM  = require("react-dom");
const { VelocityTransitionGroup } = require('velocity-react');

const getTypeMetaData = () => {};

const Text = () => ({
  parseDescription(local) {
    const { desc } = local;
    if (!desc) {
      return "";
    }
    const re = /type \'(\w*)\'/;
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
        <p><small>Look! A local variable appeared!</small></p>
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
      boxShadow: "white 0 -1px 2px, white 0 -13px 4px -6px inset",
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