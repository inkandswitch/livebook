var React = require("react");

var CodeCell     = require("./code-cell.jsx");
var MarkdownCell = require("./markdown-cell.jsx");

function requireGlobalDeps() {
  return require("../notebook.jsx");
}

/**
 * [Global Deps]
 * `cursor`
 */
var Cell = React.createClass({

  subcell() {
    if (this.props.data.cell_type === "markdown")
      return <MarkdownCell data={this.props.data} index={this.props.index}/>
    else
      return <CodeCell data={this.props.data} index={this.props.index}/>
  },

  render() {
    var cursor = requireGlobalDeps().cursor;
    return <div className={cursor(this.props.index)}> {this.subcell()} </div>
  },

});

module.exports = Cell;