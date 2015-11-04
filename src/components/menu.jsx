var React = require("react");

function requireGlobalDeps() {
  return require("../notebook.jsx");
}

/**
 * [Global Deps]
 * `iPython`
 * `setCurrentPage`
 */
var Menu = React.createClass({
  getInitialState() {
    return {
      active: false,
      download: false,
    };
  },

  handleDownload(event) {
    this.setState({download: true});
  },

  handleClick(event) {
    this.setState({active: !this.state.active});
  },

  downloadPayload() {
    if (requireGlobalDeps().getiPython == undefined) return ""; // FIXME - circular dependancy
    var iPython = requireGlobalDeps().getiPython();
    return 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(iPython));
  },

  handleUpload(event) {
    var setCurrentPage = requireGlobalDeps().setCurrentPage
    this.setState({active: false});
    window.history.pushState({}, "Upload", "/upload");
    setCurrentPage("upload");
  },

  render() {
    return (
      <div id="menu" className={this.state.active ? "active" : ""}>
        <img src="/menu.png" alt="menu" onClick={this.handleClick} />
        <ul className="menu-content">
          <li><a href={this.downloadPayload()} id="downloader" download="notebook.ipynb">Download</a></li>
          <li onClick={this.handleUpload}>Upload</li>
          <li>Cheatsheet</li>
          <li>About</li>
        </ul>
      </div>
    )
  },
});

module.exports = Menu;
