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

  errorMessage() {
    var errorObject = this.props.errorObject,
        line,
        message;

    if (!errorObject) return "";

    message = errorObject.message;

    return (
      <div className="pyresult pyresult-error">
        {message}
      </div>
    );
  },

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
      var output = this.html(output.data["text/html"]) ||
        this.png(output.data["image/png"])  ||
        this.text(output.data["text/plain"]);
      return output;
    });
    return result;
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
    var hideMe = {display: "none",};
    return (
      <div className="cell" data-cell-index={this.props.index}>
        <div className="switch">
          <div className="codewrap">
            {this.code()}
            <img src="/yield-arrow.png" className="yield-arrow" />
          </div>
        </div>
        {this.errorMessage()}
        {this.outputs()}
        <div id={"plot"+this.props.index} className="plot"></div>
      </div>
    );
  }
});

module.exports = CodeCell;
