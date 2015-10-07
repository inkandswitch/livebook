var $         = require("jquery")
var React     = require("react")
var marked    = require("marked")
var AceEditor = require('react-ace');

// these three lines came from skulpt repl.js codebase
var importre = new RegExp("\\s*import")
var defre = new RegExp("def.*|class.*")
var assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
var indent = /^\s+/

function python_render(cell,result) {
  var $cell = Sk.ffi.remapToJs(cell)
  var $result = Sk.ffi.remapToJs(result)
  stdout_buffer.push($result)
  console.log(stdout_buffer)
  iPython.cells[$cell].outputs = [
    {
     "data": {
      "text/plain": stdout_buffer
     },
     "execution_count": 1,
     "metadata": {},
     "output_type": "execute_result"
    }
  ]
  stdout_buffer = []
}

var stdout_buffer = []

Sk.builtins["render"] = python_render
Sk.configure({output: text => stdout_buffer.push(text) })

var Mode = "nav";
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
  if (Mode == "nav")   return "cursor"
  else                 return "cursor-edit"
}

function renderEditor() {
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
  if (Mode != "nav") return;
  var newCursor = CursorCell + delta;
  if (newCursor >= iPython.cells.length || newCursor < 0) return;
  CursorCell = newCursor;
  render();
  $('body').animate({ scrollTop: $('.cursor').offset().top - 80 });
}

function insertCell() {
  if (Mode != "nav") return;

  iPython.cells.splice(CursorCell, 0, {
     "cell_type": "markdown",
     "metadata": {},
     "source": [ "type markdown" ]
  });

  render();
  setMode("edit");

  editor = ace.edit("editX")
  editor.selectAll();
}

function setMode(m) {
  Mode = m;
  if (m == "edit") CODE.cache(CursorCell)
  else             CODE.clear(CursorCell)
  render()
  renderEditor();
}

$('body').keyup(function(e) {
  switch (e.which) {
    case 27: // esc
      setMode("nav");
      break;
    case 38: // up
      moveCursor(-1);
      break;
    case 40: // down
      moveCursor(1);
      break;
  }
})

$('body').keypress(function(e) {
  if (Mode != "nav") return;

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
    case 105:
      insertCell();
      e.preventDefault();
      break;
  }
});


var python_eval = function() {
  var lines = []
  var lineno = 0
  var lineno_map = {}
  iPython.cells.forEach((c,i) => {
    if (c.cell_type == "code") {
      var valid = false
      editor.getSession().clearAnnotations()
      c.source.forEach((line,line_number) => {
        if (!line.match(/^\s*$/)) {
          valid = true
          lineno += 1
          lineno_map[lineno] = { cell: i, line: line_number }
          lines.push(line)
        }
      })
      if (!valid) {
        lines.push("render(" + i + ",None)\n")
      } else {
        var line = lines.pop()
        if (!assignment.test(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
          lines.push("render(" + i + ",(" + line.trim() + "))\n")
        } else {
          lines.push(line)
          lines.push("render(" + i + ",None)\n")
        }
      }
    }
  })

  if (lines.length > 0) {
    try {
      var code = lines.join("")
      stdout_buffer = []
      eval(Sk.importMainWithBody("<stdin>", false, code))
    } catch (e) {
      handle_error(lineno_map,e)
    }
  }
  render()
}

function handle_error(lineno_map, e) {
  var err_at = lineno_map[e.traceback[0].lineno] || lineno_map[e.traceback[0].lineno - 1]
  var msg = Sk.ffi.remapToJs(e.args)[0]
  if (err_at.cell == CursorCell) {
    editor.getSession().setAnnotations([{
      row: err_at.line,
      text: msg,
      type: "error" // also warning and information
    }]);
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

$.get(fname,function(data) {
  iPython = data
  render()
}, "json")
