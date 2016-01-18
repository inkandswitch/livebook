require("./stylesheets/notebook.scss");
const Redux = require("redux");
const { createStore, combineReducers } = Redux;

const codeEditorReducer = require("./reducers/code-editor-reducer");
const documentReducer = require("./reducers/document-reducer");

const reducers = { codeEditor: codeEditorReducer, doc: documentReducer};

const livebookApp = combineReducers(reducers);
const livebookStore = createStore(livebookApp);
livebookStore.subscribe(codeEditorRender);
livebookStore.subscribe(navRender);
livebookStore.subscribe(notebookRender)
livebookStore.subscribe(runNotebook)
livebookStore.subscribe(saveNotebook)

let EDITOR = {}

let LAST_CODE = []// changes in results dont bug me - nested reducers maybe?
function runNotebook() {
  let {doc} = livebookStore.getState()
  if (doc.editor !== "me" && doc.editor !== undefined) return; // someone else did the update - let them run it
  let codeBlocks = doc.codeList.map((id) => doc.codeMap[id])
  if (LAST_CODE.join() != codeBlocks.join()) {
    REMOVE_MARKERS()
    WORKER.postMessage({ type: "exec", doc: codeBlocks})
    LAST_CODE = codeBlocks
  }
}

function saveNotebook() {
  let {doc} = livebookStore.getState()
  if (doc.html === "") return; // inital state - ignore
  if (doc.editor !== "me") return; // someone else did the update (or undefined)

  console.log("SAVE?",doc.editor)

  // yuck...
  // If there's a pending update - change the SAVE_FUNC
  if (SAVE_TIMEOUT) {
    SAVE_FUNC = () => {
      handleSaveNotebook(doc)
      handleSyncNotebook(doc)
    }
  } else {
    // IF NOT - blank out the SAVE_FUNC and start a timer - this way nothing happens if this
    // is the final update - but a proper save happens in 500ms if it isn't
    SAVE_FUNC = () => {}
    SAVE_TIMEOUT = setTimeout(() => {
      SAVE_TIMEOUT = undefined
      SAVE_FUNC()
    }, 500)
    handleSaveNotebook(doc)
    handleSyncNotebook(doc)
  }
}

function empty(x) {
  return Object.keys(x).length == 0
}

// These are functions that are assigned by children 
// (effectively passing functionality from children to parents, which is a React no-no)
let uglyAntiFunctions = {};
global.uglyAntiFunctions = uglyAntiFunctions;

function codeEditorRender() {
  let { codeEditor, doc } = livebookStore.getState();
  let { hidden, index, node, handleChange } = codeEditor;
  let code = doc.codeMap[index]

  let {row, column} = (EDITOR.getCursorPosition && EDITOR.getCursorPosition()) || {row: 0, column: 0};

  if (hidden) {
    hideEditor();
    return;
  }

  let {top, left, height, width} = node.getBoundingClientRect();
  top += window.scrollY;

  // summonEditor({
  //   code,
  //   height, width,
  //   top, left,
  //   row, column,
  //   change: handleChange,
  // });
}

function notebookRender() {
  const state = livebookStore.getState();
  const { doc } = livebookStore.getState();

  ReactDOM.render(
    <Notebook 
      doc={doc}
      startNewNotebook={startNewNotebook}
      store={livebookStore}
      getPeers={() => cradle.peers() }
      hideCodeEditor={hideEditor}
      renderCodeEditor={summonEditor} 
      assignForceUpdate={(f) => uglyAntiFunctions.forceUpdateEditor = f}
      assignFocusOnSelectedOverlay={(f) => uglyAntiFunctions.focusOnSelectedOverlay = f}
      assignFocusEditorOnPlaceholder={(f) => uglyAntiFunctions.focusEditorOnPlaceholder = f}
      focusEditorOnPlaceholder={ (i) => uglyAntiFunctions.focusEditorOnPlaceholder && uglyAntiFunctions.focusEditorOnPlaceholder(i) } 
      focusOnSelectedOverlay={ () => uglyAntiFunctions.focusOnSelectedOverlay && uglyAntiFunctions.focusOnSelectedOverlay() } />, 
    notebookMount);
}

function navRender() {
  ReactDOM.render(<Nav  render={render} store={livebookStore} fork={forkNotebook} />, navMount);
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

var WORKER     = new Worker("/js/worker.js");
WORKER.onmessage = function(e) {
  let data = e.data;
  let {results, plots, error} = data;

  if (error) handleError(error);
  if (!empty(plots)) handlePlots(plots)
  if (!empty(results)) handleResults(results)
  let { forceUpdateEditor } = uglyAntiFunctions;
  forceUpdateEditor && forceUpdateEditor();
}

function handleResults(results) {
  livebookStore.dispatch({ type: "NEW_RESULT", data: results })
}

function handlePlots(plots) {
  livebookStore.dispatch({ type: "NEW_PLOTS", data: plots })
}

// Utils
var noop          = require("./util").noop;
var randomColor   = require("./util").randomColor;
var randomName    = require("./util").randomName;
var {iPyToHTML} = require("./ipython-converter.jsx");


var getPeerColor     = (peer) => peer.state.color ;

function getSeniorPeerColors() {
  return cradle.peers().slice(1).filter((p) => p.senior).map(getPeerColor);
}

function getPeerColors() {
  return cradle.peers().slice(1).map(getPeerColor);
};

var LAST_TYPE = new Date()
var TYPING_SPAN = 500
function typing(when) { return when - LAST_TYPE < TYPING_SPAN }

var ERROR_MARKER_IDS = []; // keeps track of the marker ids so we can remove them with `EDITOR.getSession().removeMarker(id)`
function REMOVE_MARKERS() {
  ERROR_MARKER_IDS.forEach((id) => {
    EDITOR.getSession().removeMarker(id);
  });
  ERROR_MARKER_IDS = []
}

function ifChanged(key,val,func) {
  let flatVal = typeof val == 'object' ? JSON.stringify(val) : val
  if (ifChanged[key] !== flatVal) {
    ifChanged[key] = flatVal
    func(val)
  }
}

cradle.onupdate = function() {
  var colorMap = {  // ## DRY - i know - i know
      '#1E52AA': 'rgba(30,82,170,0.05)',
      '#9E11A8': 'rgba(158,17,168,0.05)',
      '#FF8018': 'rgba(255,128,24,0.05)',
      '#D6F717': 'rgba(214,247,23,0.05)'
  };

  console.log("onupdate1",cradle.peers())
  let peers = cradle.peers().map((p) => ({session: p.session, color: p.state.color, cursor: p.state.cursor, name: p.user.name }))
  let style = peers.filter((p) => p.session && p.color).map((p) => "[data-livebook-sessions*='"+p.session+"'] { background: "+ colorMap[p.color]+"; }\n").join('')
  console.log("onupdate",peers)

  set_avatar_colors()

  ifChanged("style",style,() => {
    let css = document.getElementById("peers-style");
    css.innerHTML = style
  })

  ifChanged("cursors",peers,() => {
    peers.filter((p) => p.session && p.cursor).map((p) => {
      console.log("PEER",p)
      let nodes = [].slice.call(document.querySelectorAll("[data-livebook-sessions*='"+p.session+"']"))
      nodes.forEach((domNode) => {
        domNode.dataset.livebookSessions = domNode.dataset.livebookSessions.replace(p.session, "");
      });

      let node = document.querySelector("[livebook-node-id='"+p.cursor+"']");
      if (node) node.dataset.livebookSessions = (node.dataset.livebookSessions || "") + p.session;
    })
    notebookRender()
  })
}

cradle.onarrive = update_peers_and_render;
cradle.ondepart = update_peers_and_render;
cradle.onusergram = function(from,message) {
  if (message && message.type == "update") {
    console.log("onusergram update, from ", from)
    livebookStore.dispatch({ type: "INITIALIZE_DOCUMENT", documentProps: message.doc, editor: from })
  }
}

function set_avatar_colors() {
  let peers = cradle.peers()
  if (colorChange === false && getSeniorPeerColors().indexOf(cradle.state.color) !== -1) {
    console.log("changing color once b/c someone else has seniority")
    cradle.setSessionVar("color", randomColor({ not: getPeerColors() }))
    colorChange = true
  }
}
function update_peers_and_render() {
  let peers = cradle.peers()

  set_avatar_colors()

  navRender();

  let render_time = new Date();

  renderUploader();
}

ace.config.set("basePath", "/");

var Pages = [ "landing", "notebook", "upload" ];
var CurrentPage = "notebook";

// React mount points
var notebookMount      = document.getElementById("notebook");
var editorMount        = document.getElementById("editor");
var navMount           = document.getElementById("nav");
var uploaderMount      = document.getElementById("uploader");

function summonEditor(options) {
  let {row, column} = options;
  let {height, width} = options;
  let lang   = "python";
  let value  = options.code;
  let {change} =  options;
  let onBeforeLoad = noop;

  let editorOptions = {
    lang: lang,
    height: height,
    width: width,
    value: value,
    change: createChangeFunction(change), // TODO - scope with a function that evaluates contents
    onBeforeLoad: onBeforeLoad,
    onLoad: () => { if (EDITOR && EDITOR.moveCursorTo) EDITOR.moveCursorTo(row, column) },
  };

  ReactDOM.render(createAceEditor(editorOptions), editorMount);

  // Position editor
  let {top, left} = options;
  $("#editX")
    .css("top", top)
    .css("left", left)
    .show();

  EDITOR = ace.edit("editX")
  EDITOR.focus()
  EDITOR.moveCursorTo(row, column);
  EDITOR.getSession().setUseWrapMode(true);

  // TEMP for testing
  global.EDITOR = EDITOR;
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

function render() {
  let render_time = new Date()
  update_peers_and_render()
  return render_time
}

let SAVE_TIMEOUT;
let SAVE_FUNC;

function handleSyncNotebook(state) {
  cradle.broadcast({type:"update",time:Date.now(), doc: state })
}

function handleSaveNotebook(state) {
  if (document.location.pathname ===  "/") {
    // Stops 404 that results from posting to `/.json` on the starter page
    return;
  }
  console.log("Saving notebook...",state.title);
  var raw_notebook = JSON.stringify(state)
  var data = {
    name: state.title,
    notebook: {
      name: state.title,
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
}

function handleUpdateNotebook(state) {
}

// TODO - render onpushstate?

window.onpopstate = function(event) {
  render();
}

function handleError(e) {
  console.log("ERROR:",e)
  let errors = {}
  errors[e.cell] = Object.assign({message: `${e.name}: ${e.message}`}, e);
  livebookStore.dispatch({ type: "NEW_ERRORS", data: errors });
}

var Nav = require("./components/nav");
var Notebook = require("./components/notebook-flowing");
var Uploader = require("./components/uploader");


function renderUploader() {
  const isUploadPage = (window.location.pathname.indexOf("upload") !== -1)
  ReactDOM.render(<Uploader show={isUploadPage} startNewNotebook={startNewNotebook} />, uploaderMount);
}

function forkNotebook(urls) {
  $.post("/fork/", JSON.stringify(urls), function(response) {
    let newNotebookUrl = response.trimRight();
    window.location = newNotebookUrl;
  })
}

function parseRawNotebook(raw_notebook,raw_csv) {
  let notebook = JSON.parse(raw_notebook)
  let state
  if (notebook.cells === undefined) {
    state = notebook
  } else {
    state = iPyToHTML(notebook);
  }
  console.log("INIT DOCUMENT",state)
  livebookStore.dispatch({ type: "INITIALIZE_DOCUMENT", documentProps: state, editor: undefined })
  WORKER.postMessage({ type: "data", data: raw_csv })
}

function postNotebookToServer(raw_notebook,raw_csv, callback) {
  var doc = JSON.stringify({name: "Hello", notebook: { name: "NotebookName", body: raw_notebook } , datafile: { name: "DataName", body: raw_csv }})
  $.post("/d/", doc, function(response) {
    window.history.pushState({}, "Notebook", response);
    startCradle()
    callback()
  })
}

function startCradle() {
  cradle.join(document.location + ".rtc", function() {
    cradle.setSessionVar("color", '#1E52AA')
    if (cradle.user.name == undefined) {
      cradle.setUserVar("name", randomName())
    } // else use old name
  })
}

function startNewNotebook(data) {
  postNotebookToServer(data.ipynb, data.csv, function() {
    parseRawNotebook(data.ipynb, data.csv);
    // I HOPE THIS WORKS
    update_peers_and_render();
  });
}

var exports =  {
  getCellPlots           : getCellPlots,
  getCurrentPage         : () => CurrentPage,
  getEditor              : () => EDITOR,
};

global.MEH = exports;

if (/[/]d[/]([-\.a-zA-Z0-9]+)$/.test(document.location)) {
  $.get(document.location + ".json",function(data) {
    parseRawNotebook(data.Notebook.Body, data.DataFile.Body);
    render();
    startCradle()
  }, "json")
} else if (document.location.pathname.indexOf("/upload") === 0) {
  render();
}
else {
  forkNotebook({
   ipynb: "/forkable/welcome.ipynb",
   csv: "/forkable/welcome.csv"
  })
}

module.exports = exports;
