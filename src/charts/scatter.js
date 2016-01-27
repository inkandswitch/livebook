const createClickForTooltip = require("./c3-click-for-tooltip");

module.exports = plotScatter;

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
      tooltip: {
        show: false,
      },
  });
}