var $ = require("jquery")

function setup(notebook) {
  $('body').keydown(function(e) {
    if (notebook.getMode() === "edit") return;
    switch (e.which) {
      case 40:
        notebook.moveCursor(1);
        e.preventDefault()
        break;
      case 38:
        notebook.moveCursor(-1);
        e.preventDefault()
        break;
    }
  })


  $('body').keyup(function(evt) {
    var Mode       = notebook.getMode();
    var setMode    = notebook.setMode;
    var moveCursor = notebook.moveCursor;

    switch (evt.which) {
      case 27: // esc
        if (Mode === "edit") setMode("nav")
        else                 setMode("view")
        break;
    }
  });


  /**
   * [Global Deps]
   * `Mode`
   * `setMode`
   * `moveCursor`
   * `appendCell`
   * `deleteCell`
   */
  $('body').keypress(function(e) {
    var Mode       = notebook.getMode();

    if (Mode === "edit") return;

    var setMode    = notebook.setMode;
    var moveCursor = notebook.moveCursor;
    var appendCell = notebook.appendCell;
    var deleteCell = notebook.deleteCell;

    switch (e.which) {
      case 13:  //enter
        setMode("edit");
        break;
      case 107: //k
      case 113: //q
        moveCursor(-1);
        break;
      case 106: //j
      case 97:  //a
        moveCursor(1);
        break;
      case 99: //c
        appendCell('code');
        break;
      case 109: //m
        appendCell('markdown');
        break;
      case 120: //x
        deleteCell();
        break;
    }

    return false; // prevents default + bubbling
  });
}

module.exports = { setup: setup }
