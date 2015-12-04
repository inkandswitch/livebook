var $ = require("jquery");
var React = require("react");

var CodeCell     = require("./code-cell.jsx");
var MarkdownCell = require("./markdown-cell.jsx");

function cursor(mode, cursor_cell, i) {
  if (i != cursor_cell) return ""
  if (mode == "view" || mode === "meta")  return ""
  if (mode == "nav")   return "cursor"
  if (mode == "edit")  return "cursor-edit"
  else                 throw  new Error("Invalid mode: " + mode);
}

var EditIcon = React.createClass({

  componentDidMount() {
    let element = this.refs.editIconSVG;
    if (!element) return;
    element.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    element.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    element.setAttribute("enable-background", "new 0 0 100 100");
  },

  render() {

    let pathFill = this.props.color;
    return (
      <svg height="50%" refs="editIconSVG" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" xmlSpace="preserve">
        <path 
            fill={pathFill} 
            d="M88,19.7L80.3,12c-1.3-1.3-3.1-2-4.9-2c-1.9,0-3.6,0.7-4.9,2l-3.8,3.8c0,0,0,0,0,0L26.4,56.1  c-0.1,0.1-0.2,0.2-0.2,0.3c0,0,0,0.1-0.1,0.1c-0.1,0.1-0.1,0.2-0.2,0.3c0,0,0,0,0,0.1c0,0.1,0,0.1-0.1,0.2l-5.5,20.1  c-0.2,0.7,0,1.5,0.5,2c0.4,0.4,0.9,0.6,1.5,0.6c0.2,0,0.4,0,0.5-0.1L43,74.1c0.1,0,0.1,0,0.2-0.1c0,0,0,0,0.1,0  c0.1,0,0.2-0.1,0.3-0.2c0,0,0.1,0,0.1-0.1c0.1-0.1,0.2-0.1,0.3-0.2l40.2-40.2l3.8-3.8C90.7,26.9,90.7,22.4,88,19.7z M30,73.4  L26.6,70l2.3-8.5l9.6,9.6L30,73.4z M30.8,57.5l37.3-37.3l1,1l3.4,3.4L35.2,61.9L30.8,57.5z M42.5,69.2l-4.4-4.4l37.3-37.3l4.4,4.4  L42.5,69.2z M85,26.7L82.7,29L71,17.3l2.4-2.4c0.5-0.5,1.2-0.8,2-0.8c0.8,0,1.5,0.3,2,0.8l7.7,7.7C86.1,23.8,86.1,25.6,85,26.7z   M79.2,47.1c-1.1,0-2.1,0.9-2.1,2.1v33.6c0,1.7-1.4,3.1-3.1,3.1H17.2c-1.7,0-3.1-1.4-3.1-3.1V25.9c0-1.7,1.4-3.1,3.1-3.1h33.6  c1.1,0,2.1-0.9,2.1-2.1s-0.9-2.1-2.1-2.1H17.2c-4,0-7.2,3.2-7.2,7.2v56.8c0,4,3.2,7.2,7.2,7.2h56.8c4,0,7.2-3.2,7.2-7.2V49.2  C81.3,48.1,80.4,47.1,79.2,47.1z"></path>
      </svg>
    );
  },
});

var PeerEditOverlay = React.createClass({
  render() {
    let overlayStyles = {
      background: "hsla(0, 0%, 100%, .7)",
      height: "100%",
      position: "absolute",
      textAlign: "center",
      top: 0,
      width: "100%",
    };

    // let messageStyles = {
    //   position: 
    // };

    return (
      <div style={overlayStyles}>
          <EditIcon color={this.props.peerColor} />
          <p style={ {textAlign: "center",} }>
            <i><b>{this.props.peerName}</b> is editing...</i>
          </p>
      </div>
    );
  },
})

var Cursor = React.createClass({

  cursorWidth() {
    return 10;
  },

  calculateLeftOffset() {
    let marginFromCell = 6;
    let marginBetweenCursors = 2;

    let leftOffset = -1 * this.cursorWidth() * this.props.index;
    leftOffset -= marginBetweenCursors * this.props.index;
    leftOffset -= marginFromCell;

    if (this.isEditing() && this.isCurrentUserCursor()) {
      leftOffset += marginFromCell;
    }

    return leftOffset;
  },

  isCurrentUserCursor() {
    let isCurrentUserCell = this.props.getCurrentUserCursorCell() === this.props.cellIndex;
    let isCursorFirst = this.props.index === 1;
    return isCurrentUserCell && isCursorFirst;
  },

  isEditing() {
    return this.props.getMode() === "edit";
  },

  render() {
    let style = {
      background:  this.props.color, // originally "#2A64C7",
      left: this.calculateLeftOffset(),
      position: "absolute",
      height: "100%",
      width: this.cursorWidth(),
    };

    if (this.isEditing() && this.isCurrentUserCursor()) {
      style.boxShadow = "-1px 0 1px 0 rgba(170, 170, 170, .72)";
    }

    if (this.props.isHidden) {
      style.display = "none";
    }

    if (this.isCurrentUserCursor()) {
      return (
        <div className="cursor" data-current-user-cursor style={style} />
      );      
    }

    return (
      <div className="cursor" style={style} />
    );
  }
});

var Cell = React.createClass({

  enterEditMode() {
    var moveCursor  = this.props.notebook.moveCursor;

    var currentMode = this.props.notebook.getMode();
    var setMode     = this.props.notebook.setMode;

    // move cursor to the clicked cell
    var clickedCell = this.props.index;
    var cursorCell  = this.props.notebook.getCursorCell();
    var delta       = clickedCell - cursorCell;

    if (currentMode === "edit") {
      // enable cursor movement
      setMode("nav");
    }

    moveCursor(delta, {noScroll: true});
    // set mode to edit
    setMode("edit");

  },

  peerEditorColor() {
    return this.props.peerEditor.state.color;
  },

  peerEditorName() {
    return this.props.peerEditor.user.name;
  },

  isBeingEdited() {
    return !!this.props.peerEditor;
  },

  getCursors() {
    let cursorClass = cursor(this.props.mode, this.props.cursor, this.props.index);
    let hasCursor = cursorClass === "cursor";
    let cursors = this.props.cursors.map((cursor, i) => {
      return (
        <Cursor key={i} isHidden={false} 
          index={i+1} color={cursor.color} 
          isCurrentUser={i === 0} 
          getMode={this.props.notebook.getMode}
          getCurrentUserCursorCell={this.props.notebook.getCursorCell}
          cellIndex={this.props.index} />
      );
    });

    return cursors;
  },

  getOverlay() {
    if (this.isBeingEdited()) {
      let peerColor = this.peerEditorColor();
      let peerName = this.peerEditorName();
      // debugger;
      return (
        <PeerEditOverlay peerColor={peerColor} peerName={peerName} />
      );
    }
    return (<div style={ {display: "none", } }/>); // fixme
  },

  subcell() {
    if (this.props.data.cell_type === "markdown") {
      return <MarkdownCell data={this.props.data} notebook={this.props.notebook} index={this.props.index}/>      
    }
    else {
      return <CodeCell data={this.props.data} notebook={this.props.notebook} cursor={this.props.cursor} typing={this.props.typing} index={this.props.index} errorObject={this.props.errorObject}/>
    }
  },

  render() {
    let styles = {
      position: "relative",
    };
    let cursors = this.getCursors();
    let subCell = this.subcell();
    let overlay = this.getOverlay();
    return (
      <div className="cell-wrap" onClick={this.enterEditMode} style={styles}>
        {cursors}
        {subCell}
        {overlay}
      </div>
    );
  },

});

module.exports = Cell;
