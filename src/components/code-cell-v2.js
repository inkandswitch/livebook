let React = require("react");
let ReactDOM = require("react-dom");

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
    return !!this.props.error;
  },

  errorMessage() {
    if (!this.hasError()) return "";

    let errorObject = this.props.error,
        message = errorObject.message,
        className = "pyresult pyresult-error";

    if (this.underConstruction())
      className = this.appendLoadingClass(className);

    return (<div className={className}>{message}</div>);
  },

  getPlotContainers() {
    let {plotsData} = this.props;
    if (!plotsData || !plotsData.length) return (<div/>);

    return plotsData.map( (p, i) => {
      let cellIndex = this.props.index;
      let key = cellIndex + "-" + i;
      return (
        <PlotContainer 
          cellIndex={cellIndex} 
          cellPlotIndex={i} 
          key={key} 
          plotMessage={p}/>
      );
    });
  },

  outputs() {
    let outputs = this.props.result || [];

    if (outputs.length === 0) {
      if (this.props.code) {
        return (<div className="pyresult pyresult-loading pyresult-loading-with-message"></div>);        
      }
      return (<div className="pyresult"></div>);        
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
    return (
      <div className="code">{this.props.code}</div>
    );
  },

  handleClick(event) {
    let {index} = this.props;
    let {code} = this.props;
    let node = ReactDOM.findDOMNode(event.currentTarget);
    let handleChange = this.handleEditorChange;

    this.props.store.dispatch({
      type: "OPEN_CODE_EDITOR",
      editorProps: {
        code,
        node,
        handleChange,
      },
    });
  },

  handleEditorChange(newText) {
    this.props.handleEditorChange(this.props.index, newText);
  },

  render() {
    let id = "overlay" + this.props.index;
    return (
      <div className="notebook" id={id}>
        <div className="cell-wrap">
          <div className="cell" data-cell-index={this.props.index}>
            <div className="switch" onClick={this.handleClick}>
              <div className="codewrap">
                {this.code()}
              </div>
            </div>
            {this.errorMessage()}
            {this.outputs()}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = CodeCell;
