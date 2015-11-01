/**
 * [Global State]
 * `peerPresence`
 * `theData`
 * `Mode`
 * `$cell`
 * `CurrentCursor`
 */

var $          = require("jquery")
var ace        = require("brace")
var React      = require("react")
var AceEditor  = require('react-ace');
var cradle     = require('./cradle');

// Utils
var asyncRunParallel = require("./util").asyncRunParallel;
var rawMarkup        = require("./util").rawMarkup;
var $resultToHtml    = require("./util").$resultToHtml;
var zip              = require("./util").zip;

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
  console.log("FELLOWS", cradle.peers());
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


// BOOTS ???
// - Seems to check if python environment has any files in it
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
 * Maps content of (code) cell to a javascript object, and assigns it to `$cell`
 * This function is placed in Sk.builtins["mark"]
 *
 * [Global Deps]
 * `Sk`
 * `$cell` - ??? The current cell?
 */
function python_mark(cell) {
  $cell = Sk.ffi.remapToJs(cell)
}

/**
 * [Global Deps]
 * `Sk`
 * `$cell` - ??? The current cell?
 * `iPython` - ???
 */
function python_render(result) {
  if (result === undefined) return;
  console.log("2_js",result.to_js);
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

    var table = $resultToHtml($result);

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

var Mode = "view";
var CursorCell = 0;
var DataRaw = ""
var iPythonRaw = ""
var iPython = { cells:[] }

// React mount points
var notebookMount = document.getElementById('notebook')
var editorMount = document.getElementById('editor')
var menuMount = document.getElementById('menu')
var collaboratorsMount = document.getElementById('collaborators')

// Editor
var editor       = {}
function useEditor(cell) {
  return (cell.props.index == CursorCell && Mode == "edit")
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
    if (iPython.cells[i].cell_type == "code") python_eval()
  }
}

// BOOTS TODO
// - utilify
/**
 * [Global Deps]
 * `marked`
 */


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
  // BOOTS TODO
  // - cache $("#editX");
  if (Mode != "edit") {
    $("#editX").hide()
  } else {
    // BOOTS TODO
    // - use `let`
    var height = $(".switch")[CursorCell].offsetHeight + "px"
    var width  = $(".switch")[CursorCell].offsetWidth  + "px"
    var lang   = iPython.cells[CursorCell].cell_type == "code" ? "python" : "markdown"
    var value  = iPython.cells[CursorCell].source.join("")
    var change = onChangeFunc(CursorCell)
    var onBeforeLoad = function() {
    }

    // BOOTS TODO
    // - write a convenience method for this
    var dom    = <AceEditor className="editor" mode={lang} height={height} width={width} value={value} theme="github" onChange={change} name="editX" editorProps={{$blockScrolling: true}} onBeforeLoad={onBeforeLoad}/>
    // BOOTS TODO
    // - where is editorMount?
    React.render(dom, editorMount);

    var pos = cellPosition();

    // BOOTS TODO
    // - method chain
    $("#editX").show()
    $("#editX").css("top", pos.top)
    $("#editX").css("left", pos.left)

    editor = ace.edit("editX")
    editor.focus()
    editor.moveCursorTo(0,0);
    editor.getSession().setUseWrapMode(true);
    // TODO if type==code?
    python_eval()
  }
}

// BOOTS !!!
// - yay good.
/**
 * [Global Deps]
 * `CursorCell`
 * `$`
 */
function cellPosition() {
  var bodyRect = document.body.getBoundingClientRect()
  var elemRect = $(".switch")[CursorCell].getBoundingClientRect()
  var t   = Math.round(elemRect.top  - bodyRect.top) + "px";
  var l   = Math.round(elemRect.left - bodyRect.left) + "px";
  return {
    top: t,
    left: l,
  };
}

// BOOTS ???
/**
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
function moveCursor(delta) {
  if (Mode == "edit") return;
  if (Mode == "view") { setMode("nav"); return }

  var newCursor = CursorCell + delta;
  if (newCursor >= iPython.cells.length || newCursor < 0) return;
  CursorCell = newCursor;
  render();
  // BOOTS ???
  // why - 80?
  $('body').animate({ scrollTop: $('.cursor').offset().top - 80 });
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

  if (type == "code")
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
  else if (type == "markdown")
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
  console.log("Saving notebook...")
  iPythonRaw = JSON.stringify(iPython)
  // BOOTS ???
  // - wat is getting PUTted here?
  var data = JSON.stringify({name: "Hello", notebook: { name: "NotebookName", body: iPythonRaw } })
  $.ajax({
    method: "PUT",
    url: document.location + ".json",
    data: data,
    complete: function(response, status) {
      console.log("save response",response) // TODO handle errors
  }})
}

/**
 * [Global Deps]
 * `Mode`
 * `CODE` - 
 * `save_notebook`
 */
function setMode(m) {
  if (Mode == m) return false;
  var old = Mode
  Mode = m;
  switch (m) {
    case "edit":
      CODE.cache(CursorCell)
      break;
    case "nav":
      if (old == "edit") save_notebook()
      // fall through
    default:
      CODE.clear(CursorCell)
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
    console.log("Error: '" + page + "' is not a valid page")
    return
  }

  CurrentPage = page
  render()
}

// BOOTS TODO
// - refactor into hotkeys file
/**
 * [Global Deps]
 * `Mode`
 * `setMode`
 * `moveCursor`
 */
$('body').keyup(function(e) {
  switch (e.which) {
    case 27: // esc
      if (Mode == "edit") setMode("nav")
      else                setMode("view")
      break;
    case 38: // up
      if (Mode == "edit") break;
      moveCursor(-1);
      break;
    case 40: // down
      if (Mode == "edit") break;
      moveCursor(1);
      break;
  }
})

// BOOTS TODO
// - refactor into hotkeys file
/**
 * [Global Deps]
 * `Mode`
 * `setMode`
 * `moveCursor`
 * `appendCell`
 * `deleteCell`
 */
$('body').keypress(function(e) {
  if (Mode == "edit") return;

  switch (e.which) {
    case 101:
      setMode("edit");
      e.preventDefault();
      break;
    case 107: //k
    case 113: //q
      moveCursor(-1);
      e.preventDefault();
      break;
    case 106: //j
    case 97:  //a
      moveCursor(1);
      e.preventDefault();
      break;
    case 99: //c
      appendCell('code');
      e.preventDefault();
      break;
    case 109: //m
      appendCell('markdown');
      e.preventDefault();
      break;
    case 120: //x
      deleteCell();
      e.preventDefault();
      break;
  }
});

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
  var msg = Sk.ffi.remapToJs(e.args)[0]
  if (err_at.cell == CursorCell) {
    editor.getSession().setAnnotations([{
      row: err_at.line,
      text: msg,
      type: "error" // also warning and information
    }]);
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
  // BOOTS TODO - write a deep clone
  // hack to deep clone
  iPython = JSON.parse(JSON.stringify(starterNotebook))

  setCurrentPage("notebook")

  render() // TODO prevent python_eval until this is done
}

// BOOTS TODO
// - refactor into charts file
var _plot = function() {}

/**
 * [Global Deps]
 * `_plot`
 */
window.__plot2 = function(X,Y,colorName) {
  _plot(X,Y,colorName)
}

/**
 * [Global Deps]
 * `iPython`
 * `d3`
 * `zip`
 * `_plot`
 */
window.__plot1 = function(xmax,ymax) {

  iPython.cells[$cell].outputs = []
  var selector = "#plot" + $cell;
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 500 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

  var x = d3.scale.linear().range([0, width]);

  var y = d3.scale.linear().range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  d3.select("svg").remove()

  var svg = d3.select(selector).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(d3.extent([0,xmax])).nice();
    y.domain(d3.extent([0,ymax])).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
      .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")

    var legend = svg.selectAll(".legend")
        .data(color.domain())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

  var n = 0
  _plot = function(X,Y,colorName) {
    var color = d3.rgb(colorName);
    n++;
    svg.selectAll(".dot"+n)
        .data(zip(X,Y))
      .enter().append("circle")
        .attr("class", "dot"+n)
        .attr("r", 3.5)
        .attr("id", function(d) { return "p_" + d._id; })
        .attr("cx", function(d) { return x(d[0]); })
        .attr("cy", function(d) { return y(d[1]); })
        .style("fill", color)
        .on("click", function(d,x) {
          console.log("click",d,x)
        })
  }
}

/**
 * [Global Deps]
 * `React`
 */
var MarkdownCell = React.createClass({
  render: function() {
    return ( <div className="cell switch">
              <div className={displayClass(this)} dangerouslySetInnerHTML={rawMarkup(this.props.data.source)} />
            </div>)
  }
});

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

// BOOTS TODO
// - put in separate file
/**
 * [Global Deps]
 * `React`
 * `iPython`
 * `setCurrentPage`
 * `resetToStarterNotebook`
 */
var Menu = React.createClass({
  getInitialState: function() {
    return {active: false, download: false};
  },
  handleDownload: function(event) {
    this.setState({download: true});
  },
  handleClick: function(event) {
    this.setState({active: !this.state.active});
  },
  downloadPayload: function() {
    return 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(iPython));
  },
  handleUpload: function(event) {
    this.setState({active: false})
    window.history.pushState({}, "Upload", "/upload")
    setCurrentPage("upload")
  },
  handleNew: function(event) {
    this.setState({active: false})
    resetToStarterNotebook()
  },
  render: function() { return (
    <div id="menu" className={this.state.active ? "active" : ""}>
      <img src="/menu.png" alt="menu" onClick={this.handleClick} />
      <ul className="menu-content">
        <li><a href={this.downloadPayload()} id="downloader" download="notebook.ipynb">Download</a></li>
        <li onClick={this.handleNew}>New</li>
        <li onClick={this.handleUpload}>Upload</li>
        <li>Cheatsheet</li>
        <li>About</li>
      </ul>
    </div>
  )}
})


var Collaborators = require("./collaborators.jsx");


// BOOTS TODO
// - put in separate file
/**
 * [Global Deps]
 * `CODE`
 * `displayClass`
 * ``
 */
var CodeCell = React.createClass({
  html: function(data) { return (data && <div dangerouslySetInnerHTML={{__html: data.join("") }} />) },
  png:  function(data) { return (data && <img src={"data:image/png;base64," + data} />) },
  text: function(data) { return (data && <div className="pyresult">{data.join("")}</div>) },
  outputs:  function() { return (this.props.data.outputs.map(output =>
      this.html(output.data["text/html"]) ||
      this.png(output.data["image/png"])  ||
      this.text(output.data["text/plain"])
  ))},
 code: function() {
    return <div className={"code " + displayClass(this)}>{CODE.read(this.props.index)}</div>
 },
  render: function() { return (
    <div className="cell">
      <div className="switch">
        <div className="codewrap"> {this.code()} </div>
      </div>
      <div className="yields"><img src="/yield-arrow.png" alt="yields" /></div>
      {this.outputs()}
      <div id={"plot"+this.props.index} className="plot"></div>
    </div>)
  }
});

var Cell = React.createClass({
  subcell: function() {
    if (this.props.data.cell_type == "markdown")
      return <MarkdownCell data={this.props.data} index={this.props.index}/>
    else
      return <CodeCell data={this.props.data} index={this.props.index}/>
  },
  render: function() {
    return <div className={cursor(this.props.index)}> {this.subcell()} </div>
  }
})

var Uploader = React.createClass({
  render: function() {
    return <div id="upload">
             <h1>Drag files here</h1>
             <ul>
               <li className="ipynb"><code>.ipynb</code> notebook</li>
               <li className="csv">CSV data</li>
             </ul>
           </div>
  }
})

var Notebook = React.createClass({
  cells: function() {
    return this.props.data.cells.map((cell,index) => <Cell data={cell} index={index}/>)
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

// BOOTS TODO
// - separate into index.js
/**
 * [Global Deps]
 * `iPythonRaw`
 * `DataRaw`
 * parse_raw_notebook
 * setCurrentPage
 * starterNotebook
 * resetToStarterNotebook()
 */
asyncRunParallel([loadPandas, loadPyPlot, loadMatplot], function(err, results) {
  if (err) {
    console.log("Error loading python libraries!", err);
    return;
  }
  results.forEach((message) => console.log(message));

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
});

function loadPandas(callback) {
  $.get("./pandas.js", function(js) {
    Sk.builtinFiles["files"]["./pandas.js"] = js;
    callback(null, "Loaded up some pandas");
  }).fail(function() {
    callback(new Error("pandas.js failed to load from server."));
  });
}

function loadPyPlot(callback) {
  $.get("./pyplot.js", function(js) {
    Sk.builtinFiles["files"]["./matplotlib/pyplot.js"] = js;
    callback(null, "Loaded up some pyplot");
  }).fail(function() {
    callback(new Error("pyplot.js failed to load from server."));
  });
}

function loadMatplot(callback) {
  $.get("/matplotlib.js",function(js) {
    Sk.builtinFiles["files"]["./matplotlib.js"] = js;
    callback(null, "Loaded up some matplot");
  }).fail(function() {
    callback(new Error("matplotlib.js failed to load from server."));
  });
}

// BOOTS
// 
// The following is an (exported) interface 
// for other files to access state from this module.

module.exports = {
  getiPython: () => iPython,
  getMode   : () => Mode,
  getPeerPresence: () => peerPresence,
};
