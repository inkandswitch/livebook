/**
 * [Global State]
 * `peerPresence`
 * `theData`
 * `Mode`
 * `$cell`
 * `CurrentCursor`
 * `ERROR_MARKER_IDS`
 */

var $          = require("jquery")
var ace        = require("brace")
var Range      = ace.acequire('ace/range').Range;
var React      = require("react")
var AceEditor  = require("react-ace");

var cradle     = require("./cradle");
var pyload     = require("./pyload");

console.log("python",pyload.files)

require("./hotkeys"); // Assigns the keyboard commands
require("./charts");  // Assigns the charts

// Utils
var asyncRunParallel = require("./util").asyncRunParallel;
var deepClone        = require("./util").deepClone;
var noop             = require("./util").noop;
var resultToHtml     = require("./util").resultToHtml;
var zip              = require("./util").zip;

var ERROR_MARKER_IDS = []; // keeps track of the marker ids so we can remove them with `editor.getSession().removeMarker(id)`

var peerPresence = [
  { name: "Me", status: "here", },
];

cradle.arrive(update_peers);
cradle.depart(update_peers);
/**
 * [Global Deps]
 * `cradle`
 * `collaboratorsMount`
 */
function update_peers () {
  console.log("---> update FELLOWS", cradle.peers())
  peerPresence = cradle.peers();
  React.render(<Collaborators />, collaboratorsMount); 
}

ace.config.set("basePath", "/");

var theData = null;
/**
 * [Global Deps]
 * `theData` - Some hard-coded data for the intial example... or CSV data that has been loaded.
 */
window.__load__ = function(name) {
  if (theData) return theData;
  throw new Error("No CSV data loaded");
}

var Pages = [ "notebook", "upload" ];
var CurrentPage = "notebook";

var starterNotebook = null;

// these three lines came from skulpt repl.js codebase
var importre = new RegExp("\\s*import")
var defre = new RegExp("def.*|class.*")
var assignment = /^((\s*\(\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\)\s*)|(\s*\s*(\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*,)*\s*((\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*)|(\s*\(\s*(\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*,)*\s*((\s*[_a-zA-Z]\w*\s*)|(\s*\(\s*(\s*[_a-zA-Z]\w*\s*,)*\s*[_a-zA-Z]\w*\s*\)\s*))\s*\)\s*))\s*\s*))=/;
var indent = /^\s+/

/**
 * Custom file loader for Skulpt
 * [Global Deps]
 * `Sk`
 */
function pyLoad(x) {
  if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
    console.log("LOAD",x,"not found")
    throw new Error("File not found: '" + x + "'");
  }
  console.log("LOAD",x,"success!")
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
  console.log("2_js", result.to_js);
  var $result;
  // BOOTS ???
  // Duck type result... if it has `to_js` method, proceed
  if (result.to_js) {
    // BOOTS ???
    // - what is tmp here?
    // BOOTS TODO
    // - use `let`
    var $method = Sk.abstr.gattr(result, 'to_js', true)
    var tmp = Sk.misceval.callsimOrSuspend($method)
    $result = Sk.ffi.remapToJs(tmp)
  } else {
    $result = Sk.ffi.remapToJs(result)
  }

  // BOOTS ???
  // - if there's a result with rows, cols, and data,
  //   let's render a table and record it to the iPython object
  //   otherwise, let's render it as plaintext to the iPython object
  if ($result && $result.rows && $result.cols && $result.data) {
    // BOOTS TODO
    // - use `let`

    var table = resultToHtml($result);

    iPython.cells[$cell].outputs = [
      {
       "data": {
         "text/html": [ table ]
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
         "text/plain": [$result]
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
  return e => {
    iPython.cells[i].source = e.split("\n").map( s => s + "\n")
    if (iPython.cells[i].cell_type === "code") {
      // clear error lines?
      editor.getSession()
      python_eval();
    }
    if (iPython.cells[i].cell_type === "markdown") render();
  }
}

// BOOTS ???
/**
 * [Global Deps]
 * `Mode`
 */
function cursor(i) {
  if (i != CursorCell) return ""
  if (Mode == "view")  return ""
  if (Mode == "nav")   return "cursor"
  if (Mode == "edit")  return "cursor-edit"
  else                 throw  new Error("Invalid mode: " + Mode);
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
    .show();

  editor = ace.edit("editX")
  editor.focus()
  editor.moveCursorTo(0, 0);
  editor.getSession().setUseWrapMode(true);

  // TEMP for testing
  global.EDITOR = editor;
  global.REMOVE_MARKERS = () => {
    ERROR_MARKER_IDS.forEach((id) => {
      editor.getSession().removeMarker(id);
    });
  };

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
  return Math.max(offsetHeight, 200) + "px"; 
}

function getEditorWidth() {
  var containerWidth = $(".editor-container").width();
  return Math.floor(containerWidth);
}

/**
 * [Global Deps]
 * `CursorCell`
 * `$`
 */
function cellPosition() {
  var bodyRect = document.body.getBoundingClientRect()
  var elemRect = $(".switch")[CursorCell].getBoundingClientRect()
  var t        = Math.round(elemRect.top  - bodyRect.top) + "px";
  var l        = Math.round(elemRect.left - bodyRect.left) + "px";
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
  React.render(<Notebook data={iPython} />, notebookMount);
  React.render(<Menu />, menuMount);
  React.render(<Collaborators />, collaboratorsMount);
  setup_drag_drop()
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
    $('body').animate({ scrollTop: $('.cursor').offset().top - 80 });
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
       "source": [ "type some python" ]
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
var python_eval = function() {
  var lines = [];
  var lineno = 0;
  var lineno_map = {}; // keeps track of line number on which to print error
  iPython.cells.forEach((c, i) => {
    if (c.cell_type == "code") {
      editor.getSession().clearAnnotations()

      lines.push("mark("+i+")\n")

      c.source.forEach((line,line_number) => {
        if (!line.match(/^\s*$/) &&
            !line.match(/^\s*%/)) {  // skip directive like "%matplotlib inline" that skulpt doesn't parse
          lineno += 1
          lineno_map[lineno] = { cell: i, line: line_number }
          lines.push(line)
        }
      })
      var line = lines.pop()
      if (!assignment.test(line) && !defre.test(line) && !importre.test(line) && !indent.test(line)) {
        lines.push("render(" + line.trim() + ")\n")
      } else {
        lines.push(line)
        lines.push("render(None)\n")
      }
    }
  })

  if (lines.length > 0) {
    try {
      var code = lines.join("")
      eval(Sk.importMainWithBody("<stdin>", false, code))
    } catch (e) {
      if (e.nativeError instanceof Promise) {
        console.log("native promise!",e.nativeError)
        e.nativeError.then(python_eval, function(err) { // RUH ROH RECURSION
          console.log("double error",err)
          handle_error(lineno_map,e) // 
        } )
      } else {
        console.log("Handle Error",e)
        handle_error(lineno_map,e)
      }
    }
  }
  render()
}

/**
 * [Global Deps]
 * `CursorCell`
 * `editor`
 * `Sk`
 */
function handle_error(lineno_map, e) {
  var err_at = lineno_map[e.traceback[0].lineno] || lineno_map[e.traceback[0].lineno - 1] || {cell: CursorCell, line:1}
  var msg = Sk.ffi.remapToJs(e.args)[0];

  console.log("Hi! err_at:", err_at);

  if (err_at.cell === CursorCell) {
    editor.getSession().setAnnotations([{
      row: err_at.line,
      text: msg,
      type: "error" // also warning and information
    }]);

    var markerId = editor
      .getSession()
      .addMarker(new Range(err_at.line, 0, err_at.line, 1), "ace_error-marker", "fullLine");

    ERROR_MARKER_IDS.push(markerId); // keeps track of the marker ids so we can remove them with `editor.getSession().removeMarker(id)`
  }
}

/**
 * [Global Deps]
 * `iPython`
 * `starterNotebook`
 * `setCurrentPage`
 * `render`
 */
function resetToStarterNotebook() {
  iPython = deepClone(starterNotebook);

  setCurrentPage("notebook");

  render(); // TODO prevent python_eval until this is done
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
    return this.props.data.cells.map((cell,index) => <Cell data={cell} key={index} index={index}/>) // `key` prop stops React warnings in the console
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
  var header = undefined
  var data = d3.csv.parseRows(DataRaw,function(row) {
  if (!header) { header = row; return }
    var object = {}
    row.forEach((d,i) => object[header[i]] = (+d || d)) // BOOTS TODO - this will short-circuit on 0
    return object
  })
  theData = data
}

// BOOTS TODO
// - put in separate file
/**
 * [Global Deps]
 * `iPythonRaw`
 * `d3`
 * `DataRaw`
 * `theData`
 */
function post_notebook_to_server() {
  var doc = JSON.stringify({name: "Hello", notebook: { name: "NotebookName", body: iPythonRaw } , datafile: { name: "DataName", body: DataRaw }})
  $.post("/d/", doc, function(response) {
    console.log("responsee",response)
    window.history.pushState({}, "Notebook", response);
    console.log("location", document.location)
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
 * `theData`
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

// hardcoded data to pair with starter notebook
theData = [
  { 'x': 1, 'y': 1 },
  { 'x': 2, 'y': 3 },
  { 'x': 5, 'y': 2 },
  { 'x': 6, 'y': 5 }
]

if (/[/]d[/](\d*)$/.test(document.location)) {
  $.get(document.location + ".json",function(data) {
    iPythonRaw = data.Notebook.Body
    DataRaw = data.DataFile.Body
    parse_raw_notebook()
    setCurrentPage("notebook")
    cradle.join(document.location + ".rtc")
  }, "json")
} else {
  $.get("/starter.ipynb",function(data) {
    starterNotebook = data
    resetToStarterNotebook()
  }, "json")
}

function initializeEditor() {
  setMode("nav");
  moveCursor(0);
  renderEditor();
  setMode("edit");
}

// BOOTS
// 
// The following is an (exported) interface 
// for other files to access state from this module.

module.exports = {
  appendCell             : appendCell,
  cursor                 : cursor,
  deleteCell             : deleteCell,
  displayClass           : displayClass,
  get$cell               : () => $cell,
  getCODE                : () => CODE,
  getCursorCell          : () => CursorCell,
  getEditor              : () => editor,
  getiPython             : () => iPython,
  getMode                : () => Mode,
  getPeerPresence        : () => peerPresence,
  moveCursor             : moveCursor,
  renderEditor           : renderEditor,
  resetToStarterNotebook : resetToStarterNotebook,
  setCurrentPage         : setCurrentPage,
  setMode                : setMode,  
};
