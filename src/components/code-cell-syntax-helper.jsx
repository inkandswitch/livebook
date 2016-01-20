const React     = require("react");
const ReactDOM  = require("react-dom");
const { VelocityTransitionGroup } = require('velocity-react');

const Text = () => ({
  render() {
    const { local } = this.props;

    return (
      <div style={this.props.style} className="notebook-syntax-helper">
        <p><small>Look! A local variable appeared!</small></p>
        <b>{ local.name }</b>
        &nbsp; &nbsp;
        <i>{ local.desc }</i>
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
      boxShadow: "0 -10px 0 -10px white",
      boxSizing: "border-box",
      fontSize: "80%",
      height: 80,
      padding: ".4em 1em .5em",
      position: "absolute",
      visibility: "hidden",
      width: "100%",
      zIndex: 0,
    };
    return style;
  },

  render() {
    const enter = {
      animation: {
        maxHeight: 1000,
        translateY: -60,
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