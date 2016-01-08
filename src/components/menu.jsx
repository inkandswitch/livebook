const React = require("react");

let {docToIPy} = require("../ipython-converter.jsx");

const Menu = React.createClass({

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

  doc() {
    return this.props.store.getState().doc
  },

  downloadPayload() {
    document.getElementById("downloader").setAttribute('href','data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(docToIPy(this.doc()),null,2)))
    return true
  },

  handleUpload(event) {
    this.setState({active: false});
    window.history.pushState({}, "Upload", "/upload");
    this.props.render();
  },

  render() {
    let activeClass = this.state.active ? "active" : "";
    return (
      <div className={"menu " + activeClass}>
        <img src="/menu.png" alt="menu" onClick={this.handleClick} />
        <ul className="menu-content">
          <li><a href="/">Home</a></li>
          <li><a id="downloader" onClick={this.downloadPayload} id="downloader" download="notebook.ipynb">Download</a></li>
          <li><a href="/upload">Upload</a></li>
          <li>Cheatsheet</li>
          <li>About</li>
        </ul>
      </div>
    )
  },
});

module.exports = Menu;
