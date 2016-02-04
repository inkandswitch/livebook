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

  componentDidUpdate() {
    this.validateCollaboratorCodeCells()
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

  getCollaboratorCodeCells() {
    const peers = this.props.peers;
    // find code cells corresponding...
    // use the cell-index (?)
    if (!peers) return;
    const cursors = peers.slice(1).map(p => {
      if (!p.state.cursor) return false;
      const nodeId = p.state.cursor;
      const node = document.querySelector("[livebook-node-id='" + nodeId + "']")
      if (!node) return false;
      const placeholder = node.querySelector("[data-livebook-placeholder-cell]");
      if (!placeholder) return false;
      const codeCellIndex = placeholder.id.replace("placeholder", "");
      if (codeCellIndex !== 0 && !codeCellIndex) return false;
      return {
        index: codeCellIndex,
        color: p.state.color,
      };
    }).filter(c => c);

    return cursors;
  },

  validateCollaboratorCodeCells() {
    const peers = this.props.peers;
    // find code cells corresponding...
    // use the cell-index (?)
    if (!peers) return;
    const cursors = peers.slice(1).forEach(p => {
      const session = p.session;
      const node = document.querySelector("[data-livebook-sessions*='" + session + "']");
      if (!node) return;
      const placeholder = node.querySelector("[data-livebook-placeholder-cell]");
      if (!placeholder) return;
      const id = parseInt(placeholder.id.replace("placeholder", ""));
      if (!id) return;
      const overlay = document.querySelector("#overlay" + id);
      if (!overlay) return;
    });
  },

  createCodeCell(id, peerCells=[]) {
    const doc    = this.doc();
    const code   = doc.codeMap[id];
    const result = doc.results[id];
    const plots  = doc.plots[id];
    const error  = doc.errors[id];
    const locals = doc.locals[id];

    const peerHighlights = peerCells.find((pc) => { return pc.index === id });

    return (
      <CodeCellV2
        getColor={this.props.getColor}
        peerHighlights={peerHighlights}
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
    const peerCells = this.getCollaboratorCodeCells();
    return this.doc().codeList.map((id) => this.createCodeCell(id, peerCells));
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
