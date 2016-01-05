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
    }
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
    let result = this.props.codeResults[id];
    let plotsData = this.props.codePlotsData[id];
    let error = this.props.errors[this.props.codeList.indexOf(id)];
    return (
      <CodeCellV2 
        key={id} index={id} 
        result={result}
        code={code}
        error={error} 
        plotsData={plotsData}
        store={this.props.store}
        handleEditorChange={this.handleEditorChange} />
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

  currentPage() {
    let getCurrentPage = this.props.getCurrentPage;
    if (getCurrentPage) {
      return getCurrentPage();
    }
    else {
      console.log("Get current page not defined.");
    }
  },

  getInitialState() {
    return {
      codeList: [],
      codeMap: {},
      results: {},
      errors: {},
      plots: {},
    };
  },

  componentWillMount() {
    this.setState({
      codeList: this.props.codeList,
      codeMap: this.props.codeMap,
      errors: this.props.errors,
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

  handleNewResult(codeListIndex, result) {
    let id = this.state.codeList[codeListIndex];
    if (id === undefined) return; // stops us from rendering result of cell that has since been deleted

    let nextResults = {...this.state.results};
    nextResults[id] = result;

    this.setState({ results: nextResults, });

    // this.props.store.dispatch({
    //   type: "NEW_RESULT",
    //   data: {
    //     codeListIndex,
    //     result,
    //   }
    // });

  },

  handleNewPlot(codeListIndex, plotData) {
    let id = this.state.codeList[codeListIndex];
    if (id === undefined) return; // stops us from rendering plot of cell that has since been deleted

    let nextPlots = {...this.state.plots};
    nextPlots[id] = plotData;

    this.setState({ plots: nextPlots, });

    // this.props.store.dispatch({
    //   type: "NEW_PLOT",
    //   data: {
    //     codeListIndex,
    //     plotData,
    //   }
    // });
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
    this.props.executePython(codeBlocks, this.handleNewResult, this.handleNewPlot, this.handleNewErrors); // mem: NEXT_CALLBACK
  },

  syncNotebook() {
    let html = document.querySelector("[contenteditable='true']").innerHTML
    this.props.onUpdateNotebook(html,this.state)
  },

  handleOverlayMount() {
    this.forceUpdate();
  },

  render() {
    let currentPage = this.currentPage();
    switch (currentPage) {
      case "landing":
        return <div className="notebook"></div>;
      case "upload":
        return <div className="notebook"><Uploader startNewNotebook={this.props.startNewNotebook} /></div>
      case "notebook":
        return this.renderNotebook();
    }
  },

  renderNotebook() {
    return (
      <div className="notebook">
        <Editor 
          results={this.state.results} 
          text={this.props.html} 
          onCodeChange={this.handleCodeChange}
          onClick={this.handleEditorClick} 
          getCurrentCodeList={ () => this.state.codeList}
          getCurrentCode={this.getCurrentCode} 
          assignForceUpdate={this.props.assignForceUpdate}/> 
        <CodeOverlaysContainer 
          errors={this.state.errors}
          handleOverlayMount={this.handleOverlayMount}
          store={this.props.store}
          codePlotsData={this.state.plots}
          codeResults={this.state.results}
          codeList={this.state.codeList} 
          codeMap={this.state.codeMap}
          getCurrentCode={this.getCurrentCode}
          handleEditorChange={this.handleEditorChange} /> 
      </div>
    );
  }
});

module.exports = NotebookV2;
