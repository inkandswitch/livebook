const createClickForTooltip = require("./c3-click-for-tooltip");


module.exports = plotBar;

function plotBar(selector, data, { maxWidth }) {
  let { x, y } = data;
  let xName = x.column;
  let yName = y.column;
  let xData = x.list;
  let yData = y.list;

  let columns = [
    [xName, ...xData],
    [yName, ...yData]
  ];

  let chart = c3.generate({
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
}



// const { data } = layer;

// let xCol = data["x"];
// let yCol = data["y"];

// if (typeof xCol[0] === "number") xCol[0] = "x";
// if (typeof yCol[0] === "number") yCol[0] = "y";

// const xName = xCol[0];
// const yName = yCol[0];

// const xs = {};
// xs[yName] = xName;

// const columns = [xCol, yCol];