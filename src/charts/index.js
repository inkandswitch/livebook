const {isArray, noop, zip} = require("../util");

const plotLine = require("./line");
const plotSpecialLine = require("./line-waldo"); // created for the waldo notebook
const plotScatter = require("./scatter");
const plotTimeSeries = require("./time-series");
const isTimeSeries = plotTimeSeries.isTimeSeries;

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

  if (false) { // fixme ... when and how does this get called?
    let chartContainerNode = d3.select(selector).node();
    if (!chartContainerNode)
      return console.log("%cCould not find the chart node... short circuiting!", "color: darkred;")
  
    let {width, height} = chartContainerNode.getBoundingClientRect();
    let {columns} = plotMessage[1]; // fixme (?) ... guessing at the api here

    let x = columns[0].slice(1);
    let y = columns[1].slice(1);

    plotSpecialLine({
      x: x,
      y: y,
      height: height,
      width: width,
      selector: chartSelector,
      margin: {
        top: 20,
        right: 30,
        bottom: 25,
        left: 30,
      },
    });
  }
}

module.exports = { nuLivebookPlot }
