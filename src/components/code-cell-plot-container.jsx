let React = require("react");
let { plot } = require("../charts/");

let PlotContainer = React.createClass({
  componentDidMount() {
    let selector = "#" + this.getID();
    let plotData = this.getPlotMessage();
    let width = this.clampWidth(this.getContainerWidth());
    plot(selector, plotData, { maxWidth: width });
  },

  componentDidUpdate(prevProps) {
    let prevPlotMessage = prevProps.plotMessage;
    let plotData = this.getPlotMessage();

    if (prevPlotMessage !== plotData) {
      let selector = "#" + this.getID();
      let width = this.clampWidth(this.getContainerWidth());

      plot(selector, plotData, { maxWidth: width });

    }
  },

  clampWidth(width) {
    return Math.min(600, width);
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
    const { width } = parent.getBoundingClientRect(); 
    return width;
  },

  render() {
    let id = this.getID();

    return (
      <div ref="container" id={id} className="notebook-plot"/>
    );
  },
});

module.exports = PlotContainer;