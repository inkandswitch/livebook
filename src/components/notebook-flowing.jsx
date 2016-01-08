const React = require('react');
const ReactDOM = require('react-dom');
let Uploader = require("./uploader.jsx");
let Editor = require('./notebook-flowing-editor');
let CodeCellV2 = require('./code-cell-v2');

const NewNotebookForm = () => ({
  componentDidMount() {
    this.refs.title.focus();
  },

  handleSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    const title = this.refs.title.value;
    this.setTitle(title)
  },

  setTitle(title) {
    const type = "UPDATE_HTML";
    const html = `<h1>${title}</h1>`
    this.props.store.dispatch({ type, html });
  },

  render() {
    const placeholderText = "What will you title your notebook?";
    return (
      <form className="notebook-title-form" onSubmit={(e) => this.handleSubmit(e)}>
        <input className="notebook-title-input" ref="title" type="text" placeholder={placeholderText} />
        <button onClick={(e) => this.handleSubmit(e)}> Stuff </button>
      </form>
    );
  }
})

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

  isDocEmpty() {
    const editorElement = document.querySelector("[data-medium-editor-element]");
    if (!editorElement) return false; // FIXME
    const editorTextContent = editorElement.textContent.trim();
    const isNoText = !editorTextContent;
    return isNoText;
  },

  render() {
    const path = window.location.pathname;
    const isFullOfStuff = path !== "/" && path.indexOf("/upload") !== 0;

    if (this.isDocEmpty()) {
      return (
        <div className="notebook">
          <NewNotebookForm store={this.props.store} />
        </div>
      );
    }

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
      <div>
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
      </div>
    );
  }
});

module.exports = NotebookV2;
