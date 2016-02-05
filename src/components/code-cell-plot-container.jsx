let React = require("react");
let { plot } = require("../charts/");

let PlotContainer = React.createClass({
  componentDidMount() {
    let selector = "#" + this.getID();
    let plotData = this.getPlotMessage();
    let width = this.clampWidth(this.getContainerWidth());
    this.__plot = plot(selector, plotData, { maxWidth: width });
    this.removeFlyingLegend();
  },

  componentDidUpdate(prevProps) {
    let prevPlotMessage = prevProps.plotMessage;
    let plotData = this.getPlotMessage();

    if (prevPlotMessage !== plotData) {
      let selector = "#" + this.getID();
      let width = this.clampWidth(this.getContainerWidth());

      this.__plot = plot(selector, plotData, { maxWidth: width });
      this.removeFlyingLegend();
    }
  },

  clampWidth(width) {
    return Math.min(600, width);
  },

  removeFlyingLegend() {
    // NYI :(
  },

  componentWillUnmount() {
    // document.getElementById(this.getId()).remove();
  },

  getPlotMessage() {
    return this.props.plotMessage;
  },

  getID() {

    let cellIndex = this.props.cellIndex;
    let cellPlotIndex = this.props.cellPlotIndex;

    return "plot-" + cellIndex + "-" + cellPlotIndex; 
  },

  getContainerWidth() {
    const container = this.refs.container;
    const parent = container.parentElement;
    const leftPadding = +getComputedStyle(parent, null).getPropertyValue('padding-left').replace("px","");
    const rightPadding = +getComputedStyle(parent, null).getPropertyValue('padding-right').replace("px","");

    const { width } = parent.getBoundingClientRect() - leftPadding - rightPadding;

    return width;
  },

  render() {
    let id = this.getID();

    return (
      <div ref="container" id={id} className="notebook-plot" onClick={ () => global.__PLOT = this.__plot } />
    );
  },
});

module.exports = PlotContainer;