var $         = require("jquery")
var React     = require("react")
var marked    = require("marked")
var AceEditor = require('react-ace');

// Sk.builtins["load"] = python_load
Sk.configure({output: text => console.log("output::",text) })

var Mode = "nav";
var CursorCell = 0;
var iPython = { cells:[] }
var mountNode = document.getElementById('mount')
var cellHeights = []

var useEditor    = function(cell) { return (cell.props.index == CursorCell && Mode == "edit") }
var editorClass  = function(cell)  { return !useEditor(cell) ? "hidden" : "" }
var displayClass = function(cell) { return  useEditor(cell) ? "hidden" : "" }

function onChangeFunc(i) { return e => iPython.cells[i].source = e.split("\n").map( s => s + "\n") }
function rawMarkup(lines) { return { __html: marked(lines.join(""), {sanitize: true}) } }
function cursor(i) {
  if (i != CursorCell) return ""
  if (Mode == "nav")   return "cursor"
  else                 return "cursor-edit"
}

function render() {
  React.render(<Notebook data={iPython} />, mountNode);
  var cells = $(".switch")
  for (var i = 0; i < cells.length; i++) {
    cellHeights[i] = cells[i].offsetHeight + "px" // or .clientHeight
  }
}

function moveCursor(delta) {
  if (Mode != "nav") return;
  var newCursor = CursorCell + delta;
  if (newCursor >= iPython.cells.length || newCursor < 0) return;
  CursorCell = newCursor;
  render();
  $('body').animate({ scrollTop: $('.cursor').offset().top - 80 });
}

function setMode(m) {
  Mode = m;
  render();

  if (Mode == "edit") {
    var editor = ace.edit("edit" + CursorCell)
    editor.focus()
    editor.getSession().setUseWrapMode(true);
  }
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
    case 113:
      moveCursor(-1);
      e.preventDefault();
      break;
    case 97:
      moveCursor(1);
      e.preventDefault();
      break;
  }
});


// todo
var python_eval = function() {
  var lines = []
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

var MarkdownCell = React.createClass({
  render: function() {
    return ( <div className="cell switch">
              <div className={displayClass(this)} dangerouslySetInnerHTML={rawMarkup(this.props.data.source)} />
              <AceEditor className={editorClass(this)} mode="markdown" height={cellHeights[this.props.index]} width="100%" value={this.props.data.source.join("")} cursorStart={-1} theme="github" onChange={onChangeFunc(this.props.index)} name={"edit" + this.props.index} editorProps={{$blockScrolling: true}} />
            </div>)
  }
});

var CodeCell = React.createClass({
  html: function(data) { return (data && <div dangerouslySetInnerHTML={{__html: data.join("") }} />) },
  png:  function(data) { return (data && <img src={"data:image/png;base64," + data} />) },
  text: function(data) { return (data && data.join("\n")) },
  outputs:  function() { return (this.props.data.outputs.map(output =>
      this.html(output.data["text/html"]) ||
      this.png(output.data["image/png"])  ||
      this.text(output.data["text/plain"])
  ))},
 editor: function() {
    return <AceEditor className={editorClass(this)} mode="python" height={cellHeights[this.props.index]} width="100%" value={this.props.data.source.join("")} cursorStart={-1} theme="github" onChange={onChangeFunc(this.props.index)} name={"edit" + this.props.index} editorProps={{$blockScrolling: true}} />
 },
 code: function() {
    return <div className={"code " + displayClass(this)}>{this.props.data.source.join("")}</div>
 },
  render: function() { return (
    <div className="cell">
      <div className="cell-label">In [{this.props.index}]:</div>
        <div className="switch">
          {this.editor()}
          <div className="codewrap"> {this.code()} </div>
        </div>
      <div className="yields"><img src="yield-arrow.png" alt="yields" /></div>
      <div className="cell-label">Out[{this.props.index}]:</div>
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

$.get("waldo.ipynb",function(data) {
  iPython = data
  render()
}, "json")
