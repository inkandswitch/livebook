var React = require("react");

var Menu = React.createClass({

  getInitialState() {
    return {
      active: false,
      download: false,
    };
  },

  home() {
    window.history.pushState({}, "Home", "/");
    this.props.render();
  },

  handleDownload(event) {
    this.setState({download: true});
  },

  handleClick(event) {
    this.setState({active: !this.state.active});
  },

  downloadPayload() {
    alert("Nope! Can't do it. April fools! (Sorry.)");
    return "";
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
          <li onClick={this.home}><a>Home</a></li>
          <li><a onClick={this.downloadPayload} id="downloader" download="notebook.ipynb">Download</a></li>
          <li><a href="/upload">Upload</a></li>
          <li>Cheatsheet</li>
          <li>About</li>
        </ul>
      </div>
    )
  },
});

module.exports = Menu;
