const {isArray, noop, zip} = require("../util");

const plotLine = require("./line");
const plotSpecialLine = require("./line-waldo"); // created for the waldo notebook
const plotScatter = require("./scatter");
const scatterV2 = require("./scatter-v2");
const plotTimeSeries = require("./time-series");
const isTimeSeries = plotTimeSeries.isTimeSeries;

const createClickForTooltip = require("./c3-click-for-tooltip");

function plotV2(selector, plot, { maxWidth }) {
  let { chart_type, layers } = plot;

  if (!layers || !layers.length) {
    throw new Error("plotV2 called with plot message that lacks layers");
  }

  if (chart_type === "scatter") {
    const chart = scatterV2(selector, layers[0], { maxWidth }); // fixme - only plotting first layer

    // This is what plotting multiple layers should look like:
    //    
    // const chart = scatterV2.layered(selector)
    // layers.forEach(chart.addLayer, chart) // todo - add data for each layer of plot

    return chart;
  }

  if (chart_type === "line") {
    const data = layers[0].data;
    const chart = plotTimeSeries(selector, data, { maxWidth }); // fixme - only plotting first layer
    return chart;
  }


  debugger;

}

function nuLivebookPlot(selector, plotMessage) {

  // All of this dispatching logic should instead be based off of the "type" of a plotMessage (NYI)
  // (plotMessage should be transformed by the `cell-plots-adapter` into a friendlier data strcuture to plot)

  let isScatter = (plotMessage.length === 3) && isArray(plotMessage[2]); // fixme

  if (isScatter) {
    let columns = plotMessage.slice(1);
    plotScatter(selector, { columns })
    return;
  }

  let data = plotMessage[1]; 
  if (isTimeSeries(data)) {
    plotTimeSeries(selector, data);
    return;
  }
}

module.exports = { nuLivebookPlot, plotV2 }
