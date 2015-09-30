var cursorCell = 0;

function moveCursor(delta) {
  var cells = $('.notebook .cell');
  var numCells = cells.size();

  var newCell = cursorCell + delta;
  if (newCell >= 0 && newCell < numCells) {
    cursorCell = newCell;

    var cell = $(cells[cursorCell]);

    var cursor = $('#cursor');
    var height = parseInt(cell.css('height'));

    cursor.detach();
    cell.append(cursor);
    cursor.css('height', '' + (height+10) + 'px');

    var addbar = $('#addbar');
    addbar.css('margin-top', '' + (height+0) + 'px');

    $('body').animate({ scrollTop: cursor.offset().top - 80 });
  }
}

$(document).ready(function() {
  $('#cursor').hide(); // remove later 

  moveCursor(0);

  $('body').keypress(function(e) {
    switch (e.which) {
      case 113:
        moveCursor(-1);
        break;
      case 97:
        moveCursor(1);
        break;
    }
    e.preventDefault();
  });

  var mountNode = document.getElementById('mount')

  var MarkdownCell = React.createClass({
    rawMarkup: function() {
      var raw = marked(this.props.data.source.join(""), {sanitize: true})
      return { __html: raw }
    },
    render: function() {
      return <div className="cell" dangerouslySetInnerHTML={this.rawMarkup()} />
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
      console.log(this.props.data)
      var index = -1;
      var cells = this.props.data.cells.map(function(cell) {
        index += 1
        if (cell.cell_type == "markdown") {
          return <MarkdownCell data={cell} />
        } else { 
          return <CodeCell data={cell} index={index}/>
        }
      })
      return <div className="notebook">{cells}</div>
    },
  })

  jQuery.get("waldo.ipynb",function(data) {
    React.render(<Notebook data={data} />, mountNode);
  }, "json")
});
