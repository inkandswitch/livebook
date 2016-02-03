const createClickForTooltip = require("./c3-click-for-tooltip");
const { parseLayer } = require("./util");

function scatterV2(selector, layer, { maxWidth }) {

    const { xName, yName, color, xs, columns } = parseLayer(layer);

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

    chart.addLayer = function(layer, index, layers) {
      const { xs, columns } = parseLayer(layer, index, layers);
      chart.load({ columns, xs })
    };

    return chart;
}

module.exports = scatterV2;