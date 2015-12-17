var $ = require("jquery")

function setup(notebook) {
  $('body').keydown(function(e) {
    var setMode    = notebook.setMode;
    switch (e.which) {
      case 13:  //enter
        if (notebook.getMode() === "meta") return;
        if (notebook.getMode() === "edit") return;
        setMode("edit");
        e.preventDefault()
        break;
      case 40: // down arrow
        if (notebook.getMode() === "meta") return;
        if (notebook.getMode() === "edit") return;
        notebook.moveCursor(1);
        e.preventDefault()
        break;
      case 38: // up arrow
        if (notebook.getMode() === "meta") return;
        if (notebook.getMode() === "edit") return;
        notebook.moveCursor(-1);
        e.preventDefault()
        break;
    }
    return true
  })


  $('body').keyup(function(evt) {
    var Mode       = notebook.getMode();
    var setMode    = notebook.setMode;
    var moveCursor = notebook.moveCursor;

    switch (evt.which) {
      case 27: // esc
        if (Mode === "meta") return;
        if (Mode === "edit") setMode("nav")
        else                 setMode("view")
        break;
    }
    return true
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

    if (Mode === "meta") return;
    if (Mode === "edit") return;

    var setMode    = notebook.setMode;
    var moveCursor = notebook.moveCursor;
    var appendCell = notebook.appendCell;
    var deleteCell = notebook.deleteCell;

    switch (e.which) {
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

    //return false; // prevents default + bubbling
    return true // why did we do that?  cant CMD-Reload in firefox
  });
}

module.exports = { setup: () => {} }
