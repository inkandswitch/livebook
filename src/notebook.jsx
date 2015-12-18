let Redux = require("redux");
let { createStore, combineReducers } = Redux;

let codeEditorReducer = require("./reducers/code-editor-reducer");
let documentReducer = require("./reducers/document-reducer");

const reducers = { codeEditor: codeEditorReducer, doc: documentReducer, };

const livebookApp = combineReducers(reducers);
const livebookStore = createStore(livebookApp);
livebookStore.subscribe(codeEditorRender);
livebookStore.subscribe(notebookV2Render)

function codeEditorRender() {
  let { codeEditor } = livebookStore.getState();
  let { hidden, code, node, handleChange } = codeEditor;

  let {row, column} = (editor.getCursorPosition && editor.getCursorPosition()) || {row: 0, column: 0};

  if (hidden) {
    hideEditor();
    return;
  }

  let {top, left, height, width} = node.getBoundingClientRect();
  top += window.scrollY;

  summonEditor({
    code,
    height, width,
    top, left,
    row, column,
    change: handleChange,
  });
}

function notebookV2Render() {
  let { doc } = livebookStore.getState();
  let { html, code } = doc;
  
  ReactDOM.render(
    <NotebookV2 
      getCurrentPage={() => CurrentPage}
      startNewNotebook={startNewNotebook}
      renderLandingPage={renderLandingPage}
      store={livebookStore}
      html={html} code={code} 
      executePython={executePython}
      hideCodeEditor={hideEditor}
      renderCodeEditor={summonEditor} />, 
    notebookV2Mount);
}

global.STORE = livebookStore;

var $          = require("jquery");
var ace        = require("brace");
var Range      = ace.acequire('ace/range').Range;
var React      = require("react");
var ReactDOM   = require("react-dom");
var AceEditor  = require("react-ace");

var cradle     = require("./cradle");

var colorChange = false

var {getCellPlots, setCellPlots} = require("./cell-plots-accessors");
var createCellPlotData = require("./cell-plots-adapter");


var NEXT_CALLBACK_FOR_RESULTS,
    NEXT_CALLBACK_FOR_PLOTS;
var WORKER     = new Worker("/js/worker.js");
WORKER.onmessage = function(e) {
  let data = e.data;
  let {results, plots, error} = data;

  console.log("Got message from the worker:", data)

  if (error) handle_error(error);
  bindPlotsToiPython(plots, iPython);

  handlePlots(plots)
  handleResults(results)
}

function handleResults(results) {
  for (let cell in results) {
    // iPython.cells[cell].outputs = results[cell]
    NEXT_CALLBACK_FOR_RESULTS(cell, results[cell])
  }
}

function handlePlots(plots) {
  for (let cell in plots) {
    let plotArrays = plots[cell];
    let plotData = createCellPlotData(plotArrays);
    NEXT_CALLBACK_FOR_PLOTS(cell, plotData);
  }
}

function bindPlotsToiPython(plots, iPython) {
  Object.keys(plots).forEach((cellNumber) => {
    let plotArrays = plots[cellNumber];
    let plotData = createCellPlotData(plotArrays);
    let cell = iPython.cells[cellNumber];
    setCellPlots(cell, plotData);
  });
}

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
var {ipyToHailMary} = require("./ipython-converter.jsx");


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

  // ReactDOM.render(
  //   <Notebook 
  //       peerCursorCells={cursorPositions} 
  //       peerEditingCells={peerEditingCells} 
  //       data={iPython} 
  //       typing={typing(render_time)}/>, 
  //   notebookMount);

  let {html, code} = ipyToHailMary(iPython);

  livebookStore.dispatch({
    type: "INITIALIZE_DOCUMENT",
    documentProps: {
      code,
      html,
    },
  })
}

ace.config.set("basePath", "/");

var Pages = [ "landing", "notebook", "upload" ];
var CurrentPage = "notebook";
var Mode = "view";
var CursorCell = 0;
var iPython = { cells:[] }
var iPythonUpdated = 0

// React mount points
var landingPageMount   = document.getElementById("landing-page");
var notebookMount      = document.getElementById("notebook");
var notebookV2Mount    = document.getElementById("notebook-v2");
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

// NB - _NOT_ used in free flowing version
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


// NB - used in free flowing version
function summonEditor(options) {
  let {row, column} = options;
  let {height, width} = options;
  let lang   = "python";
  let value  = options.code;
  let {change} =  options; // onChangeFunc(CursorCell)
  let onBeforeLoad = noop;

  let editorOptions = {
    lang: lang,
    height: height,
    width: width,
    value: value,
    change: createChangeFunction(change), // TODO - scope with a function that evaluates contents
    onBeforeLoad: onBeforeLoad,
    onLoad: () => { if (editor && editor.moveCursorTo) editor.moveCursorTo(row, column) },
  };

  ReactDOM.render(createAceEditor(editorOptions), editorMount);

  // Position editor
  let {top, left} = options;
  $("#editX")
    .css("top", top)
    .css("left", left)
    .show();

  editor = ace.edit("editX")
  editor.focus()
  editor.moveCursorTo(row, column);
  editor.getSession().setUseWrapMode(true);

  // TEMP for testing
  global.EDITOR = editor;
  REMOVE_MARKERS();
}

function createChangeFunction(orig) {
  return handleChange;
  function handleChange(code) {
    orig(code);
  }
}

function hideEditor() {
  $("#editX").hide();
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
  var $switch = $(".switch:eq("+CursorCell+")");
  var height = $switch.height();
  return height;
}

function getEditorWidth() {
  var $switch = $(".switch:eq("+CursorCell+")");
  var width = $switch.width();
  return width;
}

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

function render() {
  let render_time = new Date()
  update_peers_and_render()

  return render_time
}

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

function deleteCell() {
  console.log('delete');
  iPython.cells.splice(CursorCell, 1);

  if (CursorCell > 0)
    CursorCell -= 1;

  CursorCell = Math.min(CursorCell, iPython.cells.length-1);

  render();
}

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

function setCurrentPage(page) {
  if (!Pages.includes(page)) {
    console.log("Error: '" + page + "' is not a valid page");
    return;
  }

  CurrentPage = page;
  render()
}

window.onpopstate = function(event) {
  var path = document.location.pathname;
  if (path === "/")
    setCurrentPage("landing");
  else if (path === "/upload")
    setCurrentPage("upload")
  else
    setCurrentPage("notebook")
}

function python_eval() {
  let style = "color: darkred; font-weight: 700; font-size: 2em;";
  console.log("%c Calling python_eval is deprecated and does nothing.", style)
}

function executePython(codeBlocks, nextForResults, nextForPlots) {
  NEXT_CALLBACK_FOR_RESULTS = nextForResults;
  NEXT_CALLBACK_FOR_PLOTS = nextForPlots;
  REMOVE_MARKERS()
  WORKER.postMessage({ type: "exec", doc: codeBlocks})
}

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
var NotebookV2 = require("./components/notebook-flowing.jsx");

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

function forkNotebook(urls) {
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

  // let {code, html} = ipyToHailMary(iPython)

  WORKER.postMessage({ type: "data", data: raw_csv })
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
  post_notebook_to_server(data.ipynb, data.csv);
  parse_raw_notebook(data.ipynb, data.csv);
  setCurrentPage("notebook");
  initializeEditor();
  python_eval();

  // I HOPE THIS WORKS
  update_peers_and_render();
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
  getCellPlots           : getCellPlots,
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

global.MEH = exports;

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