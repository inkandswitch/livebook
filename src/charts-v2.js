var Sk  = require("./skulpt")
var zip = require("./util").zip;

var notebook

function setup(n) {
  notebook = n
}

var _plot_generated_ = function() {}

var _plot_d3_ = function(xmax,ymax) {
  console.log("PLOT1",xmax,ymax)
  var iPython = notebook.getiPython(),
      $cell   = notebook.get$cell();

  iPython.cells[$cell].outputs = [];

  var selector = "#plot" + $cell;
  var margin   = {top: 20, right: 20, bottom: 30, left: 40},
      width    = 500 - margin.left - margin.right,
      height   = 300 - margin.top - margin.bottom;

  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var color = d3.scale.category10();

  d3.select("svg.livebook-chart").remove();

  var svg = d3.select(selector).append("svg")
      .classed("livebook-chart", true)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

}

Sk.builtins["__figure_js__"] = function(xmax, ymax) {
  var $xmax = Sk.ffi.remapToJs(xmax)
  var $ymax = Sk.ffi.remapToJs(ymax)
  debugger;
  _plot_d3_($xmax,$ymax)
}

//Sk.builtins["__plot_js__"] = function(X,Y,ColorName) {
Sk.builtins["__plot_js__"] = function() {
  let $plotCell = notebook.get$cell();

  if (arguments.length === 1) {
    let data = arguments[0];
    let $data = Sk.ffi.remapToJs(data);

    _livebookPlot($plotCell, $data);
  }
  else if (arguments.length === 2) {
    let x = arguments[0];
    let y = arguments[1];
    let $x = Sk.ffi.remapToJs(x);
    let $y = Sk.ffi.remapToJs(y);
    _livebookPlot($plotCell, { columns: [$x, $y], } );
  }
//  var $X = Sk.ffi.remapToJs(X)
//  var $Y = Sk.ffi.remapToJs(Y)
//  var $ColorName = Sk.ffi.remapToJs(ColorName)
//  _plot_generated_($X,$Y,$ColorName)
}

// Fixme
function isTimeSeries(data) {
  var columns = data.columns;
  var yearMonthDateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
  var result;

  result = columns.some(function(column) {
    return column.some(function(datum) {
      return yearMonthDateRegex.test(datum);
    })
  });
  
  return result;
}

function _livebookPlot(cell, data) {
  console.log("Chart data:", data);
  let chartSelector = "#plot" + cell;
  if (isTimeSeries(data)) {
    let chart = c3.generate({
        bindto: chartSelector,
        data: data,
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y'
                }
            }
        }
    });    
  }
  else {
    let columns = data.columns;
    let xName = columns[0][0];
    let yName = columns[1][0];
    let xs = {};
    xs[yName] = xName;

    let chart = c3.generate({
        bindto: chartSelector,

        data: {
            xs: xs,
            columns: columns,
            type: 'scatter',
        },
        axis: {
            x: {
                label: xName,
                tick: {
                    fit: false
                }
            },
            y: {
                label: yName,
            }
        }
    });

  }

}

module.exports = { setup: setup }
