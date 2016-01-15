const React = require('react');
const ReactDOM = require('react-dom');
const Helmet = require('react-helmet');
const Uploader = require("./uploader.jsx");
const Editor = require('./notebook-flowing-editor');
const CodeCellV2 = require('./code-cell-v2');
const Collaborators = require("./collaborators");

const { eventFire } = require("../util");

const CodeOverlaysContainer = React.createClass({

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

  doc() {
    return this.props.store.getState().doc
  },

  createCodeCell(id) {
    const doc    = this.doc();
    const code   = doc.codeMap[id];
    const result = doc.results[id];
    const plots  = doc.plots[id];
    const error  = doc.errors[id];
    return (
      <CodeCellV2
        key={id} index={id}
        result={result}
        code={code}
        error={error}
        plots={plots}
        store={this.props.store}
        handleEditorChange={this.props.handleEditorChange}
        focusEditorOnPlaceholder={this.props.focusEditorOnPlaceholder} />
    );
  },

  renderCodeCells() {
    return this.doc().codeList.map(this.createCodeCell);
  },

  render() {
    return (
      <div data-livebook-overlays="">
        {this.renderCodeCells()}
      </div>
    );
  }
});

const NotebookV2 = React.createClass({

  doc() {
    return this.props.store.getState().doc
  },

  componentWillMount() {
  },

  componentWillUpdate() {
    const renderLandingPage = this.props.renderLandingPage;
    renderLandingPage && renderLandingPage();
  },

  handleEditorClick() {
    this.hideCodeEditor();
  },

  hideCodeEditor() {
    if (this.props.hideCodeEditor) {
      this.props.hideCodeEditor();
    }
  },

  handleEditorChange(id, code) {
    const codeList = this.doc().codeList
    const codeDelta = {}; codeDelta[id] = code;
    const data = { codeList, codeDelta }
    this.props.store.dispatch({ type: "CODE_DELTA", data })
  },

  handleOverlayMount() {
    this.forceUpdate();
  },

  render() {
    const path = window.location.pathname;
    const isFullOfStuff = path !== "/" && path.indexOf("/upload") !== 0;

    if (isFullOfStuff) {
     return (
       <div className="notebook">{ this.renderEditorAndOverlays()}</div>
     ); 
    }

    return (
      <div className="notebook"></div>
    );
  },

  renderEditorAndOverlays() {
    
    return (
      <div className="editor-wrapper" data-livebook-editor-wrapper="true">
        <Helmet title="Livebook Notebook" />
        <Editor
          store={this.props.store}
          onClick={this.handleEditorClick}
          assignForceUpdate={this.props.assignForceUpdate}
          assignFocusOnSelectedOverlay={this.props.assignFocusOnSelectedOverlay}
          assignFocusEditorOnPlaceholder={this.props.assignFocusEditorOnPlaceholder}/>
        <CodeOverlaysContainer
          store={this.props.store}
          handleOverlayMount={this.handleOverlayMount}
          handleEditorChange={this.handleEditorChange}
          focusOnSelectedOverlay={this.props.focusOnSelectedOverlay}
          focusEditorOnPlaceholder={this.props.focusEditorOnPlaceholder} />
        <Collaborators peers={this.props.getPeers()}/>
      </div>
    );
  }
});

module.exports = NotebookV2;
