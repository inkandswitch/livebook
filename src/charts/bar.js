const createClickForTooltip = require("./c3-click-for-tooltip");

module.exports = plotBar;

function plotBar(selector, layer, { maxWidth }) {
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