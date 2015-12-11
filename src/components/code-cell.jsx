let React = require("react");

let PlotContainer = require("./code-cell-plot-container");

let CodeCellOutput = React.createClass({
  componentDidUpdate() {
    // TODO - truncate table after update?
  },
  
  parseOutput(output) {
    let {data} = output;

    if (data["text/html"]) {
      return this.html(data["text/html"]);
    }

    if (data["image/png"]) {
      return this.png(data["image/png"]);
    }

    if (data["text/plain"]) {
      return this.text(data["text/plain"]);
    }

    return [];
  },

  html(data) {
    //fixme - cuts off table
    let styles = { overflowX: "hidden", };
    let htmlString = data.join("");
    return (<div style={styles} dangerouslySetInnerHTML={{__html: htmlString }}></div>);
  },

  png(data) {
   return (<img src={"data:image/png;base64," + data} />);
  },

  text(data) {
    let className = this.props.className;
    let getPlotContainers = this.props.getPlotContainers;
    return (
      <div className={className}>
        {data.join("")}
        {getPlotContainers()}
      </div>
    );
  },

  render() {
    return (
      <div>
        {this.props.outputs.map(this.parseOutput)}
      </div>
    );
  },
});

let CodeCell = React.createClass({

  underConstruction() {
    return (this.props.typing && this.props.index >= this.props.cursor);
  },

  appendLoadingClass(className) {
    return className + " pyresult-loading";
  },

  hasError() {
    return !!this.props.errorObject;
  },

  errorMessage() {
    if (!this.hasError()) return "";

    let errorObject = this.props.errorObject,
        message = errorObject.message,
        className = "pyresult pyresult-error";

    if (this.underConstruction())
      className = this.appendLoadingClass(className);

    return (<div className={className}>{message}</div>);
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

  outputs() {
    let outputs = this.props.data.outputs;
    if (outputs.length === 0) {
      return (<div className="pyresult pyresult-loading pyresult-loading-with-message"></div>);
    }

    let className = "pyresult";
    if (this.underConstruction())
      className = this.appendLoadingClass(className);
    return (
        <CodeCellOutput 
          outputs={outputs} 
          className={className} 
          getPlotContainers={this.getPlotContainers} />
      );
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
