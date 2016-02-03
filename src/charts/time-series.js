const createClickForTooltip = require("./c3-click-for-tooltip");
const { getColors } = require("./defaults");

const { hasLayerXNameConflict, transformConflictingName } = require("./util");

plotTimeSeries.isTimeSeries = isTimeSeries;

module.exports = plotTimeSeries;

function plotTimeSeries(selector, layer, { maxWidth }) {
  const { data, options } = layer;
  let { x, y } = data;
  let xName = x.column;
  let yName = y.column;
  let xData = x.list;
  let yData = y.list;
  const color = { pattern: getColors() };
  let columns = [
    [xName, ...xData],
    [yName, ...yData]
  ];

  let xs = {};
  xs[yName] = xName;

  if (options && options.color) {
    color.pattern.unshift(options.color);
  }

  const chart = c3.generate({
      size: {
        width: maxWidth,
        height: maxWidth / 1.7,
      },
      bindto: selector,
      data: {
        x: xName,
        columns: columns,
        onclick: createClickForTooltip(),
      },
      transition: {
        duration: 0,
      },
      color,
      axis: {
        x: {
          type: "timeseries",
          tick: {
              format: '%Y'
          }
        }
      },
      point: {
        r: 5,
      },
      tooltip: {
        show: false,
      },
  });

  chart.addLayer = function(layer, index, layers) {


    const { data, options } = layer;
    let { x, y } = data;
    let xName = x.column;

    if (hasLayerXNameConflict(layer, index, layers)) {
      xName = transformConflictingName(xName, index);
    }

    let yName = y.column;
    let xData = x.list;
    let yData = y.list;
    let columns = [
      [xName, ...xData],
      [yName, ...yData]
    ];
    let xs = {};
    xs[yName] = xName;

    chart.load({ columns, xs });

  };

  return chart;
}

// Fixme
function isTimeSeries(list) {
  let yearMonthDateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/; // matches YYYY-MM-DD, where MM and DD do not need leading zeroes

  return list.some(function(datum) {
    return yearMonthDateRegex.test(datum);
  });
}