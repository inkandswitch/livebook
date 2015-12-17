let React = require('react');
let ReactDOM = require('react-dom');
let Editor = require('./notebook-flowing-editor');
let CodeCellV2 = require('./code-cell-v2');

let {htmlToIPy} = require("../ipython-converter");

let CodeOverlaysContainer = React.createClass({

  createCodeCell(id, pythonCode) {
    let fakeData = { outputs: [], }; // mock some data so the comoponent does not throw an error...
    return (
      <CodeCellV2 key={id} index={id} 
        code={pythonCode} data={fakeData} 
        handleClick={this.handleCodeCellClick} />
    );
  },

  handleCodeCellClick(codeCellData) {
    return this.props.handleCodeCellClick(codeCellData);
  },

  renderCodeCells() {
    let code = this.props.code;
    let notebookCode = Object.keys(code).map((id) => this.createCodeCell(id, code[id]));
    return notebookCode;
  },

  render() {
    return (
      <div data-livebook-overlays>
        {this.renderCodeCells()}
      </div>
    );
  }
});


let NotebookV2 = React.createClass({

  handleChange(html, medium) {
    // TODO - save every 5th change or something?
    // serialize HTML
    // debugger;
    let ipython = htmlToIPy(html);
    // debugger;
  },

  handleCodeCellClick(codeCellData) {
    let {index, code, node} = codeCellData;
    let nodeBox = node.getBoundingClientRect();
    let {top, left, height, width} = nodeBox;
    let position = {top, left};

    let change = codeCellData.handleChange;

    this.renderEditor({
      code,
      height,
      width,
      position,
      change,
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

  renderEditor(options) {
    if (this.props.renderCodeEditor) {
      this.props.renderCodeEditor(options);
    }
  },

  render() {
    return (
      <div className="notebook">
        <Editor text={this.props.html} onChange={this.handleChange} onClick={this.handleEditorClick} /> 
        <CodeOverlaysContainer code={this.props.code} handleCodeCellClick={this.handleCodeCellClick} /> 
      </div>
    );
  },
});

module.exports = NotebookV2;