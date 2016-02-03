const bar = require("./bar");
const line = require("./line");
const scatter = require("./scatter");

function plot(selector, plot, { maxWidth }) {
  let { chart_type, layers } = plot;

  if (!layers || !layers.length) {
    return noLayersErrorMessage();
  }

  const firstLayer = layers[0];

  const chart = (() => {
    switch (chart_type) {
      case "bar"    : return bar(selector, firstLayer, { maxWidth });
      case "line"   : return line(selector, firstLayer, { maxWidth });
      case "scatter": return scatter(selector, firstLayer, { maxWidth });
    }
  })();

  addExtraChartLayers(chart, layers);

  return chart;
}

function addExtraChartLayers(chart, layers) {
  if (!chart.addLayer) return;
  if (layers.length < 2) return;

  layers.forEach((layer, index, layers) => {
    if (index === 0) return;
    chart.addLayer(layer, index, layers);
  });      
}

module.exports = { plot }

function noLayersErrorMessage() {
  console.log("%cplot was called without any layers to plot :'(", "color: darkred;");
}
