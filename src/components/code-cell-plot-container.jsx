let React = require("react");
let { nuLivebookPlot, plotV2 } = require("../charts/");

let PlotContainer = React.createClass({
  componentDidMount() {
    let selector = "#" + this.getID();
    let plotData = this.getPlotMessage();

    plotV2(selector, plotData);
  },

  componentDidUpdate(prevProps) {
    let prevPlotMessage = prevProps.plotMessage;
    let plotData = this.getPlotMessage();

    if (prevPlotMessage !== plotData) {
      let selector = "#" + this.getID();

      plotV2(selector, plotData);

    }
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

  render() {
    let id = this.getID();

    return (
      <div id={id} className="notebook-plot"/>
    );
  },
});

module.exports = PlotContainer;