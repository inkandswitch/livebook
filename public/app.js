"use strict";

Opal.modules["opal-parser"](Opal)

var uid = 0;

function guid() {
  uid = uid + 1
  return uid;
}

function dur2mins(dur) {
 var mins = [1,60,60*24]
 return dur.split(":").reverse().reduce(function(sum,val,index) { return sum + (+val) * mins[index] },0)
}

function uniq(array) {
  var n = []
  for (var v of array) {
    if (n.indexOf(v) < 0 && v[0] != "_") {
      n.push(v)
    }
  }
  return n
}

function tabulate(data) {
    var columns = uniq(data._headers.concat(Object.keys(data[0])))

    var table = d3.select("#data").append("table"),
        thead = table.append("thead"),
        tbody = table.append("tbody");

    // Append the header row
    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
            .text(function(column) {
                return column;
            });

    // Create a row for each object in the data
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr")
        .attr("id", function(d) { return "d_" + d._id })
        .on("click", function(d) {
          var point = d3.select("#p_" + d._id)
          var row = d3.select("#d_" + d._id)
          var select = !row.classed("selected")
          point.classed("selected",select)
          row.classed("selected",select)
        })

    // Create a cell in each row for each column
    var cells = rows.selectAll("td")
        .data(function(row) {
            return columns.map(function(column) {
                return {
                    column: column,
                    value: row[column]
                };
            });
        })
        .enter()
        .append("td")
            .text(function(d) { return d.value; });

    return table;
}

function plot(opal_data, input, output) {
  var data = opal_data.map(function(d) { return d.smap })
  data._headers = qqq // hack for now
  tabulate(data)
  console.log(data[0])

  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 920 - margin.left - margin.right,
      height = 470 - margin.top - margin.bottom;

  var x = d3.scale.linear().range([0, width]);

  var y = d3.scale.linear().range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var svg = d3.select("svg").remove()
  var svg = d3.select("div#plot").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent(data, function(d) { return d[output]; })).nice();
    y.domain(d3.extent(data, function(d) { return d[input]; })).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(output);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(input)

    svg.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("id", function(d) { return "p_" + d._id; })
        .attr("cx", function(d) { return x(d[output]); })
        .attr("cy", function(d) { return y(d[input]); })
//        .style("fill", function(d) { return color(d.species); });
//        .style("fill", function(d) { return color("derka"); })
        .on("click", function(d,x) {
          console.log(d,x)
          var point = d3.select("#p_" + d._id)
          var row = d3.select("#d_" + d._id)
          var select = !point.classed("selected")
          point.classed("selected",select)
          row.classed("selected",select)
        })

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
}

function round2(x) {
  return Math.round((+x)*100)/100
}

var cache = {}
function load(name) {
  if (cache[name]) return cache[name].map(function(d) { return Opal.hash(d) })
  var promise = new Promise(function(resolve,reject) {
    var result = d3.csv(name, function(d) {
      // if it looks like a number - convert it
      for (var key in d) {
        if (!isNaN(+d[key])) {
          d[key] = +d[key]
        }
      }
      d._id = guid()
      return d
    },
    function(error, data) {
      if (error) reject(error);
      cache[name] = data
//      var last_headers = d3.csv._get_last_headers()
//      console.log("last_headers",data._headers)
      resolve(data)
    });
  })
  throw promise
}

function _magic_eval(code) {
  try {
    Opal.eval(code)
  } catch (e) {
    if (e instanceof Promise) {
      e.then(function() {_magic_eval(code)}, function(err) { console.log("error readind data") } )
    } else {
      console.log(e)
    }
  }
}

// monkey patch d3

var qqq
d3.csv._parseRows = d3.csv.parseRows
d3.csv.parseRows = function(text,f) {
  var headers = null;
  var rows = d3.csv._parseRows(text,function(a,b) {
    headers = headers || a
    return f(a,b);
  })
  qqq = headers // hack
  rows._headers = headers
  return rows
}

window.bridge = {
  load: load,
  plot: plot
}

Opal.eval(""+
"  def load name\n"+
"    `window.bridge.load`.call(name)\n"+
"  end\n"+
"  def plot data, a, b\n"+
"    `window.bridge.plot`.call(data,a,b)\n"+
"  end\n")
