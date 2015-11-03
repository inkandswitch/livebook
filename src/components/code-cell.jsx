var React = require("react");

function requireGlobalDeps() {
  return require("../notebook.jsx");
}

/**
 * [Global Deps]
 * `CODE`
 * `displayClass`
 */
var CodeCell = React.createClass({

  html(data) {
    return (data && <div dangerouslySetInnerHTML={{__html: data.join("") }} />);
  },

  png(data) {
   return (data && <img src={"data:image/png;base64," + data} />);
  },

  text(data) {
    return (data && <div className="pyresult">{data.join("")}</div>);
  },

  outputs() {
    // Precedence
    // - return html if we find html
    // - else return png if we find png
    // - else return text if we find text

    var result = this.props.data.outputs.map(output => {
      return this.html(output.data["text/html"]) ||
        this.png(output.data["image/png"])  ||
        this.text(output.data["text/plain"]);
    });
    return (result)
  },

 code() {
    var displayClass = requireGlobalDeps().displayClass;
    var CODE         = requireGlobalDeps().getCODE();

    return (
      <div className={"code " + displayClass(this)}>
        {CODE.read(this.props.index)}
      </div>
    );
 },

  render() {
    return (
      <div className="cell">
        <div className="switch">
          <div className="codewrap">
            {this.code()}
          </div>
        </div>
        {this.outputs()}
        <div id={"plot"+this.props.index} className="plot"></div>
      </div>
    );
  }
});

module.exports = CodeCell;