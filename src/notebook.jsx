/**
 * [Global State]
 * `Mode`
 * `$cell`
 * `CurrentCursor`
 * `ERROR_MARKER_IDS`
 * `ERROR_CELL_CLASSNAME`
 */

var $          = require("jquery")
var ace        = require("brace")
var Range      = ace.acequire('ace/range').Range;
var React      = require("react")
var AceEditor  = require("react-ace");

var cradle     = require("./cradle");

var Sk         = require("./skulpt");
var pyload     = require("./pyload");


var WORKER     = new Worker("/js/worker.js");
WORKER.postMessage("TEST MESSAGE")
WORKER.onmessage = function(e) {
  // console.log("Got message from the worker:",e.data)
}

var charts = require("./charts");  // Assigns the charts

// Utils
var asyncRunParallel = require("./util").asyncRunParallel;
var deepClone        = require("./util").deepClone;
var noop             = require("./util").noop;
var randomColor      = require("./util").randomColor;
var resultToHtml     = require("./util").resultToHtml;
var zip              = require("./util").zip;

var LAST_TYPE = new Date()
var TYPING_SPAN = 500
function typing(when) { return when - LAST_TYPE < TYPING_SPAN }

var ERRORS = {
  // expects this format:
  //
  // cellId: { cell: x, line: y, message: "hey"},
};

var ERROR_MARKER_IDS = []; // keeps track of the marker ids so we can remove them with `editor.getSession().removeMarker(id)`
function REMOVE_ERRORS() {
  REMOVE_MARKERS();
  CLEAR_ERROR_MESSAGES();
}
function REMOVE_MARKERS() {
  ERROR_MARKER_IDS.forEach((id) => {
    editor.getSession().removeMarker(id);
  });
  ERROR_MARKER_IDS = []
}
function CLEAR_ERROR_MESSAGES() {
  ERRORS = {};
  // $("[data-cell-index]").find(".js-pyresult-error").hide().text("");
}

cradle.onarrive = function() {
  update_peers_and_render();
  cradle.broadcast({ cursor: CursorCell });
}
cradle.ondepart = update_peers_and_render;
cradle.onupdate = update_peers_and_render;
cradle.onusergram = function() {
  console.log("on usergram")
  update_peers_and_render();
}
/**
 * [Global Deps]
 * `cradle`
 * `collaboratorsMount`
 */

function update_peers_and_render() {
  let peers = cradle.peers()
  peers[0].cursor = CursorCell // hack since I dont know - FIXME
  console.log("Peers", peers)
  React.render(<Collaborators peers={peers} setMode={setMode} getMode={() => Mode} />, collaboratorsMount);

  let cursorPositions = peers.map((peer) => {
    let cursorPosition = peer.cursor === undefined ? 0 : peer.cursor; // FIXME
    return {
      position: cursorPosition,
      color: peer.color,
    };
  });

  let render_time = new Date();
  React.render(<Notebook peerCursorCells={cursorPositions} data={iPython} typing={typing(render_time)}/>, notebookMount);
}

ace.config.set("basePath", "/");

var theData = null;
/**
 * [Global Deps]
 * `theData` - CSV data that has been loaded.
 */

Sk.builtins["__load_data__"] = function(name,metadata) {
  if (metadata && metadata != theMetadata) {
  }
  if (theData) return theData;
  throw new Error("No CSV data loaded (2)");
}

var Pages = [ "notebook", "upload" ];
var CurrentPage = "notebook";

// these three lines came from skulpt repl.js codebase
var importre = new RegExp("\\s*import")
var defre = new RegExp("def.*|class.*")
var assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
var keyword = /^(assert|pass|del|print|return|yield|raise|break|continue|import|global|exec)/
var indent = /^\s+/

/**
 * Custom file loader for Skulpt
 * [Global Deps]
 * `Sk`
 */
function pyLoad(x) {
  if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
    throw new Error("File not found: '" + x + "'");
  }
  return Sk.builtinFiles["files"][x];
}

// BOOTS ???
var $cell = undefined;

/**
 * ??? No idea when this is called
 *
 * [Global Deps]
 * `Sk`
 * `$cell` - javascript equivalent of `cell` (presumably python code)
 */
function python_mark(cell) {
  $cell = Sk.ffi.remapToJs(cell)
}

/**
 * [Global Deps]
 * `Sk`
 * `$cell`   - Index of the current cell
 * `iPython` - Object that is stringified into .ipynb file
 */
function python_render(result) {
  if (result === undefined) return;
  var text;
  var html;
  // Duck type result... if it has `to_js` method, proceed
  if (result.to_js) {
    let $method = Sk.abstr.gattr(result, 'to_js', true)
    let $result = Sk.misceval.callsimOrSuspend($method)
    html = resultToHtml(Sk.ffi.remapToJs($result))
  } else {
    text = String(Sk.ffi.remapToJs(result)) + "\n";
  }

  if (html) {
    iPython.cells[$cell].outputs = [
      {
       "data": {
         "text/html": [ html ]
       },
       "execution_count": 1,
       "metadata": {},
       "output_type": "execute_result"
      },
    ]
  } else {
    iPython.cells[$cell].outputs = [
      {
       "data": {
         "text/plain": [text]
       },
       "execution_count": 1,
       "metadata": {},
       "output_type": "execute_result"
      }
    ]
  }
}

Sk.builtins["mark"] = python_mark
Sk.builtins["render"] = python_render
Sk.configure({
  output: text => { console.log("STDOUT:",text) },
  read: pyLoad,
});

// All The Globals
var Mode = "view";
var CursorCell = 0;
var DataRaw = ""
var iPythonRaw = ""
var iPython = { cells:[] }

// React mount points
var notebookMount      = document.getElementById('notebook')
var editorMount        = document.getElementById('editor')
var menuMount          = document.getElementById('menu')
var collaboratorsMount = document.getElementById('collaborators')

// Editor
var editor       = {}
function useEditor(cell) {
  return (cell.props.index === CursorCell && Mode === "edit")
}
function editorClass(cell)  {
  return !useEditor(cell) ? "hidden" : "";
}
function displayClass(cell) {
  return  useEditor(cell) ? "hidden" : "";
}

/**
 * [Global Deps]
 * `iPython`
 * `python_eval` -
 */
function onChangeFunc(i) { // i is the CursorCell
  var timeout
  return e => {
    LAST_TYPE = new Date()
    if (timeout) { clearTimeout(timeout) }
    timeout = setTimeout(() => {
      var lines = e.split("\n");
      var newSource = lines.map((s, i) => {
          return (i !== lines.length -1) ? s + "\n" : s; // don't add a trailing newline to last line
      })
      iPython.cells[i].source = newSource;
      if (iPython.cells[i].cell_type === "code") {
        // should we clear error lines here?
        // once evaluation continues past erroneous cell, this approach should work
        // otherwise, let's switch to only clearing error message for current cell
        CLEAR_ERROR_MESSAGES();
        let render_time = python_eval()
        if (typing(render_time)) {
          timeout = setTimeout(render,new Date() - LAST_TYPE)
        }
      }
      timeout = undefined
    },300)
    render()
//    if (iPython.cells[i].cell_type === "markdown") render();
  }
}

/**
 * [Global Deps]
 * `Mode`
 * `CursorCell`
 * `AceEditor`
 * `React`
 * `$`
 * `onChangeFunc`
 * `cellPosition`
 * `editorMount`
 * `editor`
 * `python_eval`
 */
function renderEditor() {
  if (Mode !== "edit") {
    $("#editX").hide();
    return;
  }
  // BOOTS TODO
  // - use `let`
  var height = getEditorHeight();
  var width  = getEditorWidth();
  var lang   = iPython.cells[CursorCell].cell_type === "code" ? "python" : "markdown";
  var value  = iPython.cells[CursorCell].source.join("");
  var change = onChangeFunc(CursorCell)
  var onBeforeLoad = noop;

  // BOOTS TODO
  // - write a convenience method for this
  var editorOptions = {
    lang: lang,
    height: height,
    width: width,
    value: value,
    change: change,
    onBeforeLoad: onBeforeLoad,
    onLoad: () => { if (editor && editor.moveCursorTo) editor.moveCursorTo(0, 0) },
  };

  React.render(createAceEditor(editorOptions), editorMount);

  // Position editor
  var pos = cellPosition();
  $("#editX")
    .css("top", pos.top)
    .css("left", pos.left)
    .show();

  editor = ace.edit("editX")
  editor.focus()
  editor.moveCursorTo(0, 0);
  editor.getSession().setUseWrapMode(true);

  // TEMP for testing
  global.EDITOR = editor;
  REMOVE_MARKERS();

  // TODO if type==code?
  python_eval()
}

function createAceEditor(options) {
  options = Object.assign({}, options);
  var lang = options.lang,
      height = options.height,
      width = options.width,
      value = options.value,
      change = options.change,
      onBeforeLoad = options.onBeforeLoad,
      onLoad = options.onLoad;

  return (
    <AceEditor className="editor" name="editX"
      mode={lang} value={value}
      height={height} width={width}
      theme="github" onChange={change}
      showGutter={false}
      editorProps={{$blockScrolling: true,}}
      onBeforeLoad={onBeforeLoad} onLoad = {onLoad}/>
  );
}

function getEditorHeight() {
  var offsetHeight = $(".switch")[CursorCell].offsetHeight;
  return offsetHeight;
}

function getEditorWidth() {
  var mySwitch = $(".switch")[CursorCell];
  var width = $(mySwitch).width() - 15;
  return Math.floor(width);
}

/**
 * [Global Deps]
 * `CursorCell`
 * `$`
 */
function cellPosition() {
  var bodyRect = document.body.getBoundingClientRect()
  var elemRect = $(".switch")[CursorCell].getBoundingClientRect()
  var t        = Math.round(elemRect.top  - bodyRect.top) + 2 + "px";
  var l        = Math.round(elemRect.left - bodyRect.left) + 3 + "px";
  return {
    top: t,
    left: l,
  };
}

/**
 * Rerenders compondents
 *
 * [Global Deps]
 * `iPython`
 * `notebookMount`
 * `menuMount`
 * `collaboratorsMount`
 * `setup_drag_drop`
 */
function render() {
  let render_time = new Date()
  React.render(<Menu notebook={exports}/>, menuMount);
  update_peers_and_render()
  setup_drag_drop()
  return render_time
}

// BOOTS ??? !!! (on the next many functions)
// - all these calls to render() are a huge smell
/**
 * [Global Deps]
 * `Mode`
 * `setMode`
 * `iPython`
 * `CursorCell`
 * `render`
 *
 */
function moveCursor(delta, options) {
  options = Object.assign({}, options);
  if (Mode === "edit") return;
  if (Mode === "view") { setMode("nav"); return }

  var newCursor = CursorCell + delta;
  if (newCursor >= iPython.cells.length || newCursor < 0) {
    return;
  }
  CursorCell = newCursor;
  render();

  // allows us to disable auto scrolling on the click events
  if (!options.noScroll) {
    // FIX
    let $currentUserCursor = $('[data-current-user-cursor]');
    let $currenUserCellWrap = $currentUserCursor.parents(".cell-wrap");
    $('body').animate({ scrollTop: $currenUserCellWrap.offset().top - 80 });
  }

  cradle.broadcast({ cursor: CursorCell })
}

/**
 * [Global Deps]
 * `iPython`
 * `render`
 * `CursorCell`
 * `setMode`
 */
function appendCell(type) {
  var cell = '';

  if (type === "code")
    cell = ({
       "cell_type": "code",
       "execution_count": 1,
       "metadata": { "collapsed": false },
       "outputs": [
          {
           "data": {
            "text/plain": [ "(waiting)" ]
           },
           "execution_count": 1,
           "metadata": {},
           "output_type": "execute_result"
         }
       ],
       "source": [ "" ]
    });
  else if (type === "markdown")
    cell = ({
       "cell_type": "markdown",
       "metadata": {},
       "source": [ "type some markdown" ]
    });
  else {
    console.log("bad cell type " + type);
    return;
  }

  iPython.cells.splice(CursorCell+1, 0, cell);
  CursorCell += 1;

  render();
  setMode("edit");
}

/**
 * [Global Deps]
 * `iPython`
 * `render`
 * `CursorCell`
 * `setMode`
 */
function deleteCell() {
  console.log('delete');
  iPython.cells.splice(CursorCell, 1);

  if (CursorCell > 0)
    CursorCell -= 1;

  CursorCell = Math.min(CursorCell, iPython.cells.length-1);

  render();
}

/**
 * [Global Deps]
 * `iPython`
 * `iPythonRaw`
 */
function save_notebook() {
  if (document.location ===  "/") {
    // Stops 404 that results from posting to `/.json` on the starter page
    return;
  }
  console.log("Saving notebook...");
  iPythonRaw = JSON.stringify(iPython);
  var data = {
    name: "Hello",
    notebook: {
      name: "NotebookName",
      body: iPythonRaw,
    },
  };
  $.ajax({
    method: "PUT",
    url: document.location + ".json",
    data: JSON.stringify(data),
    complete: function(response, status) {
      console.log("save response", response);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      // TODO handle errors
      console.log("Saving notebook failed:", textStatus);
    },
  });
};

/**
 * [Global Deps]
 * `Mode`
 * `CODE`
 * `save_notebook`
 */
function setMode(m) {
  if (Mode === m) return false;
  var old = Mode;
  Mode = m;
  switch (m) {
    case "edit":
      CODE.cache(CursorCell);
      break;
    case "nav":
      if (old === "edit") save_notebook();
      CODE.clear(CursorCell)
      break;
    default:
      CODE.clear(CursorCell);
  }
  renderEditor();
  render()
  return true
}

/**
 * [Global Deps]
 * `Pages`
 * `CurrentPage`
 * `render`
 */
function setCurrentPage(page) {
  if (!Pages.includes(page)) {
    console.log("Error: '" + page + "' is not a valid page");
    return;
  }

  CurrentPage = page;
  render()
}

// BOOTS ??? !!!
// - router stuff
/**
 * [Global Deps]
 * `setCurrentPage`
 */
window.onpopstate = function(event) {
  var path = document.location.pathname;
  if (path === "/upload")
    setCurrentPage("upload")
  else
    setCurrentPage("notebook")
}

/**
 * [Global Deps]
 * `iPython`
 * `editor`
 * `assignment`
 * `defre`
 * `importre`
 * `indent`
 * `Sk`
 * `handle_error`
 * `render`
 */
function python_eval() {
  REMOVE_MARKERS()
  var keepgoing = true
  var badcells  = []
  setTimeout(() => { keepgoing = false }, 500)
  do {
    var code_ctx = generate_python_ctx(badcells)
    var badcell  = execute_python_ctx(code_ctx)
    badcells.push(badcell)
  } while(keepgoing && badcell >= 0)
  return render()
}

var assignment2 = /^[.a-zA-Z0-9_"\[\]]*\s*=\s*/;
function assignment_test(line) {
  var a = assignment.test(line)
  var b = assignment2.test(line)
  return a || b
}

function generate_python_ctx(badcells) {
  var lines = [];
  var lineno = 0;
  var lineno_map = {}; // keeps track of line number on which to print error
  iPython.cells.forEach((c, i) => {
    if (badcells.indexOf(i) >= 0) return;

    if (c.cell_type == "code") {

      lines.push("mark("+i+")")
      lineno += 1

      c.source.forEach((line,line_number) => {
        if (!line.match(/^\s*$/) &&
            !line.match(/^\s*%/)) {  // skip directive like "%matplotlib inline" that skulpt doesn't parse
          lineno += 1
          lineno_map[lineno] = { cell: i, line: line_number }
          lines.push(line.replace(/[\r\n]$/,""))
        }
      })
      var line = lines.pop()
      if (!keyword.test(line) && !assignment_test(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
        lines.push("render(" + line + ")   ## line " + lineno)
      } else {
        lineno += 1
        lines.push(line)
        lines.push("render(None)    ## line " + lineno)
      }
    }
  })
  lines.push("")
  return { map: lineno_map, code: lines.join("\n"), length: lines.length }
}

function execute_python_ctx(ctx) {
  if (ctx.length > 1) {
    try {
      // console.log("CODE",ctx.code)
      Sk.importMainWithBody("<stdin>", false, ctx.code)
    } catch (e) {
      return handle_error(ctx.map,e)
    }
  }
  return -1
}

/**
 * [Global Deps]
 * `CursorCell`
 * `editor`
 * `Sk`
 */
function handle_error(lineno_map, e) {
  e.traceback.forEach((s) => { console.log("err line-no in " + s.filename + " line " + s.lineno) })
  var stack = e.traceback.pop()
  var err_at = lineno_map[stack.lineno] || lineno_map[stack.lineno - 1] || {cell: CursorCell, line:1}
  var msg = Sk.ffi.remapToJs(e.args)[0];
  var markerId;

  iPython.cells[err_at.cell].outputs = []

  if (err_at.cell === CursorCell) {
    if (editor && editor.getSession()) {
      markerId = editor
        .getSession()
        .addMarker(new Range(err_at.line, 0, err_at.line, 1), "ace_error-marker", "fullLine");

      ERROR_MARKER_IDS.push(markerId); // keeps track of the marker ids so we can remove them with `editor.getSession().removeMarker(id)`
    }
  }

  ERRORS[err_at.cell] = Object.assign({message: msg}, err_at);
  return err_at.cell
}

/**
 * [Global Deps]
 * `iPython`
 */
// this is to cache the code being edited so the pane does not update under the editor
var CODE = {
  cache: (i) => CODE[i] = iPython.cells[i].source.join("") + " ",
  clear: (i) => delete CODE[i],
  read:  (i) => CODE[i] || iPython.cells[i].source.join(""),
}

var Menu = require("./components/menu.jsx");
var Collaborators = require("./components/collaborators.jsx");
var Cell = require("./components/cell.jsx");
var Uploader = require("./components/uploader.jsx");

var Notebook = React.createClass({
  cells: function() {
    return this.props.data.cells.map((cell, index) => {

      var errorObject = ERRORS[index];

      var cursorCells = this.props.peerCursorCells.filter((cursorCell) => { return cursorCell.position === index; });

      return (
        <Cell data={cell} 
          notebook={exports} 
          mode={Mode} 
          cellIndex={index} 
          cursor={CursorCell}
          cursors={cursorCells}
          typing={this.props.typing} key={index} index={index} errorObject={errorObject}/>
      );
    }) // `key` prop stops React warnings in the console
  },

  render: function() {
    switch (CurrentPage) {
      case "upload":
        return <div className="notebook"><Uploader /></div>
      case "notebook":
        return <div className="notebook">{this.cells()}</div>
    }
  },
})


/**
 * [Global Deps]
 * `iPython`
 * `iPythonRaw`
 * `d3`
 * `DataRaw`
 * `theData`
 */
function parse_raw_notebook() {
  iPython = JSON.parse(iPythonRaw)
  iPython.cells.forEach(cell => cell.outputs = [])
  var head = undefined
  var body = {}
  var length = 0
  d3.csv.parseRows(DataRaw,(row) => {
    if (!head) {
      head = row;
      head.forEach((h) => body[h] = [])
    } else {
      length++;
      row.forEach((d,i) => body[head[i]].push(+d || d)) // BOOTS TODO - this will short-circuit on '0'
    }
  })
  theData = Sk.ffi.remapToPy({ head: head, body: body, length: length })
}

// BOOTS TODO
// - put in separate file
/**
 * [Global Deps]
 * `iPythonRaw`
 * `d3`
 * `DataRaw`
 */
function post_notebook_to_server() {
  var doc = JSON.stringify({name: "Hello", notebook: { name: "NotebookName", body: iPythonRaw } , datafile: { name: "DataName", body: DataRaw }})
  $.post("/d/", doc, function(response) {
    window.history.pushState({}, "Notebook", response);
    cradle.join(document.location + ".rtc")
  })
}

// BOOTS TODO
// - separate into another file
// - pass iPython
/**
 * [Global Deps]
 * `iPythonRaw`
 * `DataRaw`
 * post_notebook_to_server
 * parse_raw_notebook
 * setCurrentPage
 */
function setup_drag_drop() {
  var upload = document.getElementById('notebook')
  upload.ondrop = function(e) {
    $('#upload').removeClass('hover');
    e.stopPropagation();
    e.preventDefault();
    var is_notebook = /[.]ipynb$/
    var is_csv = /[.]csv$/
    var files = e.dataTransfer.files
    if (files.length != 2) {
      alert("You must drop 2 files!")
      return
    }
    if (!(is_notebook.test(files[0].name) || is_notebook.test(files[1].name))) {
      alert("one of the dropped files must be an ipynb")
      return
    }
    if (!(is_csv.test(files[0].name) || is_csv.test(files[1].name))) {
      alert("one of the dropped files must be a csv")
      return
    }
    var notebook_loaded = false
    var csv_loaded      = false

    for (var i = 0; i < files.length; i++) {
      let file = files[i]
      let reader = new FileReader();
      reader.onload = function(e2) {
        if (is_notebook.test(file.name)) {
          iPythonRaw= e2.target.result;
          notebook_loaded = true

          document.title = file.name.slice(0, -6) + " notebook"
        } else {
          DataRaw = e2.target.result;
          csv_loaded = true
        }
        if (notebook_loaded && csv_loaded) {
          post_notebook_to_server()
          parse_raw_notebook()
          setCurrentPage("notebook")
          initializeEditor();
        }
      }
      reader.readAsText(file);
    }
  }
  upload.ondragover = function(e) {
    $('#upload').addClass('hover');
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
}

function initializeEditor() {
  setMode("nav");
  moveCursor(0);
  python_eval(); // draws charts
}

var exports =  {
  appendCell             : appendCell,
  deleteCell             : deleteCell,
  displayClass           : displayClass,
  get$cell               : () => $cell,
  getCODE                : () => CODE,
  getCursorCell          : () => CursorCell,
  getEditor              : () => editor,
  getiPython             : () => iPython,
  getMode                : () => Mode,
  moveCursor             : moveCursor,
  renderEditor           : renderEditor,
  setCurrentPage         : setCurrentPage,
  setMode                : setMode,
};

charts.setup(exports)

if (/[/]d[/](\d*)$/.test(document.location)) {
  $.get(document.location + ".json",function(data) {
    iPythonRaw = data.Notebook.Body;
    DataRaw = data.DataFile.Body;
    parse_raw_notebook();
    setCurrentPage("notebook");
    cradle.join(document.location + ".rtc");
    initializeEditor();
  }, "json")
} else {
  setCurrentPage("upload");
  initializeEditor();
}

module.exports = exports;
