function plotSpecialLine(options) {
  options = Object.assign({}, options);

  let [svgHeight, svgWidth] = [options.height, options.width],
      height = svgHeight - options.margin.top - options.margin.bottom,
      width = svgWidth - options.margin.left - options.margin.right,
      marginLeftTop = [options.margin.left, options.margin.top],
      {x, y} = options,
      selector = options.selector;

  let xScale = d3.scale.linear().domain(d3.extent(x)).range([0, width])
  let yScale = d3.scale.linear().domain(d3.extent(y)).range([0, height])

  let linedata = zip(x.map(xScale), y.map(yScale));

  let lineFunction = d3.svg.line()
    .x((d) => d[0])
    .y((d) => d[1])
    .interpolate("linear");

  // clear old charts
  d3.select(selector)
    .classed("c3", false) // to stop those silly c3 styles from overriding ours...
    .select("*")
    .remove();

  let svgContainer = d3.select(selector)
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", "translate(" + marginLeftTop + ")")

  let lineGraph = svgContainer.append("path")
    .attr("d", lineFunction(linedata))
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("fill", "none");

}

module.exports = plotSpecialLine;