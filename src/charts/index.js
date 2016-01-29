const barV2 = require("./bar-v2");
const scatterV2 = require("./scatter-v2");
const lineV2 = require("./line-v2");

const createClickForTooltip = require("./c3-click-for-tooltip");

function plotV2(selector, plot, { maxWidth }) {
  let { chart_type, layers } = plot;

  if (!layers || !layers.length) {
    console.log("%cplotV2 called with plot message that lacks layers", "color: darkred;");
    return;
  }

  if (chart_type === "scatter") {
    const chart = scatterV2(selector, layers[0], { maxWidth }); // fixme - only plotting first layer
    if (layers.length > 1) {
      layers.slice(1).forEach(chart.addLayer, chart);
    }

    consolidateCircleOpacity(chart.element)

    return chart;
  }

  if (chart_type === "line") {
    const data = layers[0].data;
    const chart = lineV2(selector, data, { maxWidth }); // fixme - only plotting first layer
    if (layers.length > 1) {
      layers.slice(1).forEach(chart.addLayer);
    }

    consolidateCircleOpacity(chart.element)

    return chart;
  }

  if (chart_type === "bar") {
    const data = layers[0].data;
    const chart = barV2(selector, data, { maxWidth }); // fixme - only plotting first layer

    consolidateCircleOpacity(chart.element)

    return chart;
  }
}

function consolidateCircleOpacity(element) {
  d3.select(element)
    .selectAll("circle")
    .style("opacity", .7);
}

module.exports = { plotV2 }
