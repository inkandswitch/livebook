var $         = require("jquery")
var React     = require("react")
var marked    = require("marked")
var AceEditor = require('react-ace');

var mode = "nav";
var cursorCell = 2;

function render() {
  React.render(<Notebook data={iPython} />, mountNode);
}

function moveCursor(delta) {
//  var cells = $('.notebook .cell');
//  var numCells = cells.size();
//  var numCells = 10;
  if (cursorCell + delta >= iPython.cells.length || cursorCell + delta < 0) return;
  cursorCell = cursorCell + delta;
  render()

//  var newCell = cursorCell + delta;
//  if (newCell >= 0 && newCell < numCells) {
//    cursorCell = newCell;
/*
    var cell = $(cells[cursorCell]);

    var cursor = $('#cursor');
    var height = parseInt(cell.css('height'));

    cursor.detach();
    cell.append(cursor);
    cursor.css('height', '' + (height+10) + 'px');

    var addbar = $('#addbar');
    addbar.css('margin-top', '' + (height+0) + 'px');

    $('body').animate({ scrollTop: cursor.offset().top - 80 });
*/
 // }
}

function setMode(m) {
  mode = m;
  render();
}

$('body').keypress(function(e) {
  switch (e.which) {
    case 101:
      setMode("edit");
      break;
    case 96:
      setMode("nav");
      break;
    case 113:
      console.log("up=",e)
      moveCursor(-1);
      break;
    case 97:
      console.log("down=",e)
      moveCursor(1);
      break;
  }
  e.preventDefault();
});

var mountNode = document.getElementById('mount')

var onChange = function(x) {
  console.log("change")
}

var iii = 0
var MarkdownCell = React.createClass({
  rawMarkup: function() {
    var raw = marked(this.props.data.source.join(""), {sanitize: true})
    return { __html: raw }
  },
  render: function() {
    iii = iii + 1
    var editor = <AceEditor mode="markdown" width="100%" value={this.props.data.source.join("\n")} theme="github" onChange={onChange} name={"edit" + iii} editorProps={{$blockScrolling: true}} />
    var klass = "cursor"
    var content = <div className="cell" dangerouslySetInnerHTML={this.rawMarkup()} />
    if (this.props.index != cursorCell) {
      klass = "";
      editor = ""
    } else if (mode == "edit") {
      content = ""
    } else {
      editor = ""
    }
    return (
      <div>
        <div className={klass}>
          {content}
          {editor}
        </div>
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
    var klass = "cursor"
    if (this.props.index != cursorCell) klass = "";
    return (<div className="cell">
      <div className={klass}>
      <div className="cell-label">In [{this.props.index}]:</div>
      <div className="codewrap">
        <div className="code">{this.props.data.source.join("")}</div>
      </div>
      <div className="yields"><img src="yield-arrow.png" alt="yields" /></div>
      <div className="cell-label">Out[{this.props.index}]:</div>
        {outputs}
      </div>)
      </div>)
  }
});

var Notebook = React.createClass({
  render: function() {
    console.log(this.props.data)
    var index = -1;
    var cells = this.props.data.cells.map(function(cell) {
      index += 1

      if (cell.cell_type == "markdown") {
        return <MarkdownCell data={cell} index={index}/>
      } else {
        return <CodeCell data={cell} index={index}/>
      }
    })
    return <div className="notebook">{cells}</div>
  },
})

var iPython = {}
$.get("waldo.ipynb",function(data) {
  iPython = data
  render()
  moveCursor(0);
}, "json")
