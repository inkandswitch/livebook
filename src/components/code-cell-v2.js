const React = require("react");
const ReactDOM = require("react-dom");
const ace        = require("brace");
const Range      = ace.acequire('ace/range').Range;
const AceEditor  = require("react-ace");

ace.config.set("basePath", "/");

const { stopTheBubbly } = require("../util");

const PlotContainer = require("./code-cell-plot-container");

const CodeCellOutput = React.createClass({
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

const CodeCell = React.createClass({
  getInitialState() {
    return { editor: null };
  },

  componentDidMount() {
    const editor = document.querySelector("#editor" + this.props.index);
    if (editor) editor.addEventListener("click", stopTheBubbly);
  },

  componentWillUnmount() {
    const editor = document.querySelector("#editor" + this.props.index);
    if (editor) editor.removeEventListener("click", stopTheBubbly);
    this.state.editor.destroy();
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
    containerParent.firstChild.style.display = "none"; // hide the code block
    container.style.display = "block";
  },

  createAceEditor() {
    let change, onBeforeLoad, onLoad;
    const lang = "python";

    onLoad = (editor) => {

      this.sizeEditor(editor);

      editor.selection.on("changeSelection", (event, selection) => {
        let wordRange = selection.getWordRange();
        if (!selection.$isEmpty) {
          if (editor.getSelectedText) {
            let text = editor.getSelectedText();
          }
          else {}
        }
        else {}
      });

      this.setState({ editor });
    };

    change = (text) => {
      this.handleEditorChange(text)
    };

    onBeforeLoad = () => {};

    return (
      <AceEditor className="editor" name={"editor" + this.props.index}
        key={this.props.index}
        mode={lang} value={this.props.code}
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