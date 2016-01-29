const bar = require("./bar");
const scatter = require("./scatter");
const line = require("./line");

const createClickForTooltip = require("./c3-click-for-tooltip");

function plotV2(selector, plot, { maxWidth }) {
  let { chart_type, layers } = plot;

  if (!layers || !layers.length) {
    console.log("%cplotV2 called with plot message that lacks layers", "color: darkred;");
    return;
  }

  const firstLayer = layers[0];

  if (chart_type === "scatter") {
    const chart = scatter(selector, firstLayer, { maxWidth });

    if (!chart) return; // only seen this triggered by old cached results

    addExtraChartLayers(chart, layers);
    consolidateCircleOpacity(chart.element);

    return chart;
  }

  if (chart_type === "line") {
    const chart = line(selector, firstLayer, { maxWidth });

    if (!chart) return; // only seen this triggered by old cached results

    addExtraChartLayers(chart, layers);
    consolidateCircleOpacity(chart.element);

    return chart;
  }

  if (chart_type === "bar") {
    const chart = bar(selector, firstLayer, { maxWidth }); // fixme - only plotting first layer

    addExtraChartLayers(chart, layers);

    return chart;
  }
}

function addExtraChartLayers(chart, layers) {
  if (chart.addLayer && layers.length > 1)
    layers.slice(1).forEach(chart.addLayer);

}

function consolidateCircleOpacity(element) {
  d3.select(element)
    .selectAll("circle")
    .style("opacity", .7);
}

module.exports = { plotV2 }
