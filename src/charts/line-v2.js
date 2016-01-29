const createClickForTooltip = require("./c3-click-for-tooltip");

const plotTimeSeries = require("./time-series");

module.exports = plotLine;

function plotLine(selector, data, { maxWidth }) {
  let result;

  if (data.columns) {
    result = plotTimeSeries(...arguments);
  }
  else {
    result = plainOldLine(...arguments)
  }

  d3.select(selector).selectAll(".c3-line").style("stroke-width", "2px");

  return result;
}

function plainOldLine(selector, data, { maxWidth }) {
  let { x, y } = data;
  let xName = x.column;
  let yName = y.column;
  let xData = x.list;
  let yData = y.list;

  let columns = [
    [xName, ...xData],
    [yName, ...yData]
  ];

  let xs = {};
  xs[yName] = xName;

  let chart = c3.generate({
      bindto: selector,
      size: {
        width: maxWidth,
        height: maxWidth / 1.7,
      },
      data: {
        x: xName,
        columns: columns,
        type: "line",
        onclick: createClickForTooltip(),
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
      point: {
        r: 5
      },
      tooltip: {
        show: false,
      },
  });

  chart.addLayer = function(layer) {
    let { data } = layer;
    let { x, y } = data;
    let xName = x.column;
    let yName = y.column;
    let xData = x.list;
    let yData = y.list;

    let columns = [
      [xName, ...xData],
      [yName, ...yData]
    ];

    let xs = {};
    xs[yName] = xName;

    chart.load({ columns, xs })

  };

  return chart;
}