var $         = require("jquery")
var React     = require("react")
var marked    = require("marked")
var AceEditor = require('react-ace');

var zip = (a,b) => a.map( (v,i) => [v,b[i]])

var cache = {}
window.__load__ = function(name) {
  if (cache[name]) return cache[name]
  // convert waldo.csv -> data
  var promise = new Promise(function(resolve,reject) {
    // FILENAME to $data here
    var result = d3.csv(name, function(d) {
      for (var key in d) {
        if (!isNaN(+d[key])) {
          d[key] = +d[key]
        }
      }
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

// these three lines came from skulpt repl.js codebase
var importre = new RegExp("\\s*import")
var defre = new RegExp("def.*|class.*")
var assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
var indent = /^\s+/

function pyLoad(x)
{
  if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
    throw "File not found: '" + x + "'";
  return Sk.builtinFiles["files"][x];
}

var $cell = undefined;

function python_mark(cell) {
  $cell = Sk.ffi.remapToJs(cell)
}

function python_render(result) {
  if (result == undefined) return
  console.log("2_js",result.to_js);
  var $result;
  if (result.to_js) {
    var $method = Sk.abstr.gattr(result, 'to_js', true)
    var tmp = Sk.misceval.callsimOrSuspend($method)
    $result = Sk.ffi.remapToJs(tmp)
  } else {
    $result = Sk.ffi.remapToJs(result)
  }

  if ($result && $result.rows && $result.cols && $result.data) {
    var table = "<table><thead><tr><th>&nbsp;</th>";
    $result.cols.forEach(col => table += "<th>" + col + "</th>")
    table += "</tr></thead>"
    table += "<tbody>"
    $result.rows.forEach(row => {
      table += "<tr><th>" + row + "</th>"
      $result.cols.forEach(col => table += "<td>" + $result.data[row][col].toFixed(6) + "</td>")
      table += "</tr>"
    })
    table += "</tbody>"
    table += "</table>"

    iPython.cells[$cell].outputs = [
      {
       "data": {
         "text/html": [ table ]
       },
       "execution_count": 1,
       "metadata": {},
       "output_type": "execute_result"
      },
    ]
  } else {
    iPython.cells[$cell].outputs = [
      {
       "data": {
         "text/plain": [$result]
       },
       "execution_count": 1,
       "metadata": {},
       "output_type": "execute_result"
      }
    ]
  }
}

Sk.builtins["mark"] = python_mark
Sk.builtins["render"] = python_render
Sk.configure({output: text => { console.log("STDOUT:",text) }, read: pyLoad })

var Mode = "view";
var CursorCell = 0;
var iPython = { cells:[] }
var notebookMount = document.getElementById('notebook')
var editorMount = document.getElementById('editor')

var editor       = {}
var useEditor    = function(cell) { return (cell.props.index == CursorCell && Mode == "edit") }
var editorClass  = function(cell)  { return !useEditor(cell) ? "hidden" : "" }
var displayClass = function(cell) { return  useEditor(cell) ? "hidden" : "" }

function onChangeFunc(i) {
  return e => {
    iPython.cells[i].source = e.split("\n").map( s => s + "\n")
    if (iPython.cells[i].cell_type == "code") python_eval()
  }
}

function rawMarkup(lines) { return { __html: marked(lines.join(""), {sanitize: true}) } }
function cursor(i) {
  if (i != CursorCell) return ""
  if (Mode == "view")  return ""
  if (Mode == "nav")   return "cursor"
  if (Mode == "edit")  return "cursor-edit"
  else                 throw  "Invalid mode: " + Mode
}

function renderEditor() {
  console.log("render editor")
  if (Mode != "edit") {
    $("#editX").hide()
  } else {
    var height = $(".switch")[CursorCell].offsetHeight + "px"
    var width  = $(".switch")[CursorCell].offsetWidth  + "px"
    var lang   = iPython.cells[CursorCell].cell_type == "code" ? "python" : "markdown"
    var value  = iPython.cells[CursorCell].source.join("")
    var change = onChangeFunc(CursorCell)
    var dom    = <AceEditor className="editor" mode={lang} height={height} width={width} value={value} theme="github" onChange={change} name="editX" editorProps={{$blockScrolling: true}} />
    React.render(dom, editorMount);

    var pos = cellPosition()

    $("#editX").show()
    $("#editX").css("top",pos.top)
    $("#editX").css("left",pos.left)

    editor = ace.edit("editX")
    editor.focus()
    editor.moveCursorTo(0,0);
    editor.getSession().setUseWrapMode(true);
    // TODO if type==code?
    python_eval()
  }
}

function cellPosition() {
  var bodyRect = document.body.getBoundingClientRect()
  var elemRect = $(".switch")[CursorCell].getBoundingClientRect()
  var t   = Math.round(elemRect.top  - bodyRect.top) + "px";
  var l   = Math.round(elemRect.left - bodyRect.left) + "px";
  return { top: t, left: l }
}


function render() {
  React.render(<Notebook data={iPython} />, notebookMount);
}

function moveCursor(delta) {
  if (Mode == "edit") return;
  if (Mode == "view") { setMode("nav"); return }

  var newCursor = CursorCell + delta;
  if (newCursor >= iPython.cells.length || newCursor < 0) return;
  CursorCell = newCursor;
  render();
  $('body').animate({ scrollTop: $('.cursor').offset().top - 80 });
}

function appendCell(type) {
  var cell = '';

  if (type == "code")
    cell = ({
       "cell_type": "code",
       "execution_count": 1,
       "metadata": { "collapsed": false },
       "outputs": [
          {
           "data": {
            "text/plain": [ "(waiting)" ]
           },
           "execution_count": 1,
           "metadata": {},
           "output_type": "execute_result"
         }
       ],
       "source": [ "type some python" ]
    });
  else if (type == "markdown")
    cell = ({
       "cell_type": "markdown",
       "metadata": {},
       "source": [ "type some markdown" ]
    });
  else {
    console.log("bad cell type " + type);
    return;
  }

  iPython.cells.splice(CursorCell+1, 0, cell);
  CursorCell += 1;

  render();
  setMode("edit");
}

function deleteCell() {
  console.log('delete');
  iPython.cells.splice(CursorCell, 1);

  if (CursorCell > 0)
    CursorCell -= 1;

  CursorCell = Math.min(CursorCell, iPython.cells.length-1);

  render();
}

function setMode(m) {
  if (Mode == m) return false;
  Mode = m;
  if (m == "edit") CODE.cache(CursorCell)
  else             CODE.clear(CursorCell)
  renderEditor();
  render()
  return true
}

$('body').keyup(function(e) {
  switch (e.which) {
    case 27: // esc
      if (Mode == "edit") setMode("nav")
      else                setMode("view")
      break;
    case 38: // up
      if (Mode == "edit") break;
      moveCursor(-1);
      break;
    case 40: // down
      if (Mode == "edit") break;
      moveCursor(1);
      break;
  }
})

$('body').keypress(function(e) {
  if (Mode == "edit") return;

  switch (e.which) {
    case 101:
      setMode("edit");
      e.preventDefault();
      break;
    case 107: //k
    case 113: //q
      moveCursor(-1);
      e.preventDefault();
      break;
    case 106: //j
    case 97:  //a
      moveCursor(1);
      e.preventDefault();
      break;
    case 99: //c
      appendCell('code');
      e.preventDefault();
      break;
    case 109: //m
      appendCell('markdown');
      e.preventDefault();
      break;
    case 120: //x
      deleteCell();
      e.preventDefault();
      break;
  }
});

$('.hamburger-menu img').click(function() {
  $('.hamburger-menu').toggleClass('active');
});


var python_eval = function() {
  var lines = []
  var lineno = 0
  var lineno_map = {}
  iPython.cells.forEach((c,i) => {
    if (c.cell_type == "code") {
      editor.getSession().clearAnnotations()

      lines.push("mark("+i+")\n")

      c.source.forEach((line,line_number) => {
        if (!line.match(/^\s*$/)) {
          lineno += 1
          lineno_map[lineno] = { cell: i, line: line_number }
          lines.push(line)
        }
      })
      var line = lines.pop()
      if (!assignment.test(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
        lines.push("render(" + line.trim() + ")\n")
      } else {
        lines.push(line)
        lines.push("render(None)\n")
      }
    }
  })

  if (lines.length > 0) {
    try {
      var code = lines.join("")
      eval(Sk.importMainWithBody("<stdin>", false, code))
    } catch (e) {
      if (e.nativeError instanceof Promise) {
        console.log("native promise!",e.nativeError)
        e.nativeError.then(python_eval, function(err) {
          console.log("double error",err)
          handle_error(lineno_map,e)
        } )
      } else {
        console.log("Handle Error",e)
        handle_error(lineno_map,e)
      }
    }
  }
  render()
}

function handle_error(lineno_map, e) {
  var err_at = lineno_map[e.traceback[0].lineno] || lineno_map[e.traceback[0].lineno - 1] || {cell: CursorCell, line:1}
  var msg = Sk.ffi.remapToJs(e.args)[0]
  if (err_at.cell == CursorCell) {
    editor.getSession().setAnnotations([{
      row: err_at.line,
      text: msg,
      type: "error" // also warning and information
    }]);
  }
}

var _plot = function() {}

window.__plot2 = function(X,Y,colorName) {
  _plot(X,Y,colorName)
}

window.__plot1 = function(xmax,ymax) {

  iPython.cells[$cell].outputs = []
  var selector = "#plot" + $cell;
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

  d3.select("svg").remove()

  var svg = d3.select(selector).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent([0,xmax])).nice();
    y.domain(d3.extent([0,ymax])).nice();

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
  _plot = function(X,Y,colorName) {
    var color = d3.rgb(colorName);
    n++;
    svg.selectAll(".dot"+n)
        .data(zip(X,Y))
      .enter().append("circle")
        .attr("class", "dot"+n)
        .attr("r", 3.5)
        .attr("id", function(d) { return "p_" + d._id; })
        .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); })
        .style("fill", color)
        .on("click", function(d,x) {
          console.log("click",d,x)
        })
  }
}

var MarkdownCell = React.createClass({
  render: function() {
    return ( <div className="cell switch">
              <div className={displayClass(this)} dangerouslySetInnerHTML={rawMarkup(this.props.data.source)} />
            </div>)
  }
});

// this is to cache the code being edited so the pane does not update under the editor
var CODE = {
  cache: (i) => CODE[i] = iPython.cells[i].source.join("") + " ",
  clear: (i) => delete CODE[i],
  read:  (i) => CODE[i] || iPython.cells[i].source.join(""),
}

var CodeCell = React.createClass({
  html: function(data) { return (data && <div dangerouslySetInnerHTML={{__html: data.join("") }} />) },
  png:  function(data) { return (data && <img src={"data:image/png;base64," + data} />) },
  text: function(data) { return (data && <div className="pyresult">{data.join("")}</div>) },
  outputs:  function() { return (this.props.data.outputs.map(output =>
      this.html(output.data["text/html"]) ||
      this.png(output.data["image/png"])  ||
      this.text(output.data["text/plain"])
  ))},
 code: function() {
    return <div className={"code " + displayClass(this)}>{CODE.read(this.props.index)}</div>
 },
  render: function() { return (
    <div className="cell">
      <div className="switch">
        <div className="codewrap"> {this.code()} </div>
      </div>
      <div className="yields"><img src="yield-arrow.png" alt="yields" /></div>
      {this.outputs()}
      <div id={"plot"+this.props.index} className="plot"></div>
    </div>)
  }
});

var Cell = React.createClass({
  subcell: function() {
    if (this.props.data.cell_type == "markdown")
      return <MarkdownCell data={this.props.data} index={this.props.index}/>
    else
      return <CodeCell data={this.props.data} index={this.props.index}/>
  },
  render: function() {
    return <div className={cursor(this.props.index)}> {this.subcell()} </div>
  }
})

var Notebook = React.createClass({
  cells: function() {
    return this.props.data.cells.map((cell,index) => <Cell data={cell} index={index}/>)
  },
  render: function() {
    return <div className="notebook">{this.cells()}</div>
  },
})

var fname = window.location.hash.substring(1);
if (fname == "") fname = "waldo";
document.title = fname + " notebook"
fname += ".ipynb";
console.log("Loading " + fname);

// TODO figure out how to make webpack pack these so I can avoid all this sillyness
$.get("pandas.js",function(data) {
  Sk.builtinFiles["files"]["./pandas.js"] = data
  $.get("pyplot.js",function(data) {
    Sk.builtinFiles["files"]["./matplotlib/pyplot.js"] = data
    $.get("matplotlib.js",function(data) {
      Sk.builtinFiles["files"]["./matplotlib.js"] = data
      $.get(fname,function(data) {
        iPython = data
        render()
      }, "json")
    })
  })
})
