let React = require('react');
let ReactDOM = require('react-dom');
var Uploader = require("./uploader.jsx");
let Editor = require('./notebook-flowing-editor');
let CodeCellV2 = require('./code-cell-v2');

let {htmlToIPy} = require("../ipython-converter.jsx");

let CodeOverlaysContainer = React.createClass({

  hideCodeEditorOnEsc(event) {
    if (event.which === 27) {
      this.props.store.dispatch({ type: "CLOSE_CODE_EDITOR", })
      this.restoreMediumEditorCursor();
    }
  },

  restoreMediumEditorCursor() {
    this.props.focusOnSelectedOverlay();
  },

  componentWillMount() {
    document.body.addEventListener("keydown", this.hideCodeEditorOnEsc);
  },

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.hideCodeEditorOnEsc);
  },

  componentDidMount() {
    this.props.handleOverlayMount();
  },

  createCodeCell(id) {
    let code = this.props.codeMap[id];
    let result = this.props.codeResults[this.props.codeList.indexOf(id)];
    let plotsData = this.props.codePlotsData[this.props.codeList.indexOf(id)];
    let error = this.props.errors[this.props.codeList.indexOf(id)];
    return (
      <CodeCellV2
        key={id} index={id}
        result={result}
        code={code}
        error={error}
        plotsData={plotsData}
        store={this.props.store}
        handleEditorChange={this.handleEditorChange}
        focusEditorOnPlaceholder={this.props.focusEditorOnPlaceholder} />
    );
  },

  handleEditorChange(id, code) {

    this.props.store.dispatch({
      type: "CODE_EDITOR_CHANGE",
      data: { id, code, },
    });

    this.props.handleEditorChange(id, code);
  },

  renderCodeCells() {
    let codeList = this.props.codeList;
    return codeList.map(this.createCodeCell);
  },

  render() {
    return (
      <div data-livebook-overlays="">
        {this.renderCodeCells()}
      </div>
    );
  }
});

let NotebookV2 = React.createClass({

  componentWillMount() {
  },

  componentWillUpdate() {
    let renderLandingPage = this.props.renderLandingPage;
    renderLandingPage && renderLandingPage();
  },

  getInitialState() {
    return {
      codeList: [],
      codeMap: {},
    };
  },

  componentWillMount() {
    this.setState({
      codeList: this.props.doc.codeList,
      codeMap: this.props.doc.codeMap,
    });
  },

  handleEditorClick() {
    this.hideCodeEditor();
  },

  hideCodeEditor() {
    if (this.props.hideCodeEditor) {
      this.props.hideCodeEditor();
    }
  },

  handleNewErrors(errors) {
    this.setState({ errors });
  },

  getCurrentCode(id) {
    return this.state.codeMap[id];
  },

  handleEditorChange(id, code) {
    let nextCodeMap = {...this.state.codeMap};
    nextCodeMap[id] = code;
    this.setState({ codeMap: nextCodeMap, });

    this.executePython();
    this.syncNotebook();
  },

  handleCodeChange(data) {
    let {codeDelta, codeList} = data; // rename codeDelta to "newCode", orion was right
    let {codeMap} = this.state;
    let nextCodeMap = {...codeMap, ...codeDelta}; // same as `Object.assign({}, codeMap, codeDelta);``

    this.setState({
      codeMap: nextCodeMap,
      codeList,
    });

    this.executePython()
    this.syncNotebook();
  },

  executePython() {
    let codeBlocks = this.state.codeList.map((id) => this.state.codeMap[id])
    this.props.executePython(codeBlocks);
  },

  syncNotebook() {
    let html = document.querySelector("[contenteditable='true']").innerHTML
    this.props.onUpdateNotebook(html,this.state)
  },

  handleOverlayMount() {
    this.forceUpdate();
  },

  render() {
    const path = window.location.pathname;
    const isFullOfStuff = path !== "/" && path.indexOf("/upload") !== 0;
    return (
      <div className="notebook">{ isFullOfStuff ? this.renderEditorAndOverlays() : "" }</div>
    );
  },

  renderEditorAndOverlays() {
    let r = this.props.doc.results
    return (
      <div>
      <Editor
        results={this.props.doc.results}
        text={this.props.doc.html}
        onCodeChange={this.handleCodeChange}
        onClick={this.handleEditorClick}
        getCurrentCodeList={ () => this.state.codeList}
        getCurrentCode={this.getCurrentCode} 
        assignForceUpdate={this.props.assignForceUpdate}
        assignFocusOnSelectedOverlay={this.props.assignFocusOnSelectedOverlay}
        assignFocusEditorOnPlaceholder={this.props.assignFocusEditorOnPlaceholder}/>
      <CodeOverlaysContainer
        errors={this.props.doc.errors}
        handleOverlayMount={this.handleOverlayMount}
        store={this.props.store}
        codePlotsData={this.props.doc.plots}
        codeResults={this.props.doc.results}
        codeList={this.state.codeList}
        codeMap={this.state.codeMap}
        getCurrentCode={this.getCurrentCode}
        handleEditorChange={this.handleEditorChange}
        focusOnSelectedOverlay={this.props.focusOnSelectedOverlay}
        focusEditorOnPlaceholder={this.props.focusEditorOnPlaceholder} />
      </div>
    );
  }
});

module.exports = NotebookV2;
