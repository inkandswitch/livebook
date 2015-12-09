/**
 * [Global State]
 * `Mode`
 * `$cell`
 * `CurrentCursor`
 * `ERROR_MARKER_IDS`
 * `ERROR_CELL_CLASSNAME`
 */

var $          = require("jquery");
var ace        = require("brace");
var Range      = ace.acequire('ace/range').Range;
var React      = require("react");
var ReactDOM   = require("react-dom");
var AceEditor  = require("react-ace");

var cradle     = require("./cradle");

var pyload     = require("./pyload");

var colorChange = false


var WORKER     = new Worker("/js/worker.js");
WORKER.onmessage = function(e) {
  console.log("Got message from the worker:",e.data)
  if (e.data.error) handle_error(e.data.error)
  for (let cell in e.data.results) {
    console.log("KEY",cell)
    python_render(cell,e.data.results[cell])
  }
  render()
}

var charts = require("./charts-v2");  // Assigns the charts
// Utils
var asyncRunParallel = require("./util").asyncRunParallel;
var createAsyncDataFetcher = require("./util").createAsyncDataFetcher;
var deepClone = require("./util").deepClone;
var getPixelsBeyondFold = require("./util").getPixelsBeyondFold;
var noop          = require("./util").noop;
var randomColor   = require("./util").randomColor;
var randomName    = require("./util").randomName;
var resultToHtml  = require("./util").resultToHtml;
var scrollXPixels = require("./util").scrollXPixels;

var getPeerColor     = (peer) => peer.state.color ;

function getSeniorPeerColors() {
  return cradle.peers().slice(1).filter((p) => p.senior).map(getPeerColor);
}

function getPeerColors() {
  return cradle.peers().slice(1).map(getPeerColor);
};

var getPeerEditing = (peer) => peer.state.editing;
var isPeerEditing = (peer) => { return (typeof getPeerEditing(peer)) === "number"; }
function getPeerEditingCells() {
  let otherPeers = cradle.peers().slice(1);
  return otherPeers.reduce((result, peer) => {
    if (isPeerEditing(peer)) {
      let peerClone = Object.assign({}, peer);
      peerClone.state = Object.assign({}, peer.state)
      result.push(peerClone);
    }
    return result;
  }, []);
}

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
}

cradle.onarrive = function() {
  update_peers_and_render();
}
cradle.ondepart = update_peers_and_render;
cradle.onupdate = update_peers_and_render;
cradle.onusergram = function(from,message) {
  console.log("on usergram")
  if (message && message.type == "update") {
    console.log("Got a new document... is it new?")
    if (message.time > iPythonUpdated) {
      iPythonUpdated = message.time
      iPython = message.document
      python_eval();
      render()
    }
  }
}

function update_peers_and_render() {
  let peers = cradle.peers()

  if (colorChange === false && getSeniorPeerColors().indexOf(cradle.state.color) !== -1) {
    console.log("changing color once b/c someone else has seniority")
    cradle.setSessionVar("color", randomColor({ not: getPeerColors() }))
    colorChange = true
    peers = cradle.peers()
  }

  ReactDOM.render(<Nav 
      show={CurrentPage !== "landing"}
      peers={peers} 
      setMode={setMode} getMode={() => Mode} 
      getCurrentPage={() => CurrentPage} 
      notebook={exports}/>, 
    navMount);

  let cursorPositions = peers.map((peer) => {
    let cursorPosition = peer.state.cursor === undefined ? 0 : peer.state.cursor; // FIXME
    return {
      position: cursorPosition,
      color: getPeerColor(peer),
    };
  });

  let peerEditingCells = getPeerEditingCells();

  let render_time = new Date();

  ReactDOM.render(
    <Notebook 
        peerCursorCells={cursorPositions} 
        peerEditingCells={peerEditingCells} 
        data={iPython} 
        typing={typing(render_time)}/>, 
    notebookMount);
}

ace.config.set("basePath", "/");

var Pages = [ "landing", "notebook", "upload" ];
var CurrentPage = "notebook";

// these three lines came from skulpt repl.js codebase
var importre = new RegExp("\\s*import")
var defre = new RegExp("def.*|class.*")
var assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
var keyword = /^(assert|pass|del|print|return|yield|raise|break|continue|import|global|exec)/
var indent = /^\s+/

/**
 * [Global Deps]
 * `iPython` - Object that is stringified into .ipynb file
 */
function python_render(cell,text) {
  if (text === undefined) return;
  var html;
  // Duck type result... if it has `to_js` method, proceed
/*
  if (result.to_js) {
    let $method = Sk.abstr.gattr(result, 'to_js', true)
    let $result = Sk.misceval.callsimOrSuspend($method)
    html = resultToHtml(Sk.ffi.remapToJs($result))
  } else {
    text = String(Sk.ffi.remapToJs(Sk.builtin.str(result))) + "\n"
  }
*/

  if (html) {
    iPython.cells[cell].outputs = [
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
    iPython.cells[cell].outputs = [
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

// All The Globals
var Mode = "view";
var CursorCell = 0;
var iPython = { cells:[] }
var iPythonUpdated = 0

// React mount points
var landingPageMount   = document.getElementById("landing-page");
var notebookMount      = document.getElementById("notebook");
var editorMount        = document.getElementById("editor");
var navMount           = document.getElementById("nav");

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

  ReactDOM.render(createAceEditor(editorOptions), editorMount);

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

  if (typeof height === "number") {
    height += "px";
  }
  if (typeof width === "number") {
    width += "px";
  }

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
  var bodyRect = document.body.getBoundingClientRect();
  var notebookRect = document.querySelector("#notebook").getBoundingClientRect();
  var elemRect = $(".switch")[CursorCell].getBoundingClientRect()
  var t        = Math.round(elemRect.top  - bodyRect.top) + "px";
  var l        = Math.round(elemRect.left - notebookRect.left) + "px";
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
 */
function render() {
  let render_time = new Date()
  update_peers_and_render()

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
  cradle.setSessionVar("cursor",CursorCell)
  render();

  // allows us to disable auto scrolling on the click events
  if (!options.noScroll) {
    let $currentUserCursor = $('[data-current-user-cursor]');
    let $currentUserCellWrap = $currentUserCursor.parents(".cell-wrap");
    wordProcessorScroll($currentUserCellWrap);
  }
}

function wordProcessorScroll($activeCell) {
  let margin = 8;
  let {above, below} = getPixelsBeyondFold($activeCell)
  let isAboveFold = above > 0;
  let isBelowFold = below > 0;

  // NB: If the entire cell is larger than the viewport,
  //     We give precedence to scrolling to the top
  if (isAboveFold) {
    scrollXPixels(-above - 8);
    return;
  }
  if (isBelowFold) {
    scrollXPixels(below + 8);
    return;
  }
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
 */
function save_notebook() {
  if (document.location ===  "/") {
    // Stops 404 that results from posting to `/.json` on the starter page
    return;
  }
  console.log("Saving notebook...");
  var raw_notebook = JSON.stringify(iPython);
  var data = {
    name: "Hello",
    notebook: {
      name: "NotebookName",
      body: raw_notebook,
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
  iPythonUpdated = Date.now()
  cradle.broadcast({type: "update", time: iPythonUpdated, document: iPython})
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

  if (m == "edit") cradle.setSessionVar("editing",CursorCell)
  else if (old == "edit") cradle.delSessionVar("editing")

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
  if (path === "/")
    setCurrentPage("landing");
  else if (path === "/upload")
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
//  var code_ctx = generate_python_ctx()
  WORKER.postMessage({ type: "exec", doc: iPython})
//  var badcell  = execute_python_ctx(code_ctx)
//  return render()
}

var assignment2 = /^[.a-zA-Z0-9_"\[\]]*\s*=\s*/;
/*
function assignment_test(line) {
  var a = assignment.test(line)
  var b = assignment2.test(line)
  return a || b
}

function generate_python_ctx() {
  var lines = [];
  var lineno = 0;
  var lineno_map = {}; // keeps track of line number on which to print error
  iPython.cells.forEach((c, i) => {
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

*/

/**
 * [Global Deps]
 * `CursorCell`
 * `editor`
 * `Sk`
 */
function handle_error(e) {
  console.log("ERROR:",e)
  iPython.cells[e.cell].outputs = []
  if (e.cell === CursorCell) {
    if (editor && editor.getSession()) {
      let markerId = editor
        .getSession()
        .addMarker(new Range(e.line, 0, e.line, 1), "ace_error-marker", "fullLine");
      ERROR_MARKER_IDS.push(markerId); // keeps track of the marker ids so we can remove them with `editor.getSession().removeMarker(id)`
    }
  }

  ERRORS[e.cell] = Object.assign({message: `${e.name}: ${e.message}`}, e);
  return e.cell
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

var Nav = require("./components/nav");
var LandingPage = require("./components/landing-page");
var Uploader = require("./components/uploader.jsx");
var Cell = require("./components/cell.jsx");


var Notebook = React.createClass({
  cells() {
    return this.props.data.cells.map((cell, index) => {

      let errorObject = ERRORS[index];
      let cursorCells = this.props.peerCursorCells.filter((cursorCell) => { return cursorCell.position === index; });
      let peerEditor = this.props.peerEditingCells.find((peer) => { return getPeerEditing(peer) === index; });

      return (
        <Cell data={cell} 
          notebook={exports} 
          mode={Mode} 
          cellIndex={index} 
          cursor={CursorCell}
          cursors={cursorCells}
          peerEditor={peerEditor}
          typing={this.props.typing} 
          key={index} index={index} 
          errorObject={errorObject}/>
      );
    })
  },

  componentWillUpdate() {
    renderLandingPage();
  },

  render() {
    switch (CurrentPage) {
      case "landing":
        return <div className="notebook"></div>;
      case "upload":
        return <div className="notebook"><Uploader startNewNotebook={startNewNotebook} /></div>
      case "notebook":
        return <div className="notebook">{this.cells()}</div>
    }
  },
})

function renderLandingPage() {
  ReactDOM.render(<LandingPage show={CurrentPage === "landing"} fork={forkNotebook} />, landingPageMount);
}

function forkNotebook (urls) {
  let fetchCSV = createAsyncDataFetcher(urls.csv);
  let fetchIPYNB = createAsyncDataFetcher(urls.ipynb);

  asyncRunParallel([fetchCSV, fetchIPYNB], function(err, livebookData) {
    if (err) {
      console.log("Error forking data! csv url was", urls.csv, "and ipynb url was", urls.ipynb);
      console.log("Oh yeah. Here is the error:", err);
      return;
    }
    let csv = livebookData[0];
    let ipynb = livebookData[1];

    startNewNotebook({
      csv: csv,
      ipynb: ipynb,
    });

  });

}

function parse_raw_notebook(raw_notebook,raw_csv) {
  iPython = JSON.parse(raw_notebook)
  iPython.cells.forEach(cell => cell.outputs = [])
  iPythonUpdated = Date.now()

  WORKER.postMessage({ type: "data", doc: raw_csv })
}

function post_notebook_to_server(raw_notebook,raw_csv) {
  var doc = JSON.stringify({name: "Hello", notebook: { name: "NotebookName", body: raw_notebook } , datafile: { name: "DataName", body: raw_csv }})
  $.post("/d/", doc, function(response) {
    window.history.pushState({}, "Notebook", response);
    start_peer_to_peer()
  })
}

function start_peer_to_peer() {
  cradle.join(document.location + ".rtc", function() {
    cradle.setSessionVar("cursor",0)
    cradle.setSessionVar("color", '#1E52AA')
    if (cradle.user.name == undefined) {
      cradle.setUserVar("name", randomName())
    } // else use old name
  })
}

function startNewNotebook(data) {
  // FIXME - how do we start peer to peer after making a new notebook?
  // (I'm getting a PUT error connecting to new url + .rtc; the error originates from the cradle code)
  post_notebook_to_server()
  parse_raw_notebook(data.ipynb, data.csv)
  setCurrentPage("notebook")
  initializeEditor();
  python_eval();
}

function initializeEditor() {
  setMode("nav");
  moveCursor(0);
}

var exports =  {
  appendCell             : appendCell,
  deleteCell             : deleteCell,
  displayClass           : displayClass,
  get$cell               : () => $cell,
  getCODE                : () => CODE,
  getCurrentPage         : () => CurrentPage,
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
    parse_raw_notebook(data.Notebook.Body, data.DataFile.Body);
    setCurrentPage("notebook");
    start_peer_to_peer()
    initializeEditor();
    python_eval();
    python_eval(); // the second call is necessary to draw charts on load

  }, "json")
} else {
  let isUploadPage = document.location.pathname.indexOf("upload") !== -1;
  isUploadPage ? setCurrentPage("upload") : setCurrentPage("landing");
  initializeEditor();
  python_eval();
  python_eval(); // the second call is necessary to draw charts on load
}

module.exports = exports;
