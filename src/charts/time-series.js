const createClickForTooltip = require("./c3-click-for-tooltip");
const { parseLayer } = require("./util");

plotTimeSeries.isTimeSeries = isTimeSeries;

module.exports = plotTimeSeries;

function plotTimeSeries(selector, layer, { maxWidth }) {
  const { xName, yName, color, xs, columns } = parseLayer(layer);

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
    const { xs, columns } = parseLayer(layer, index, layers);
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