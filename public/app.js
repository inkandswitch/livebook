"use strict";

$(function() {
// delete a segment?
// show proper error on external error?

var Range = ace.require('ace/range').Range

// python setup
Sk.builtins["load"] = python_load
Sk.builtins["plot"] = python_plot
Sk.builtins["render"] = python_render
Sk.configure({output: output})

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

function tabulate(data_id, data) {
    console.log("#data=",data_id)
    var columns = Object.keys(data[0]) //uniq(data._headers.concat(Object.keys(data[0])))

//    var table = d3.select("#data").append("table"),
    var table = d3.select(data_id).append("table"),
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

function python_render(block, result) {
  var $block = Sk.ffi.remapToJs(block)
  var $result = Sk.ffi.remapToJs(result)
  var b = Blocks[$block]
  var data_element = "#data" + b.id
  if ($result instanceof Array && $result[0] instanceof Object) {
    b.find(data_element).html("") // clear out old data
    b.find(data_element).show()
    tabulate(data_element, $result)
    b.find(".output").html("")
  } else if ($result instanceof Object && $result.display == "plot") {
    b.find(data_element).html("") // clear out old data
    b.find(data_element).show()
    plot(data_element, $result.data, $result.input, $result.output)
    b.find(".output").html("")
  } else {
    b.find(data_element).hide()
    b.find(".output").html($result)
  }
}

// TODO - this could be done better in python - no need to go back to js
function python_plot(data, input, output) {
  console.log("python_plot 1")
  var $data = Sk.ffi.remapToJs(data)
  console.log("python_plot 2")
  var $input = Sk.ffi.remapToJs(input)
  console.log("python_plot 3")
  var $output = Sk.ffi.remapToJs(output)
  console.log("python_plot 4")
  var result = Sk.ffi.remapToPy({display:"plot", data:$data, input:$input, output:$output })
  console.log("/python_plot",result)
  return result
}

function plot(selector, data, input, output) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 500 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

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
  var svg = d3.select(selector).append("svg")
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
function python_load(name) {
  var $result = load(name.v)
  var $mapped = Sk.ffi.remapToPy($result)
  return $mapped
}

function load(name) {
  if (cache[name]) return cache[name]
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
      resolve(data)
    });
  })
  throw promise
}

function output(text) {
  console.log("output::",text)
}

// monkey patch d3

//var qqq
d3.csv._parseRows = d3.csv.parseRows
d3.csv.parseRows = function(text,f) {
//  var headers = null;
  var rows = d3.csv._parseRows(text,function(a,b) {
//    headers = headers || a
    return f(a,b);
  })
//  qqq = headers // hack
//  rows._headers = headers
  return rows
}


var init_code = {}


$("body").keypress(function(event) {
  if (event.ctrlKey) {
    if (event.charCode == 24) { // Ctrl-X
    } else if (event.charCode == 26) { // Ctrl-Z
    } else {
      console.log("unknown ctrl key",event)
    }
  }
})

var Block = 0
var Blocks = []

// these three lines came from skulpt repl.js codebase
var importre = new RegExp("\\s*import")
var defre = new RegExp("def.*|class.*")
var assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
var indent = /^\s+/

var python_eval = function() {
  var lines = []
  console.log("Blocks",Blocks)
  console.log("Blocks.length=",Blocks.length)
  var last = -1
  var lineno = 0
  var lineno_map = {}
  for (var b of Blocks) {
    if (b == undefined) continue;
    if (b.lang == "python") {
      b.editor.getSession().clearAnnotations()
      var editor_lines = b.editor.getValue().split("\n")
      for (var lnum = 0; lnum < editor_lines.length; lnum++) {
        var l = editor_lines[lnum]
        if (!l.match(/^\s*$/)) {
          lineno += 1
          lineno_map[lineno] = { block: b.id, line: lnum }
          lines.push(l)
        }
      }
      var i = lines.length - 1
      if (i > last) {
        if (!assignment.test(lines[i]) && !defre.test(lines[i]) && !importre.test(lines[i]) && !indent.test(lines[i])) {
          lines[i] = "render(" + b.id + ",(" + lines[i] + "))"
        } else {
          lines[i] = "render(" + b.id + ",None)"
        }
        last = i
      }
    }
  }
  if (lines.length > 0) {
    try {
    var code = lines.join("\n")
    eval(Sk.importMainWithBody("<stdin>", false, code))
    } catch (e) {
      if (e.nativeError instanceof Promise) {
        console.log("err",e)
        console.log("native promise!",e.nativeError)
        e.nativeError.then(python_eval, function(err) { handle_error(lineno_map,e) } )
      } else {
        handle_error(lineno_map,e)
      }
    }
  }
}

function handle_error(lineno_map, e) {
  console.log("handle_error",e)
  var err_at = lineno_map[e.traceback[0].lineno] || lineno_map[e.traceback[0].lineno - 1]
  var block = Blocks[err_at.block]
  block.find(".output").html("Error at line: " + err_at.line)
  block.find("#data" + block.id).hide()
  block.editor.getSession().setAnnotations([{
    row: err_at.line,
    text: e.tp$name,
    type: "error" // also warning and information
  }]);
}

var pyblock = $("#pyblock")

$("#newpy").click(function(event) {
  Block += 1

  var lang = "python"
  var block = pyblock.clone()
  block.lang = lang
  block.id = Block
  Blocks[Block] = block

  block.attr("id","block" + Block)
  block.find("div.gutter").html("["+Block+"]")
  block.find("div.editor").attr("id","editor" + Block)
  block.find("div.data").attr("id","data" + Block)

  $("#blocks").append(block)

  block.editor = ace.edit("editor" + Block);
  block.editor.$blockScrolling = Infinity
  block.editor.getSession().setMode("ace/mode/" + lang);
  block.editor.getSession().getSelection().selectionLead.setPosition(2, 0); // cursor at end
//  block.editor.on("change",function() { _magic_eval(lang, block.editor.getValue()); })
  block.editor.on("change",python_eval)
  block.editor.focus()

  block.editor.setup = function() {
//    if (localStorage.getItem(lang) == null) localStorage.setItem(lang, init_code[lang])
    block.editor.getSession().setMode("ace/mode/"+lang);
//    editor.setValue(localStorage.getItem(lang))
    block.editor.getSession().getSelection().selectionLead.setPosition(2, 0); // cursor at end
//    _magic_eval(lang, block.editor.getValue())
    python_eval()
  }

  block.editor.setup()
})

jQuery.get("/init.py",function(data) {
  console.log(data)
  $("#newpy").click()
  Blocks[1].editor.setValue(data)
})

}) // $(function() {
