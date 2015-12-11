let {isArray, noop, zip} = require("../util");

let clickForTooltip = require("./c3-click-for-tooltip");

let notebook;
function setup(n) {
  notebook = n
}

// Fixme
function isTimeSeries(data) {
  let columns = data.columns;
  let yearMonthDateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/; // matches YYYY-MM-DD, where MM and DD do not need leading zeroes

  return columns.some(function(column) {
    return column.some(function(datum) {
      return yearMonthDateRegex.test(datum);
    })
  });
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

function plotScatter(selector, data) {
  let columns = data.columns;
  let xName = columns[0][0];
  let yName = columns[1][0];
  let xs = {};
  xs[yName] = xName;

  let chart = c3.generate({
      bindto: selector,

      data: {
          xs: xs,
          columns: columns,
          type: "scatter",
          onclick: clickForTooltip,
      },
      axis: {
          x: {
              label: xName,
              tick: {
                  fit: false
              }
          },
          y: {
              label: yName,
          }
      },
      tooltip: {
        show: false,
      },
  });
}

function plotTimeSeries(selector, data) {
  let {columns} = data;

  let xName = columns[0][0];
  let yName = columns[1][0];

  let chart = c3.generate({
      bindto: selector,
      data: {
        x: xName,
        columns: columns,
        onclick: clickForTooltip,
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
              format: '%Y'
          }
        }
      },
      tooltip: {
        show: false,
      },
  });
}

function plotLine(selector, data) {
  let columns = data.columns;
  let xName = columns[0][0];
  let yName = columns[1][0];
  let xs = {};
  xs[yName] = xName;
  let chart = c3.generate({
      bindto: selector,
      data: {
        x: xName,
        columns: columns,
        type: "line",
        onclick: clickForTooltip,
      },
      axis: {
        x: {
            label: xName,
            tick: {
                fit: false
            }
        },
        y: {
            label: yName,
        }
      },
  });
}

function plotSpecialLine(options) {
  options = Object.assign({}, options);

  let [svgHeight, svgWidth] = [options.height, options.width],
      height = svgHeight - options.margin.top - options.margin.bottom,
      width = svgWidth - options.margin.left - options.margin.right,
      marginLeftTop = [options.margin.left, options.margin.top],
      {x, y} = options,
      selector = options.selector;

  let xScale = d3.scale.linear().domain(d3.extent(x)).range([0, width])
  let yScale = d3.scale.linear().domain(d3.extent(y)).range([0, height])

  let linedata = zip(x.map(xScale), y.map(yScale));

  let lineFunction = d3.svg.line()
    .x((d) => d[0])
    .y((d) => d[1])
    .interpolate("linear");

  // clear old charts
  d3.select(selector)
    .classed("c3", false) // to stop those silly c3 styles from overriding ours...
    .select("*")
    .remove();

  let svgContainer = d3.select(selector)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", "translate(" + marginLeftTop + ")")

  let lineGraph = svgContainer.append("path")
    .attr("d", lineFunction(linedata))
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("fill", "none");

}

module.exports = { setup, nuLivebookPlot }
