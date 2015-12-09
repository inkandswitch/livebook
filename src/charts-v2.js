
var Sk  = require("./skulpt");

var noop = require("./util").noop;
var zip = require("./util").zip;

var notebook;

var FIGURE_CACHE = {};


function setup(n) {
  notebook = n
}

function getChartSelector(cellNumber) {
  return "#plot" + cellNumber;
}

Sk.builtins["__figure_js__"] = function() {
  // TODO
}

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
  else if (arguments.length === 3) {

    // assume the third argument is options object
    let options = arguments[2];
    let $options = Sk.ffi.remapToJs(options);
    let x = arguments[0];
    let y = arguments[1];
    let $x = Sk.ffi.remapToJs(x);
    let $y = Sk.ffi.remapToJs(y);

    _livebookPlot($plotCell, { columns: [$x, $y], }, $options );
  }
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

function _livebookPlot(cell, data, options) {
  var CLICK_TOOLTIP_SHOWING = false;  // sloppy as helllll 
  var TOOLTIP_POSITION;
 
  options = Object.assign({ chart_type: "scatter" }, options)
  var type = options.chart_type;
  console.log("Chart data:", data);

  let chartSelector = getChartSelector(cell);
  if (isTimeSeries(data)) {
    data.onclick = clickHandler;
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
        },
        tooltip: {
          show: false,
        },
    });    
  }
  else if (type === "scatter") {
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
            type: "scatter",
            onclick: clickHandler,
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
        },
        tooltip: {
          show: false,
        },
    });
  }
  else if (type === "line") {
    let columns = data.columns;
    let xName = columns[0][0];
    let yName = columns[1][0];
    let xs = {};
    xs[yName] = xName;
    let chart = c3.generate({
        bindto: chartSelector,
        data: {
            x: xName,
            columns: columns,
            type: "line",
            // onclick: clickHandler,
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
        },
    });
  }
  else if (type === "special_line") {

    let chartNode = d3.select(chartSelector).node();
    if (!chartNode) {
      console.log("%cCould not find the chart node... short circuiting!", "color: darkred;")
      return;
    }
    let {width, height} = chartNode.getBoundingClientRect();

    let columns = data.columns;

    let x = columns[0].slice(1);
    let y = columns[1].slice(1);

    plotSpecialLine({
      x: x,
      y: y,
      height: height,
      width: width,
      selector: chartSelector,
      margin: {
        top: 20,
        right: 30,
        bottom: 25,
        left: 30,
      }
    });

  }

  function clickHandler(d, element) {

    /* IDEAS */
    // - Freeze position
    // - Fuck with the "mousemove" event

    let event = d3.event;
    // don't enter edit mode on cell
    event.stopPropagation();
    event.preventDefault();

    //
    let chart = this;
    let internalAPI = this.internal.api;
    let internalConfig = this.internal.config;

    let isTooltipHidden = !internalConfig.tooltip_show;
    

    if (isTooltipHidden) {
      internalConfig.tooltip_show = true;
      CLICK_TOOLTIP_SHOWING = true;

      this.tooltip.show({
        data: d,
        mouse: d3.mouse(element),
      });
      getCurrentTooltipPosition();
      freezeTooltipPosition();
    }
    else {
      internalConfig.tooltip_show = false;
      CLICK_TOOLTIP_SHOWING = false;

      unfreezeTooltipPosition();
      this.tooltip.hide();
    }

    function getCurrentTooltipPosition() {
      // TODO
      let top = parseInt(chart.internal.tooltip.style("top").replace("px", ""));
      let left = parseInt(chart.internal.tooltip.style("left").replace("px", ""));
      TOOLTIP_POSITION = {
        top: top,
        left: left,
      }
    }

    function freezeTooltipPosition() {

      internalConfig.tooltip_position = function() {
        return TOOLTIP_POSITION;
      }
    }

    function unfreezeTooltipPosition() {
      internalConfig.tooltip_position = null;
    }

    /******* BEGIN INTERNAL MOUSEOVER *******/ 
    // var $$ = this.internal,
    //     d3 = $$.d3,
    //     config = $$.config,
    //     CLASS = $$.CLASS 

    // var index = d.index;

    // if ($$.dragging || $$.flowing) { return; } // do nothing while dragging/flowing
    // if ($$.hasArcType()) { return; }

    // // Expand shapes for selection
    // if (config.point_focus_expand_enabled) { $$.expandCircles(index, null, true); }
    // $$.expandBars(index, null, true);

    // // Call event handler
    // $$.main.selectAll('.' + CLASS.shape + '-' + index).each(function (d) {
    //     config.data_onmouseover.call($$.api, d);
    // });
    /******* END INTERNAL MOUSEOVER *******/ 
  }
}

function plotSpecialLine(options) {
  options = Object.assign({}, options);

  let svgHeight = options.height,
      svgWidth = options.width,
      height = svgHeight - options.margin.top - options.margin.bottom,
      width = svgWidth - options.margin.left - options.margin.right,
      marginLeftTop = [options.margin.left, options.margin.top],
      x = options.x,
      y = options.y,
      chartSelector = options.selector;

  let xScale = d3.scale.linear().domain(d3.extent(x)).range([0, width])
  let yScale = d3.scale.linear().domain(d3.extent(y)).range([0, height])

  let linedata = zip(x.map(xScale), y.map(yScale));

  let lineFunction = d3.svg.line()
    .x((d) => d[0])
    .y((d) => d[1])
    .interpolate("linear");

  // clear old charts
  d3.select(chartSelector)
    .classed("c3", false) // to stop those silly c3 styles from overriding ours...
    .select("*")
    .remove();

  let svgContainer = d3.select(chartSelector)
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

    // debugger;

}

module.exports = { setup: setup }
