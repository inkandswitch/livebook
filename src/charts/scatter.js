const createClickForTooltip = require("./c3-click-for-tooltip");
const { getColors } = require("./defaults");

function scatterV2(selector, layer, { maxWidth }) {

    const color = { pattern: getColors() };
    const { data, options } = layer;

    let { x, y } = data;
    let xName = x.column;
    let yName = y.column;

    let xData = x.list;
    let yData = y.list;

    const xs = {};
    xs[yName] = xName;

    let columns = [
      [xName, ...xData],
      [yName, ...yData]
    ];

    const axis = {
      x: {
          label: xName,
          tick: {
              fit: false,
              format: (n) => d3.round(n, 2),
          },
      },
      y: {
        label: yName,
        tick: {
          format: d3.format("0,000")
        },
      }
    };

    if (options && options.color) {
      color.pattern.unshift(options.color);
    }

    let chart = c3.generate({
        size: {
            width: maxWidth,
            height: maxWidth / 1.7,            
        },
        bindto: selector,
        data: {
            xs: xs,
            columns: columns,
            type: "scatter",
            onclick: createClickForTooltip(),
        },
        color,
        transition: {
          duration: 0,
        },
        axis,
        point: {
            r: 5,
        },
        tooltip: {
          show: false,
        },
    });

    chart.addLayer = function(layer) {
      const { data } = layer;

      let { x, y } = data;
      let xName = x.column;
      let yName = y.column;

      let xData = x.list;
      let yData = y.list;

      const xs = {};
      xs[yName] = xName;

      let columns = [
        [xName, ...xData],
        [yName, ...yData]
      ];

      chart.load({ columns, xs })

    };

    return chart;
}

module.exports = scatterV2;