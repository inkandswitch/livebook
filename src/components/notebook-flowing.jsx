let React = require('react');
let ReactDOM = require('react-dom');
let Editor = require('./notebook-flowing-editor');

let orionPlugin = {
  serializeHTML: () => {},
  saveHTML: (html) => { /* */ },
  export: () => {},
}

// Props:
// - HTML
// - list of ids
// - code blocks
// - (mapping between list of ids and codeblocks)

let NotebookV2 = React.createClass({

  handleChange(html, medium) {
    // TODO - save every 5th change or something?
    // serialize HTML
    // debugger;
  },

  renderCode() {
    let code = this.props.code;
    let notebookCode = Object.keys(code).map((id) => make_notebook(id, code[id]) );
    return notebookCode;
  },

  render() {
    return (
      <div className="notebook">
        <Editor text={this.props.html} onChange={this.handleChange} />   
        {this.renderCode()}
      </div>
    );
  },
});

module.exports = NotebookV2;


function make_notebook(id, code) {
  return (
    <div className="notebook" id={"overlay" + id}>
        <div className="cell-wrap" style={{position: "relative",}}>
            <div className="cell" data-cell-index="1">
                <div className="switch">
                    <div className="codewrap">
                        <div className="code ">{code}</div>
                    </div>
                </div>
                <span></span>
                <div>
                    <div className="pyresult"><span>None</span>
<span></span></div>
                </div>
            </div>
        </div>
    </div>);
};