var Sk  = require("./skulpt")
var zip = require("./util").zip;

function requireGlobalDeps() {
  return require("./notebook");
}

var _plot_generated_ = function() {}

var _plot_d3_ = function(xmax,ymax) {
  console.log("PLOT1",xmax,ymax)
  var iPython = requireGlobalDeps().getiPython(),
      $cell   = requireGlobalDeps().get$cell();

  iPython.cells[$cell].outputs = [];

  var selector = "#plot" + $cell;
  var margin   = {top: 20, right: 20, bottom: 30, left: 40},
      width    = 500 - margin.left - margin.right,
      height   = 300 - margin.top - margin.bottom;

  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  d3.select("svg").remove()

  var svg = d3.select(selector).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent([0, xmax])).nice();
    y.domain(d3.extent([0, ymax])).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")

    var legend = svg.selectAll(".legend")
        .data(color.domain())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

  var n = 0
  _plot_generated_ = function(X, Y, colorName) {
    if (seemsLikeOklahoma(X)) {
      plotForOklahoma(colorName);
    }
    var color = d3.rgb(colorName);
    n++;
    svg.selectAll(".dot" + n)
        .data(zip(X,Y))
      .enter().append("circle")
        .attr("class", "dot"+n)
        .attr("r", 3.5)
        .attr("id", function(d) { return "p_" + d._id; /* TODO - assign ids to each datum, or construct an id out of the datum */ })
        .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); })
        .style("fill", color)
        .on("click", function(d, i) {
          // NB: You can access event data through `d3.event`
          console.log("click", d, i);
        })
  }
}
Sk.builtins["__figure_js__"] = function(xmax,ymax) {
  var $xmax = Sk.ffi.remapToJs(xmax)
  var $ymax = Sk.ffi.remapToJs(ymax)
  _plot_d3_($xmax,$ymax)
}

//Sk.builtins["__plot_js__"] = function(X,Y,ColorName) {
Sk.builtins["__plot_js__"] = function(data) {
  var $data = Sk.ffi.remapToJs(data)
  let $cell   = requireGlobalDeps().get$cell();
  plotForOklahoma($cell, $data);
//  var $X = Sk.ffi.remapToJs(X)
//  var $Y = Sk.ffi.remapToJs(Y)
//  var $ColorName = Sk.ffi.remapToJs(ColorName)
//  _plot_generated_($X,$Y,$ColorName)
}


function seemsLikeOklahoma(X, Y) {
  // oklahoma data are all undefined for some reason

  if (X.some((x) => x !== undefined)) return false;
  return true;
}

function plotForOklahoma(cell, data) {
  console.log("CHART",data)
  let chart = c3.generate({
      bindto: "#plot" + cell, //"#oklahoma",
      data: data,
      axis: {
          x: {
              type: 'timeseries',
              tick: {
                  format: '%Y'
              }
          }
      }
  })
}

