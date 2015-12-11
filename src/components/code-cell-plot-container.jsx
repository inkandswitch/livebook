let React = require("react");
let {nuLivebookPlot} = require("../charts/");

let PlotContainer = React.createClass({
  componentDidMount() {
    let selector = "#" + this.getID();
    let plotData = this.getPlotMessage();

    nuLivebookPlot(selector, plotData);
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