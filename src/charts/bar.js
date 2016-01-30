const createClickForTooltip = require("./c3-click-for-tooltip");
const { getColors } = require("./defaults");

module.exports = bar;

function bar(selector, layer, { maxWidth }) {
  const { data, options } = layer;
  const { x, y } = data;
  const xName = x.column;
  const yName = y.column;
  const xData = x.list;
  const yData = y.list;
  const color = { pattern: getColors() };
  const columns = [
    [xName, ...xData],
    [yName, ...yData]
  ];

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
        type: "bar",
        onclick: createClickForTooltip(),
      },
      color,
      transition: {
        duration: 0,
      },
      axis: {
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

  chart.addLayer = (layer) => {
    const { data } = layer;
    const { x, y } = data;
    const xName = x.column;
    const yName = y.column;
    const xData = x.list;
    const yData = y.list;

    const columns = [
      [xName, ...xData],
      [yName, ...yData]
    ];

    chart.load({ columns })
  };

  return chart;
}