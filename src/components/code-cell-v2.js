let React = require("react");
let ReactDOM = require("react-dom");
let ace        = require("brace");
let Range      = ace.acequire('ace/range').Range;
let AceEditor  = require("react-ace");


let PlotContainer = require("./code-cell-plot-container");

let CodeCellOutput = React.createClass({
  componentDidUpdate() {
    // TODO - truncate table after update?
  },

  parseOutput(output, key) {
    let {data} = output;

    if (data["text/html"]) {
      return this.html(data["text/html"], key);
    }

    if (data["image/png"]) {
      return this.png(data["image/png"], key);
    }

    if (data["text/plain"]) {
      return this.text(data["text/plain"], key);
    }

    return [];
  },

  html(data, key) {
    //fixme - cuts off table
    let styles = { overflowX: "hidden", };
    let htmlString = data.join("");
    return (
      <div style={styles} 
          key={key}
          dangerouslySetInnerHTML={{__html: htmlString }}></div>
    );
  },

  png(data, key) {
   return (<img src={"data:image/png;base64," + data} key={key} />);
  },

  text(data, key) {
    let className = this.props.className;
    let getPlotContainers = this.props.getPlotContainers;
    return (
      <div className={className} key={key} >
        {data.join("")}
        {getPlotContainers()}
      </div>
    );
  },

  render() {
    return (
      <div>
        {this.props.outputs.map(this.parseOutput)}
      </div>
    );
  },
});

let CodeCell = React.createClass({
  componentDidMount() {
    const editor = document.querySelector("#editor" + this.props.index);
    if (editor)
      editor.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      })
  },

  underConstruction() {
    return (this.props.typing && this.props.index >= this.props.cursor);
  },

  appendLoadingClass(className) {
    return className + " pyresult-loading";
  },

  hasError() {
    return !!this.props.error;
  },

  errorMessage() {
    if (!this.hasError()) return "";

    let errorObject = this.props.error,
        message = errorObject.message,
        className = "pyresult pyresult-error";

    if (this.underConstruction())
      className = this.appendLoadingClass(className);

    return (<div className={className}>{message}</div>);
  },

  getPlotContainers() {
    let {plots} = this.props;
    if (!plots || !plots.length) return (<div/>);

    return plots.map( (p, i) => {
      let cellIndex = this.props.index;
      let key = cellIndex + "-" + i;
      return (
        <PlotContainer 
          cellIndex={cellIndex} 
          cellPlotIndex={i} 
          key={key} 
          plotMessage={p}/>
      );
    });
  },

  outputs() {
    let outputs = this.props.result || [];

    if (outputs.length === 0) {
      if (this.props.code) {
        return (<div className="pyresult pyresult-loading pyresult-loading-with-message"></div>);        
      }
      return (<div className="pyresult"></div>);        
    }

    let className = "pyresult";
    if (this.underConstruction())
      className = this.appendLoadingClass(className);
    return (
        <CodeCellOutput 
          outputs={outputs} 
          className={className} 
          getPlotContainers={this.getPlotContainers} />
      );
  },

  code() {
    return (
      <div className="code">{this.props.code}</div>
    );
  },

  // handleClick(event) {
  //   let {index} = this.props;
  //   let {code} = this.props;
  //   let node = ReactDOM.findDOMNode(event.currentTarget);
  //   let handleChange = this.handleEditorChange;

  //   this.props.store.dispatch({
  //     type: "OPEN_CODE_EDITOR",
  //     editorProps: {
  //       index,
  //       node,
  //       handleChange,
  //     },
  //   });

  // },

  // handleEditorChange(newText) {
  //   this.props.handleEditorChange(this.props.index, newText);
  // },

  handleEditorChange(code) {
    const codeList = this.props.store.getState().doc.codeList;
    const id = this.props.index;
    const codeDelta = {}; 
    codeDelta[id] = code;
    const data = { codeList, codeDelta };
    this.props.store.dispatch({ type: "CODE_DELTA", data })
  },

  sizeEditor(editor) {
    const container = editor.container;
    const containerParent = container.parentElement;
    const { height, width } = containerParent.getBoundingClientRect();
    const leftPadding = +getComputedStyle(containerParent, null).getPropertyValue('padding-left').replace("px","");
    const rightPadding = +getComputedStyle(containerParent, null).getPropertyValue('padding-right').replace("px","");
    const topPadding = +getComputedStyle(containerParent, null).getPropertyValue('padding-top').replace("px","");
    // const bottomPadding = +getComputedStyle(containerParent, null).getPropertyValue('padding-bottom').replace("px","");

    container.style.height = (height - topPadding) + "px";
    container.style.width = (width - leftPadding - rightPadding) + "px";
    containerParent.firstChild.style.display = "none" // DO NOT REMOVE the static code -- it messes with react
    container.style.display = "block";
  },

  createAceEditor() {
    const handleEditorChange = this.handleEditorChange;
    let height, width, change, onBeforeLoad, onLoad, lang;

    lang = "python";
    onLoad = (editor) => {
      this.sizeEditor(editor);
    };
    change = (text) => {
      handleEditorChange(text)
    };
    onBeforeLoad = () => {};

    return (
      <AceEditor className="editor" name={"editor" + this.props.index}
        key={this.props.index}
        mode={lang} value={this.props.code}
        height={height} width={width}
        theme="github" onChange={change}
        showGutter={false}
        editorProps={{$blockScrolling: true,}}
        onBeforeLoad={onBeforeLoad} onLoad = {onLoad} />
    );
  },

  render() {

    const id = "overlay" + this.props.index;
    const onClick = (e) => {
      const placeholder = this.props.focusEditorOnPlaceholder(this.props.index);
    };

    return (
      <div>
        <div ref="codeCellContainer" className="notebook" id={id} onClick={onClick}>
          <div className="cell-wrap">
            <div className="cell" data-cell-index={this.props.index}>
              <div className="switch">
                <div className="codewrap">
                  <div>
                    {this.code()}
                  </div>
                  {this.createAceEditor()}
                </div>
              </div>
              {this.errorMessage()}
              {this.outputs()}
            </div>
          </div>
        </div>

      </div>
    );
  }
});

module.exports = CodeCell;



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
