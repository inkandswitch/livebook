const createClickForTooltip = require("./c3-click-for-tooltip");
const { parseLayer } = require("./util");

module.exports = bar;

function bar(selector, layer, { maxWidth }) {

  const { xName, yName, color, xs, columns } = parseLayer(layer);

  const chart = c3.generate({
      size: {
        width: maxWidth,
        height: maxWidth / 1.7,
      },
      bindto: selector,
      data: {
        // x: xName,
        xs,
        columns: columns,
        type: "bar",
        onclick: createClickForTooltip(),
      },
      color,
      transition: {
        duration: 0,
      },
      axis: {
        x: {
          tick: {
            format: (n) => d3.round(n, 2),
          },
        },
        y: {
            label: yName,
            tick: {
              format: d3.format("0,000")
            },
        }
      },
      tooltip: {
        show: false,
      },
  });


  chart.addLayer = (layer, index, layers) => {
    const { xs, columns } = parseLayer(layer, index, layers);
    chart.load({ columns, xs })
  };

  return chart;
}