const React = require('react');
const ReactDOM = require('react-dom');

const CodeCellV2 = require('./code-cell-v2');

const CodeOverlaysContainer = React.createClass({

  componentDidMount() {
    this.props.handleOverlayMount();
    document.body.addEventListener("keydown", this.blurEditorOnEsc)
  },

  componentWillUnmount() {
    document.body.removeEventListener("keydown", this.blurEditorOnEsc)
  },

  blurEditorOnEsc({ which }) {
    let ESC = 27;
    if (which === ESC) {
      this.restoreMediumEditorCursor();
    }
  },

  restoreMediumEditorCursor() {
    this.props.focusOnSelectedOverlay();
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
    const locals = doc.locals[id];
    return (
      <CodeCellV2
        key={id}
        index={id}
        result={result}
        code={code}
        error={error}
        plots={plots}
        locals={locals}
        store={this.props.store}
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

module.exports = CodeOverlaysContainer 
