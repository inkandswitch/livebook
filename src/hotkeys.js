var $ = require("jquery")

function requireGlobalDeps() {
  return require("./notebook.jsx");
}

/**
 * [Global Deps]
 * `Mode`
 * `setMode`
 * `moveCursor`
 */
$('body').keyup(function(evt) {
  var Mode       = requireGlobalDeps().getMode();
  var setMode    = requireGlobalDeps().setMode;
  var moveCursor = requireGlobalDeps().moveCursor;

  switch (evt.which) {
    case 27: // esc
      if (Mode === "edit") setMode("nav")
      else                 setMode("view")
      break;
    case 38: // up
      if (Mode === "edit") break;
      moveCursor(-1);
      break;
    case 40: // down
      if (Mode === "edit") break;
      moveCursor(1);
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
  var deps       = requireGlobalDeps();
  var Mode       = deps.getMode();

  if (Mode === "edit") return;

  var setMode    = deps.setMode;
  var moveCursor = deps.moveCursor;
  var appendCell = deps.appendCell;
  var deleteCell = deps.deleteCell;

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
