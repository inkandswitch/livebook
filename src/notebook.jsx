var $         = require("jquery")
var React     = require("react")
var marked    = require("marked")
var AceEditor = require('react-ace');

var Mode = "nav";
var CursorCell = 0;
var iPython = { cells:[] }
var mountNode = document.getElementById('mount')
var cellHeights = []

function render() {
  React.render(<Notebook data={iPython} />, mountNode);
  var cells = $(".cell")
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

var onChange = function(x) {
  console.log("change")
}

var MarkdownCell = React.createClass({
  onChangeFunc: function() {
    var i = this.props.index
    return function(e) {
      iPython.cells[i].source = e.split("\n").map( s => s + "\n")
    }
  },
  rawMarkup: function() {
    var raw = marked(this.props.data.source.join(""), {sanitize: true})
    return { __html: raw }
  },
  render: function() {
    if (this.props.index == CursorCell && Mode == "edit")
      var content = <AceEditor mode="markdown" height={cellHeights[this.props.index]} width="100%" value={this.props.data.source.join("")} cursorStart={-1} theme="github" onChange={this.onChangeFunc()} name={"edit" + this.props.index} editorProps={{$blockScrolling: true}} />
    else
      var content = <div dangerouslySetInnerHTML={this.rawMarkup()} />
    return (
      <div className="cell">
        {content}
      </div>)
  }
});

var CodeCell = React.createClass({
  render: function() {
    var outputs = this.props.data.outputs.map(function(output) {
      var html = output.data["text/html"]
      var text = output.data["text/plain"]
      var png  = output.data["image/png"]
      if (html) {
        var code = {__html: html.join("") }
        return <div dangerouslySetInnerHTML={code} />
      } else if (png) {
        var inline = "data:image/png;base64," + png
        return <img src={inline} />
      } else if (text) {
        var output = text.join("\n")
        if (output == "''") { // strange :-(
          return ""
        } else {
          return output
        }
      } else {
        return "UNKNOWN"
      }
    })
    return (<div className="cell">
      <div className="cell-label">In [{this.props.index}]:</div>
      <div className="codewrap">
        <div className="code">{this.props.data.source.join("")}</div>
      </div>
      <div className="yields"><img src="yield-arrow.png" alt="yields" /></div>
      <div className="cell-label">Out[{this.props.index}]:</div>
        {outputs}
      </div>)
  }
});

var Notebook = React.createClass({
  render: function() {
    var index = -1;
    var cells = this.props.data.cells.map(function(cell) {
      index += 1

      var klass = "";
      if (index == CursorCell)
        if (Mode == "nav")
          klass = "cursor";
        else
          klass = "cursor-edit";

      if (cell.cell_type == "markdown") {
        return  <div className={klass}>
                  <MarkdownCell data={cell} index={index}/>
                </div>
      } else {
        return  <div className={klass}>
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
