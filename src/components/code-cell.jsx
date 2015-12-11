var React = require("react");

var PlotContainer = require("./code-cell-plot-container");

var CodeCell = React.createClass({

  underConstruction() {
    return (this.props.typing && this.props.index >= this.props.cursor);
  },

  errorMessage() {
    var errorObject = this.props.errorObject,
        line,
        message;

    if (!errorObject) return "";

    message = errorObject.message;

    var klass = "pyresult pyresult-error"
    if (this.underConstruction()) klass += " under-construction"

    return (
      <div className={klass}>
        {message}
      </div>
    );
  },

  html(data) {
    return (data && <div dangerouslySetInnerHTML={{__html: data.join("") }}></div>);
  },

  png(data) {
   return (data && <img src={"data:image/png;base64," + data} />);
  },

  getPlotContainers() {
    let notebook = this.props.notebook;
    let iPython = notebook.getiPython();
    let getCellPlots = notebook.getCellPlots;
    let cellIndex = this.props.index;
    let cell = iPython.cells[cellIndex];
    let plots = getCellPlots(cell);

    if (!plots) return "";

    return plots.map((p, i) => {
      let key = cellIndex + "-" + i;
      return (
        <PlotContainer 
          cell={cell} 
          cellIndex={cellIndex} 
          cellPlotIndex={i} 
          key={key} 
          plotMessage={p}/>
      );
    })
  },

  text(data) {
    var className = "pyresult";
    if (this.underConstruction()) className += " pyresult-loading"
    if (!data) return false;
    return (
      <div className={className}>
        {data.join("")}
        {this.getPlotContainers()}
      </div>
    );
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
    if (!result.length) {
      return (
        <div className="pyresult pyresult-loading pyresult-loading-with-message"></div>
      );
    }
    return result;
  },

 code() {
    var displayClass = this.props.notebook.displayClass;
    var CODE         = this.props.notebook.getCODE();

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
          </div>
        </div>
        {this.errorMessage()}
        {this.outputs()}
      </div>
    );
  }
});

module.exports = CodeCell;
