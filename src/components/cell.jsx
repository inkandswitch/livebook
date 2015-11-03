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

  enterEditMode() {
    var moveCursor  = requireGlobalDeps().moveCursor;

    var currentMode = requireGlobalDeps().getMode();
    var setMode     = requireGlobalDeps().setMode;

    // move cursor to the clicked cell
    var clickedCell = this.props.index;
    var cursorCell  = requireGlobalDeps().getCursorCell();
    var delta       = clickedCell - cursorCell;

    if (currentMode === "edit") {
      // enable cursor movement
      setMode("nav");
    }
    moveCursor(delta, {noScroll: true});
    // set mode to edit
    setMode("edit");      
  },

  subcell() {
    if (this.props.data.cell_type === "markdown") {
      return <MarkdownCell data={this.props.data} index={this.props.index}/>      
    }
    else {
      return <CodeCell data={this.props.data} index={this.props.index}/>      
    }
  },

  render() {
    var cursor = requireGlobalDeps().cursor;
    return <div className={cursor(this.props.index)} onClick={this.enterEditMode}> {this.subcell()} </div>
  },

});

module.exports = Cell;