var $         = require("jquery")
var React     = require("react")
var marked    = require("marked")
var AceEditor = require('react-ace');

var Mode = "nav";
var CursorCell = 0;
var iPython = { cells:[] }
var mountNode = document.getElementById('mount')
var cellHeights = []

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
    cellHeights[i] = cells[i].offsetHeight // or .clientHeight
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
    $('textarea.ace_text-input').focus();
    ace.edit("edit" + CursorCell).getSession().setUseWrapMode(true);
  }
}

$('body').keyup(function(e) {
  switch (e.which) {
    case 27: // esc
      setMode("nav");
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

var MarkdownCell = React.createClass({
  content: function() {
    if (this.props.index == CursorCell && Mode == "edit")
      return <AceEditor mode="markdown" height={cellHeights[this.props.index]} width="100%" value={this.props.data.source.join("")} cursorStart={-1} theme="github" onChange={onChangeFunc(this.props.index)} name={"edit" + this.props.index} editorProps={{$blockScrolling: true}} />
    else
      return <div dangerouslySetInnerHTML={rawMarkup(this.props.data.source)} />
  },
  render: function() {
    return <div className="cell switch"> {this.content()} </div>
  }
});

var CodeCell = React.createClass({
  code: function() {
    if (this.props.index == CursorCell && Mode == "edit")
      return <AceEditor mode="markdown" height={cellHeights[this.props.index]} width="100%" value={this.props.data.source.join("")} cursorStart={-1} theme="github" onChange={onChangeFunc(this.props.index)} name={"edit" + this.props.index} editorProps={{$blockScrolling: true}} />
    else
      return <div className="code">{this.props.data.source.join("")}</div>
  },
  html: function(data) { return (data && <div dangerouslySetInnerHTML={{__html: data.join("") }} />) },
  png:  function(data) { return (data && <img src={"data:image/png;base64," + data} />) },
  text: function(data) { return (data && data.join("\n")) },
  outputs:  function() { return (this.props.data.outputs.map((output) =>
      this.html(output.data["text/html"]) || this.png(output.data["image/png"]) || this.text(output.data["text/plain"])
  ))},
  render: function() { return (<div className="cell">
      <div className="cell-label">In [{this.props.index}]:</div>
        <div className="codewrap switch">
          {this.code()}
        </div>
      <div className="yields"><img src="yield-arrow.png" alt="yields" /></div>
      <div className="cell-label">Out[{this.props.index}]:</div>
        {this.outputs()}
      </div>)
  }
});

var Notebook = React.createClass({
  render: function() {
    var index = -1;
    var cells = this.props.data.cells.map(function(cell) {
      index += 1

      if (cell.cell_type == "markdown") {
        return  <div className={cursor(index)}>
                  <MarkdownCell data={cell} index={index}/>
                </div>
      } else {
        return  <div className={cursor(index)}>
                  <CodeCell data={cell} index={index}/>
                </div>
      }
    })
    return <div className="notebook">{cells}</div>
  },
})

$.get("waldo.ipynb",function(data) {
  iPython = data
  render()
}, "json")
